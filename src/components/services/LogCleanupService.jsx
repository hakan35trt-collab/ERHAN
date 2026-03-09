import { Log } from "@/entities/Log";
import { differenceInDays } from "date-fns";

class LogCleanupService {
    constructor() {
        this.isRunning = false;
        this.checkInterval = null;
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log("🧹 Log Temizleme Servisi başlatıldı.");
        
        this.performCleanup();
        
        this.checkInterval = setInterval(() => {
            this.performCleanup();
        }, 24 * 60 * 60 * 1000);
    }

    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.isRunning = false;
        console.log("🛑 Log Temizleme Servisi durduruldu.");
    }

    async performCleanup() {
        const lockKey = 'logCleanupLock';
        const now = new Date();
        const nowTimestamp = now.getTime();

        const lockAcquiredAt = parseInt(localStorage.getItem(lockKey) || '0', 10);
        if (lockAcquiredAt && (nowTimestamp - lockAcquiredAt) < 15 * 60 * 1000) {
            console.log("🧹 Log temizleme işlemi zaten başka bir sekmede çalışıyor veya kısa süre önce başlatıldı. Atlanıyor.");
            return;
        }

        let cleanupPerformedThisRun = false;

        try {
            const lastCleanup = localStorage.getItem('lastLogCleanup');
            
            if (!lastCleanup || differenceInDays(now, new Date(lastCleanup)) >= 7) {
                localStorage.setItem(lockKey, nowTimestamp.toString());
                cleanupPerformedThisRun = true;

                console.log("📅 7 gün doldu. Log temizleme başlıyor...");
                
                const allLogs = await Log.list();
                let deletedCount = 0;

                // Performans iyileştirmesi: Paralel silme işlemleri
                const deletePromises = allLogs.map(async (log) => {
                    try {
                        await Log.delete(log.id);
                        return { success: true };
                    } catch (error) {
                        if (error.message?.includes('not found') || error.message?.toLowerCase().includes('404')) {
                            return { success: true, skipped: true };
                        }
                        console.error(`Log ${log.id} silinemedi:`, error);
                        return { success: false };
                    }
                });

                const results = await Promise.all(deletePromises);
                deletedCount = results.filter(r => r.success).length;

                localStorage.setItem('lastLogCleanup', now.toISOString());
                
                console.log(`🎉 Otomatik log temizleme tamamlandı! ${deletedCount} log silindi.`);
                
                if (deletedCount > 0) {
                    try {
                        await Log.create({
                            action: "OTOMATİK TEMİZLEME",
                            details: `Sistem tarafından ${deletedCount} log kaydı otomatik olarak temizlendi (7 günlük periyot).`,
                            user_name: "SİSTEM"
                        });
                    } catch (logError) {
                        console.warn("Temizleme logu eklenemedi:", logError);
                    }
                }

            } else {
                const daysSinceLastCleanup = differenceInDays(now, new Date(lastCleanup));
                console.log(`⏰ Son temizlemeden ${daysSinceLastCleanup} gün geçti. Henüz temizleme zamanı değil.`);
            }
        } catch (error) {
            console.error("💥 Log temizleme sırasında hata oluştu:", error);
        } finally {
            if (cleanupPerformedThisRun) {
                const currentLock = localStorage.getItem(lockKey);
                if (currentLock === nowTimestamp.toString()) {
                    localStorage.removeItem(lockKey);
                }
            }
        }
    }
}

export const logCleanupService = new LogCleanupService();