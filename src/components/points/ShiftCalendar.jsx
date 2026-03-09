import React, { useState, useEffect } from 'react';
import { ShiftConfiguration } from '@/entities/ShiftConfiguration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Sun, Moon, Coffee, ChevronLeft, ChevronRight, Calendar, AlertTriangle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const ShiftBadge = ({ shift }) => {
    const styles = {
        'Gündüz': { icon: <Sun className="w-3.5 h-3.5" />, className: 'bg-yellow-400/20 text-yellow-300 border-yellow-500' },
        'Gece': { icon: <Moon className="w-3.5 h-3.5" />, className: 'bg-blue-400/20 text-blue-300 border-blue-500' },
        'İzinli': { icon: <Coffee className="w-3.5 h-3.5" />, className: 'bg-red-400/20 text-red-300 border-red-500' },
        'N/A': { icon: null, className: 'bg-gray-400/20 text-gray-300 border-gray-500' }
    };
    const style = styles[shift] || styles['N/A'];
    return (
        <Badge variant="outline" className={`flex items-center justify-center gap-1.5 w-20 h-6 text-xs font-semibold ${style.className}`}>
            {style.icon}
            <span className="truncate">{shift === 'N/A' ? 'N/A' : shift}</span>
        </Badge>
    );
};

export default function ShiftCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [personnel, setPersonnel] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true);
            try {
                const configData = await ShiftConfiguration.list();
                if (configData.length > 0 && configData[0].personnel) {
                    setPersonnel(configData[0].personnel);
                }
            } catch (error) {
                console.error("Vardiya ayarları yüklenemedi:", error);
            }
            setLoading(false);
        };
        fetchConfig();
    }, []);

    const getShiftForDay = (person, date) => {
        if (!person.startDate || !person.shiftCycle || person.shiftCycle.length !== 6) {
            return 'N/A';
        }
        
        const daysDiff = differenceInDays(date, new Date(person.startDate));
        const cycleIndex = ((daysDiff % 6) + 6) % 6; // Ensure positive result for past dates
        const shiftType = person.shiftCycle[cycleIndex];
        
        switch (shiftType) {
            case 'gunduz': return 'Gündüz';
            case 'gece': return 'Gece';
            case 'tatil': return 'İzinli';
            default: return 'N/A';
        }
    };

    const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
    const handleGoToToday = () => setCurrentDate(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    if (loading) {
        return <div className="text-center p-8 text-amber-500">Vardiya takvimi yükleniyor...</div>;
    }

    if (personnel.length === 0) {
        return (
            <Card className="bg-gray-800 border-amber-600 mt-6">
                <CardContent className="p-6 text-center">
                    <AlertTriangle className="w-12 h-12 mx-auto text-orange-400 mb-4" />
                    <h3 className="text-lg font-semibold text-amber-400">Vardiya Ayarları Eksik</h3>
                    <p className="text-amber-600 mb-4">Takvimi görüntülemek için önce personel ve vardiya döngülerini ayarlamanız gerekir.</p>
                    <Button asChild className="bg-amber-600 hover:bg-amber-700 text-black">
                        <Link to={createPageUrl('ShiftManagement')}>Ayarlara Git</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="bg-gray-800 border-amber-600 mt-6">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-amber-600/30">
                <CardTitle className="text-amber-400 text-xl font-bold">
                    {format(currentDate, 'MMMM yyyy', { locale: tr })}
                </CardTitle>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <Button onClick={handleGoToToday} variant="outline" className="h-9 border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-black">
                        Bugün
                    </Button>
                    <Button onClick={handlePrevMonth} size="icon" variant="ghost" className="h-9 w-9 text-amber-400 hover:bg-gray-700">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button onClick={handleNextMonth} size="icon" variant="ghost" className="h-9 w-9 text-amber-400 hover:bg-gray-700">
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[60vh]">
                    <Table className="min-w-full">
                        <TableHeader className="sticky top-0 bg-gray-800/80 backdrop-blur-sm z-10">
                            <TableRow className="border-amber-600/30">
                                <TableHead className="w-32 text-amber-400 font-semibold text-sm">Tarih</TableHead>
                                {personnel.map(p => (
                                    <TableHead key={p.name} className="text-amber-400 font-semibold text-center text-sm min-w-[100px]">{p.name}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {daysInMonth.map(day => (
                                <TableRow key={day.toString()} className={`border-amber-600/20 ${isToday(day) ? 'bg-amber-600/10' : ''}`}>
                                    <TableCell className={`font-medium text-sm ${isToday(day) ? 'text-amber-300' : 'text-gray-300'}`}>
                                        <div className="flex flex-col">
                                            <span>{format(day, 'dd MMM', { locale: tr })}</span>
                                            <span className="text-xs text-gray-400">{format(day, 'EEE', { locale: tr })}</span>
                                        </div>
                                    </TableCell>
                                    {personnel.map(p => (
                                        <TableCell key={`${p.name}-${day}`} className="text-center">
                                            <ShiftBadge shift={getShiftForDay(p, day)} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}