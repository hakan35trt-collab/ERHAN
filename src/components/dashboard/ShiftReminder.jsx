import React, { useState, useEffect, useRef } from "react";
import { AlarmClock, CheckCircle, Utensils } from 'lucide-react';
import { playNotificationSound } from "@/components/lib/sounds";

const ShiftReminder = () => {
    const [reminder, setReminder] = useState(null);
    const prevMessageRef = useRef();

    useEffect(() => {
        const importantMessages = [
            "ÖĞLE YEMEĞİ VAKTİ",
            "ÖĞLE YEMEĞİ YAKLAŞIYOR",
            "12 SAAT VARDİYASI BİTİYOR!",
            "FABRİKA MESAİSİ BİTİYOR!"
        ];

        // Play sound only if the message has changed to an important one
        if (prevMessageRef.current !== reminder?.message) {
            if (reminder?.message && importantMessages.some(importantMsg => reminder.message.includes(importantMsg))) {
                playNotificationSound();
            }
            prevMessageRef.current = reminder?.message;
        }
    }, [reminder]);

    useEffect(() => {
        const calculateReminder = () => {
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const isSunday = now.getDay() === 0;

            // 1. Öğle Yemeği Hatırlatıcısı (Pazar hariç)
            if (!isSunday) {
                const lunchStart = new Date(`${todayStr}T12:00:00`);
                const lunchEnd = new Date(`${todayStr}T13:00:00`);
                const lunchWarning = new Date(`${todayStr}T11:55:00`);

                if (now >= lunchStart && now < lunchEnd) {
                    setReminder({
                        message: "ÖĞLE YEMEĞİ VAKTİ",
                        details: "Afiyet olsun! Saat 13:00'a kadar mola.",
                        icon: <Utensils className="w-5 h-5" />,
                        color: "from-green-600 to-green-700"
                    });
                    return;
                }
                
                if (now >= lunchWarning && now < lunchStart) {
                    const diffMinutes = Math.floor((lunchStart - now) / 60000);
                    setReminder({
                        message: "ÖĞLE YEMEĞİ YAKLAŞIYOR",
                        details: `${diffMinutes} dakika kaldı`,
                        icon: <Utensils className="w-5 h-5 animate-pulse" />,
                        color: "from-orange-600 to-orange-700"
                    });
                    return;
                }
            }

            // 2. Vardiya olaylarını tanımla
            const securityShift = { name: "12 Saat Vardiyası", endTime: new Date(`${todayStr}T19:30:00`) };
            let factoryShift = null;
            if (!isSunday) {
                factoryShift = { name: "Fabrika Mesaisi", endTime: new Date(`${todayStr}T18:30:00`) };
            }
            
            const shifts = [securityShift];
            if (factoryShift) {
                shifts.push(factoryShift);
            }

            // 3. Biten olayları kontrol et
            // Fabrika mesaisi bitti (20 dakika gösterilir)
            if (factoryShift) {
                 const factoryEndGracePeriod = new Date(factoryShift.endTime.getTime() + 20 * 60 * 1000);
                 if (now >= factoryShift.endTime && now < factoryEndGracePeriod) {
                     setReminder({
                        message: "FABRİKA MESAİSİ TAMAMLANDI",
                        details: "Güvenlik personeli görevine devam ediyor.",
                        icon: <CheckCircle className="w-5 h-5" />,
                        color: "from-gray-600 to-gray-700"
                    });
                    return;
                 }
            }
            // Güvenlik vardiyası bitti (5 dakika gösterilir)
            const securityEndGracePeriod = new Date(securityShift.endTime.getTime() + 5 * 60 * 1000);
            if (now >= securityShift.endTime && now < securityEndGracePeriod) {
                setReminder({
                    message: `${securityShift.name.toUpperCase()} BİTTİ!`,
                    details: "İyi dinlenmeler.",
                    icon: <CheckCircle className="w-5 h-5" />,
                    color: "from-purple-600 to-purple-700"
                });
                return;
            }

            // 4. Yaklaşan vardiya bitişini bul (son 30 dakika)
            const upcomingShifts = shifts
                .filter(event => event.endTime > now)
                .sort((a, b) => a.endTime - b.endTime);

            if (upcomingShifts.length > 0) {
                const nextShift = upcomingShifts[0];
                const diffMillis = nextShift.endTime - now;
                const diffMinutes = Math.floor(diffMillis / 60000);
                
                if (diffMinutes <= 30) {
                     setReminder({
                        message: `${nextShift.name.toUpperCase()} BİTİYOR!`,
                        details: `${diffMinutes} dakika kaldı`,
                        icon: <AlarmClock className="w-5 h-5 animate-pulse" />,
                        color: "from-red-600 to-red-700"
                    });
                    return; 
                }
            }

            // Hiçbir koşul uymuyorsa temizle
            setReminder(null);
        };

        calculateReminder();
        const interval = setInterval(calculateReminder, 5000); // 5 saniyede bir kontrol et
        return () => clearInterval(interval);
    }, []);

    // Eğer bir hatırlatıcı yoksa veya mesajı boşsa bileşeni render etme
    if (!reminder || !reminder.message) {
        return null;
    }

    return (
        <div className={`p-3 rounded-lg bg-gradient-to-r ${reminder.color} border border-yellow-600/30 flex items-center space-x-3 shadow-lg mb-4 transition-all duration-500`}>
            <div className="text-yellow-400 flex-shrink-0">
                {reminder.icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-yellow-400 tracking-wide truncate">{reminder.message}</p>
                <p className="text-xs text-yellow-600 truncate">{reminder.details}</p>
            </div>
        </div>
    );
};

export default ShiftReminder;