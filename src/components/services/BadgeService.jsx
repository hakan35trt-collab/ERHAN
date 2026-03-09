import { base44 } from "@/api/base44Client";
import { startOfMonth, endOfMonth, format } from "date-fns";

const Visitor = base44.entities.Visitor;
const Badge = base44.entities.Badge;

class BadgeService {
  constructor() {
    this.isRunning = false;
    this.checkInterval = null;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("🏆 Badge Service başlatıldı.");
    
    // Her saat kontrol et
    this.checkInterval = setInterval(() => {
      this.updateBadges();
    }, 60 * 60 * 1000);
    
    // İlk başlatmada hemen güncelle
    this.updateBadges();
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log("🛑 Badge Service durduruldu.");
  }

  async updateBadges() {
    console.log("🏆 Rozetler güncelleniyor...");
    
    try {
      // Günlük/Haftalık Top 3 rozetleri
      await this.updateTopRecordersBadges();
      
      // Aylık şampiyon rozeti
      await this.updateMonthlyChampionBadge();
    } catch (error) {
      console.error("❌ Rozet güncelleme hatası:", error);
    }
  }

  async updateTopRecordersBadges() {
    try {
      // Son 7 günün kayıtlarını al
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const visitors = await Visitor.list('-created_date', 5000);
      
      // Kayıt yapan personel bazında say
      const stats = {};
      visitors.forEach(v => {
        if (v.registered_by_id && v.created_date) {
          const createdDate = new Date(v.created_date);
          if (createdDate >= sevenDaysAgo) {
            stats[v.registered_by_id] = (stats[v.registered_by_id] || 0) + 1;
          }
        }
      });

      // Sıralama
      const sortedUsers = Object.entries(stats)
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count);

      // Mevcut top badges'leri temizle
      const existingBadges = await Badge.filter({ 
        badge_type: { $in: ['top_1', 'top_2', 'top_3'] } 
      }, '-created_date', 1000);
      
      for (const badge of existingBadges) {
        await Badge.delete(badge.id);
      }

      // Yeni rozetler ver
      const badgeTypes = [
        { type: 'top_1', title: '🥇 1. Sıra', icon: '🥇', color: 'gold' },
        { type: 'top_2', title: '🥈 2. Sıra', icon: '🥈', color: 'silver' },
        { type: 'top_3', title: '🥉 3. Sıra', icon: '🥉', color: 'bronze' }
      ];

      for (let i = 0; i < Math.min(3, sortedUsers.length); i++) {
        const user = sortedUsers[i];
        const badgeInfo = badgeTypes[i];
        
        await Badge.create({
          user_id: user.userId,
          badge_type: badgeInfo.type,
          title: badgeInfo.title,
          description: `Son 7 günde ${user.count} kayıt ile ${i + 1}. sırada`,
          icon: badgeInfo.icon,
          color: badgeInfo.color,
          awarded_at: new Date().toISOString(),
          is_active: true,
          stats: { record_count: user.count }
        });
      }

      console.log(`✅ Top 3 rozetleri güncellendi`);
    } catch (error) {
      console.error("❌ Top rozetleri güncelleme hatası:", error);
    }
  }

  async updateMonthlyChampionBadge() {
    try {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Bu ay sona ermişse kontrol et
      if (now.getDate() === 1) {
        // Geçen ayın verilerini al
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthStart = startOfMonth(lastMonth);
        const lastMonthEnd = endOfMonth(lastMonth);

        const visitors = await Visitor.list('-created_date', 10000);
        
        const stats = {};
        visitors.forEach(v => {
          if (v.registered_by_id && v.created_date) {
            const createdDate = new Date(v.created_date);
            if (createdDate >= lastMonthStart && createdDate <= lastMonthEnd) {
              stats[v.registered_by_id] = (stats[v.registered_by_id] || 0) + 1;
            }
          }
        });

        // En çok kayıt yapanı bul
        const sortedUsers = Object.entries(stats)
          .map(([userId, count]) => ({ userId, count }))
          .sort((a, b) => b.count - a.count);

        if (sortedUsers.length > 0) {
          const champion = sortedUsers[0];
          
          // Eski aylık şampiyon rozetlerini kaldır
          const oldBadges = await Badge.filter({ 
            badge_type: 'monthly_champion' 
          }, '-created_date', 100);
          
          for (const badge of oldBadges) {
            await Badge.delete(badge.id);
          }

          // Yeni şampiyon rozeti ver
          await Badge.create({
            user_id: champion.userId,
            badge_type: 'monthly_champion',
            title: '👑 Ayın Şampiyonu',
            description: `${format(lastMonth, 'MMMM yyyy')} ayında ${champion.count} kayıt ile şampiyon`,
            icon: '👑',
            color: 'purple',
            awarded_at: new Date().toISOString(),
            expires_at: endOfMonth(now).toISOString(),
            is_active: true,
            stats: { record_count: champion.count, month: format(lastMonth, 'yyyy-MM') }
          });

          console.log(`✅ Aylık şampiyon rozeti verildi`);
        }
      }
    } catch (error) {
      console.error("❌ Aylık şampiyon rozeti hatası:", error);
    }
  }
}

export const badgeService = new BadgeService();