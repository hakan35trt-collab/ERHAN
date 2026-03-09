
import React, { useState, useEffect } from 'react';
import { ShiftConfiguration } from '@/entities/ShiftConfiguration';
import { differenceInDays } from 'date-fns';
import { Sun, Moon, Coffee } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const ShiftDisplay = () => {
    const [dayShift, setDayShift] = useState([]);
    const [nightShift, setNightShift] = useState([]);
    const [offDuty, setOffDuty] = useState([]);
    const [loading, setLoading] = useState(true);

    // State for cycling through names
    const [dayIndex, setDayIndex] = useState(0);
    const [nightIndex, setNightIndex] = useState(0);
    const [offIndex, setOffIndex] = useState(0);

    useEffect(() => {
        const fetchAndCalculateShifts = async () => {
            setLoading(true);
            try {
                const configData = await ShiftConfiguration.list();
                if (configData.length > 0 && configData[0].personnel) {
                    const config = configData[0];
                    const today = new Date();
                    
                    const day = [];
                    const night = [];
                    const off = [];

                    config.personnel.forEach(person => {
                        if (!person.startDate || !person.shiftCycle) return;

                        const daysDiff = differenceInDays(today, new Date(person.startDate));
                        const cyclePosition = ((daysDiff % 6) + 6) % 6;
                        const currentShift = person.shiftCycle[cyclePosition];

                        if (currentShift === 'gunduz') day.push(person.name);
                        else if (currentShift === 'gece') night.push(person.name);
                        else if (currentShift === 'tatil') off.push(person.name);
                    });

                    setDayShift(day);
                    setNightShift(night);
                    setOffDuty(off);
                }
            } catch (error) {
                console.error("Vardiya durumu hesaplanamadı:", error);
            }
            setLoading(false);
        };

        fetchAndCalculateShifts();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (dayShift.length > 1) setDayIndex(prev => (prev + 1) % dayShift.length);
            if (nightShift.length > 1) setNightIndex(prev => (prev + 1) % nightShift.length);
            if (offDuty.length > 1) setOffIndex(prev => (prev + 1) % offDuty.length);
        }, 3000); // Change name every 3 seconds

        return () => clearInterval(interval);
    }, [dayShift, nightShift, offDuty]);

    const renderShiftRow = (icon, label, names, index, colorClass) => {
        const currentName = names.length > 0 ? names[index] : "---";
        return (
            <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 ${colorClass}`}>
                    {icon}
                    <span className="text-[10px] font-semibold">{label}</span>
                </div>
                <div className="relative w-28 h-4 overflow-hidden">
                    <AnimatePresence>
                        <motion.div
                            key={currentName + index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4 }}
                            className="absolute inset-0 flex items-center text-white text-[11px] leading-tight font-medium truncate"
                        >
                            {currentName}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="bg-gray-800/60 rounded-md px-2 py-1 text-xs text-amber-500">
                Yükleniyor...
            </div>
        );
    }
    
    const hasData = dayShift.length > 0 || nightShift.length > 0 || offDuty.length > 0;

    if (!hasData) {
        return null; // Don't show anything if no data
    }

    return (
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-amber-600/40 rounded-lg p-2 backdrop-blur-sm shadow-lg space-y-1.5">
            <h3 className="text-center font-semibold text-amber-500 text-[10px] uppercase tracking-wide">
                Günlük Vardiya
            </h3>
            <div className="space-y-1">
                {renderShiftRow(<Sun className="w-3 h-3" />, "Gündüz", dayShift, dayIndex, "text-yellow-400")}
                {renderShiftRow(<Moon className="w-3 h-3" />, "Gece", nightShift, nightIndex, "text-blue-400")}
                {renderShiftRow(<Coffee className="w-3 h-3" />, "İzinli", offDuty, offIndex, "text-red-400")}
            </div>
        </div>
    );
};

export default ShiftDisplay;
