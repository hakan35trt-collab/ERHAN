import { User } from "@/entities/User";
import { format, differenceInDays } from "date-fns";

class DailyUpdateService {
    constructor() {
        this.isRunning = false;
        this.checkInterval = null;
        this.lastUpdateDate = null;
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log("🚀 Daily Update Service başlatıldı.");
        
        // Servis başladığında hemen bir kontrol yap.
        this.initialize();
        
        // Ayrıca, uygulama açık kalırsa diye periyodik olarak kontrol etmeye devam et.
        this.checkInterval = setInterval(() => {
            this.periodicCheck();
        }, 5 * 60 * 1000); // 5 dakikada bir
    }

    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.isRunning = false;
        console.log("🛑 Daily Update Service durduruldu.");
    }

    // Uygulama ilk açıldığında veya periyodik olarak çağrılır.
    initialize() {
        const lastUpdate = localStorage.getItem('lastDailyUpdate');
        const todayString = this.getTurkeyDateString();

        console.log(`🔎 Günlük güncelleme kontrolü: Son güncelleme '${lastUpdate}', Bugün '${todayString}'`);
        
        this.lastUpdateDate = lastUpdate;
        
        // Eğer son güncelleme tarihi bugünün tarihi değilse, güncelleme yap.
        if (lastUpdate !== todayString) {
            console.log("🌅 Yeni gün algılandı! Günlük güncelleme tetikleniyor...");
            this.performDailyUpdate();
        } else {
            console.log("✅ Güncelleme bugün zaten yapılmış.");
        }
    }
    
    // Uygulama açık kaldığında gece yarısını geçme ihtimaline karşı.
    periodicCheck() {
        const todayString = this.getTurkeyDateString();
        if (this.lastUpdateDate !== todayString) {
             console.log("🕰️ Gece yarısı geçildi (periyodik kontrol). Güncelleme tetikleniyor...");
             this.performDailyUpdate();
        }
    }

    async performDailyUpdate() {
        console.log("📈 Tüm kullanıcıların kıdem günlerini hesaplama işlemi başladı...");
        const todayString = this.getTurkeyDateString();

        try {
            const allUsers = await User.list();
            let updatedCount = 0;

            for (const user of allUsers) {
                if (user.hire_date) {
                    try {
                        // +1 eklendi - başladığın gün 1. gün
                        const daysSinceHire = differenceInDays(new Date(), new Date(user.hire_date)) + 1;
                        
                        // Kullanıcının level'ı gün sayısıyla eşleşmiyorsa güncelle
                        if (user.level !== daysSinceHire) {
                            await User.update(user.id, {
                                level: daysSinceHire
                            });
                            
                            updatedCount++;
                            console.log(`✅ ${user.first_name || user.email} - Yeni Gün Sayısı: ${daysSinceHire}`);
                        }
                    } catch (userError) {
                        console.error(`❌ ${user.first_name || user.email} güncellenemedi:`, userError);
                    }
                }
            }

            // Aylık ve haftalık performans rozetleri kontrolü
            await this.checkMonthlyTopPerformer(allUsers);
            await this.checkWeeklyTopPerformer(allUsers);

            // Güncelleme tarihini hem serviste hem de local storage'da güncelle.
            this.lastUpdateDate = todayString;
            localStorage.setItem('lastDailyUpdate', todayString);
            
            console.log(`🎉 Günlük güncelleme tamamlandı! ${updatedCount} kullanıcı güncellendi.`);
            
        } catch (error) {
            console.error("💥 Günlük güncelleme sırasında genel bir hata oluştu:", error);
        }
    }

    async checkMonthlyTopPerformer(allUsers) {
        try {
            const { Visitor } = await import('@/entities/Visitor');
            
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
            
            // Geçen ayın kayıtlarını çek
            const visitors = await Visitor.list('-created_date', 10000);
            const lastMonthVisitors = visitors.filter(v => {
                const vDate = new Date(v.created_date);
                return vDate >= lastMonth && vDate <= lastMonthEnd;
            });

            // Kullanıcı bazında kayıt sayısı
            const userRecords = {};
            lastMonthVisitors.forEach(v => {
                if (v.registered_by_id) {
                    userRecords[v.registered_by_id] = (userRecords[v.registered_by_id] || 0) + 1;
                }
            });

            // En çok kayıt yapanı bul
            let topUserId = null;
            let topCount = 0;
            Object.entries(userRecords).forEach(([userId, count]) => {
                if (count > topCount) {
                    topCount = count;
                    topUserId = userId;
                }
            });

            if (topUserId && topCount > 0) {
                // Tüm kullanıcıları kontrol et
                for (const user of allUsers) {
                    const currentBadges = user.badges || [];
                    
                    if (user.id === topUserId) {
                        // Birinci olan kullanıcı - rozet ekle
                        if (user.monthly_top_performer !== lastMonthKey) {
                            await User.update(user.id, {
                                monthly_top_performer: lastMonthKey,
                                badges: [
                                    ...currentBadges.filter(b => b.id !== 'monthly_champion'),
                                    {
                                        id: 'monthly_champion',
                                        name: `${lastMonthKey} Ayın Şampiyonu`,
                                        icon: '🏆',
                                        color: 'gold',
                                        earned_date: new Date().toISOString()
                                    }
                                ]
                            });
                        }
                    } else {
                        // Birinci olmayan kullanıcılar - rozeti kaldır
                        if (user.monthly_top_performer === lastMonthKey) {
                            await User.update(user.id, {
                                monthly_top_performer: null,
                                badges: currentBadges.filter(b => b.id !== 'monthly_champion')
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Aylık birinci kontrolü hatası:', error);
        }
    }
    
    // Türkiye saatine göre (UTC+3) tarih stringi döndürür.
    getTurkeyDateString() {
        const now = new Date();
        const turkeyTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
        return format(turkeyTime, 'yyyy-MM-dd');
    }
}

// Singleton instance
export const dailyUpdateService = new DailyUpdateService();