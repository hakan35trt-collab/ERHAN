import React, { useState, useEffect } from 'react';
import { ShiftConfiguration } from '@/entities/ShiftConfiguration';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Save, Users, CalendarClock, Shield, Sun, Moon, Coffee, UserX } from 'lucide-react';

const generateUniqueId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const ShiftTypeSelect = ({ value, onChange }) => {
    const shiftTypes = {
        gunduz: { label: 'Gündüz', icon: <Sun className="w-4 h-4" />, triggerClass: 'bg-yellow-500/20 border-yellow-500 text-yellow-300', itemClass: 'text-yellow-300' },
        gece:   { label: 'Gece',   icon: <Moon className="w-4 h-4" />, triggerClass: 'bg-blue-500/20 border-blue-500 text-blue-300', itemClass: 'text-blue-300' },
        tatil:  { label: 'İzinli', icon: <Coffee className="w-4 h-4" />, triggerClass: 'bg-red-500/20 border-red-500 text-red-300', itemClass: 'text-red-300' }
    };
    const currentShift = shiftTypes[value] || shiftTypes.gunduz;

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={`w-full h-10 text-xs font-semibold transition-colors border-2 ${currentShift.triggerClass}`}>
                <div className="flex items-center justify-center gap-1">
                    {currentShift.icon}
                    <span>{currentShift.label}</span>
                </div>
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-amber-700">
                {Object.entries(shiftTypes).map(([key, shift]) => (
                    <SelectItem key={key} value={key} className={`focus:bg-gray-700 ${shift.itemClass}`}>
                        <div className="flex items-center gap-2">
                            {shift.icon}
                            <span>{shift.label}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

export default function ShiftManagement() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const user = await User.me();
            setCurrentUser(user);
            const data = await ShiftConfiguration.list();
            if (data.length > 0) {
                const loadedConfig = data[0];
                const personnelWithIds = (loadedConfig.personnel || []).map(p => ({ 
                    ...p, 
                    id: generateUniqueId(),
                    shiftCycle: p.shiftCycle && p.shiftCycle.length === 6 ? p.shiftCycle : ['gunduz', 'gunduz', 'gece', 'gece', 'tatil', 'tatil']
                }));
                const jokersWithIds = (loadedConfig.jokerPersonnel || []).map(j => ({ ...j, id: generateUniqueId() }));
                setConfig({ ...loadedConfig, personnel: personnelWithIds, jokerPersonnel: jokersWithIds });
            } else {
                setConfig({ personnel: [], jokerPersonnel: [] });
            }
        } catch (error) {
            console.error("Vardiya ayarları yüklenemedi:", error);
            setConfig({ personnel: [], jokerPersonnel: [] });
        }
        setLoading(false);
    };

    const handlePersonnelChange = (index, field, value) => {
        const newPersonnel = [...config.personnel];
        newPersonnel[index][field] = value;
        setConfig(prev => ({ ...prev, personnel: newPersonnel }));
    };
    
    const handleShiftCycleChange = (personnelIndex, dayIndex, shiftType) => {
        const newPersonnel = [...config.personnel];
        const newShiftCycle = [...newPersonnel[personnelIndex].shiftCycle];
        newShiftCycle[dayIndex] = shiftType;
        newPersonnel[personnelIndex].shiftCycle = newShiftCycle;
        setConfig(prev => ({ ...prev, personnel: newPersonnel }));
    };

    const addPersonnel = () => {
        const newPersonnel = [...(config.personnel || []), { 
            id: generateUniqueId(), 
            name: '', 
            startDate: '',
            shiftCycle: ['gunduz', 'gunduz', 'gece', 'gece', 'tatil', 'tatil']
        }];
        setConfig(prev => ({ ...prev, personnel: newPersonnel }));
    };

    const removePersonnel = (idToRemove) => {
        const newPersonnel = config.personnel.filter(p => p.id !== idToRemove);
        setConfig(prev => ({ ...prev, personnel: newPersonnel }));
    };

    const handleJokerChange = (index, value) => {
        const newJokers = [...config.jokerPersonnel];
        newJokers[index].name = value;
        setConfig(prev => ({ ...prev, jokerPersonnel: newJokers }));
    };

    const addJoker = () => {
        const newJokers = [...(config.jokerPersonnel || []), { id: generateUniqueId(), name: ''}];
        setConfig(prev => ({ ...prev, jokerPersonnel: newJokers }));
    };
    
    const removeJoker = (idToRemove) => {
        const newJokers = config.jokerPersonnel.filter(j => j.id !== idToRemove);
        setConfig(prev => ({ ...prev, jokerPersonnel: newJokers }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const personnelToSave = (config.personnel || [])
                .filter(p => p.name.trim() && p.startDate)
                .map(({ id, ...rest }) => rest);
            
            const jokersToSave = (config.jokerPersonnel || [])
                .filter(j => j.name.trim())
                .map(({ id, ...rest }) => rest);

            const dataToSave = { 
                personnel: personnelToSave,
                jokerPersonnel: jokersToSave
            };

            if (config.id) {
                await ShiftConfiguration.update(config.id, dataToSave);
            } else {
                await ShiftConfiguration.create(dataToSave);
            }
            
            alert("Vardiya ayarları başarıyla kaydedildi!");
            loadData();
        } catch (error) {
            console.error("Vardiya ayarları kaydedilirken hata:", error);
            alert("Ayarlar kaydedilirken bir hata oluştu. Lütfen tüm gerekli alanları doldurduğunuzdan emin olun.");
        }
        setSaving(false);
    };

    if (loading || !config) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div></div>;
    }
    
    const hasAccess = currentUser && (currentUser.role === 'admin' || currentUser.vip_level === 'vip-3');
    if (!hasAccess) {
        return (
             <div className="p-8 max-w-4xl mx-auto text-center">
                 <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
                 <h2 className="text-2xl font-bold mb-2 text-yellow-400">Yetki Yok</h2>
                 <p className="text-yellow-600">Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-amber-400 flex items-center"><CalendarClock className="mr-3 w-8 h-8" />Vardiya Yönetimi</h1>
                <Button size="lg" onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-black font-bold shadow-lg shadow-amber-600/20">
                    <Save className="w-5 h-5 mr-2"/>
                    {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </Button>
            </div>
            
            <Card className="bg-gray-800/50 border-2 border-amber-600/50 mb-8">
                <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-amber-600/30">
                    <CardTitle className="text-amber-400 flex items-center"><Users className="mr-3 w-6 h-6"/>Personel Vardiya Döngüleri</CardTitle>
                    <Button size="sm" onClick={addPersonnel} className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"><Plus className="w-4 h-4 mr-1"/>Personel Ekle</Button>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-6">
                    {config.personnel.map((person, index) => (
                        <div key={person.id} className="bg-gray-700/60 rounded-xl p-4 border border-amber-600/20 relative transition-all hover:border-amber-600/40 group">
                            <Button onClick={() => removePersonnel(person.id)} variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-red-500 hover:bg-red-500/20 hover:text-red-400 opacity-50 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-4">
                                <div className="lg:col-span-1 space-y-4">
                                    <div>
                                        <Label className="text-yellow-400">Personel Adı</Label>
                                        <Input 
                                            value={person.name} 
                                            onChange={(e) => handlePersonnelChange(index, 'name', e.target.value.toUpperCase())}
                                            className="bg-gray-800 border-amber-500 text-white"
                                            placeholder="PERSONEL ADI"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-yellow-400">Döngü Başlangıç Tarihi</Label>
                                        <Input 
                                            type="date"
                                            value={person.startDate}
                                            onChange={(e) => handlePersonnelChange(index, 'startDate', e.target.value)}
                                            className="bg-gray-800 border-amber-500 text-white"
                                        />
                                    </div>
                                </div>
                                
                                <div className="lg:col-span-2">
                                    <Label className="text-yellow-400 mb-2 block">6 Günlük Vardiya Döngüsü</Label>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                        {person.shiftCycle.map((shift, dayIndex) => (
                                            <div key={dayIndex} className="text-center">
                                                <div className="text-xs text-amber-500 mb-1">Gün {dayIndex + 1}</div>
                                                <ShiftTypeSelect
                                                    value={shift}
                                                    onChange={(value) => handleShiftCycleChange(index, dayIndex, value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-2">
                                        Bu 6 günlük döngü, başlangıç tarihinden itibaren sürekli tekrar edecektir.
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {config.personnel.length === 0 && (
                        <div className="text-center py-8 text-yellow-600">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="font-semibold">Henüz personel eklenmemiş.</p>
                            <p className="text-sm">Yukarıdaki "Personel Ekle" butonu ile başlayabilirsiniz.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-2 border-amber-600/50">
                <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-amber-600/30">
                    <CardTitle className="text-amber-400 flex items-center"><UserX className="mr-3 w-6 h-6"/>Joker Personel</CardTitle>
                    <Button size="sm" onClick={addJoker} className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"><Plus className="w-4 h-4 mr-1"/>Joker Ekle</Button>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                    {config.jokerPersonnel.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {config.jokerPersonnel.map((joker, index) => (
                                <div key={joker.id} className="relative group">
                                    <Input 
                                        value={joker.name} 
                                        onChange={(e) => handleJokerChange(index, e.target.value.toUpperCase())}
                                        className="bg-gray-700 border-amber-600/50 text-white"
                                        placeholder="JOKER ADI"
                                    />
                                    <Button onClick={() => removeJoker(joker.id)} variant="ghost" size="icon" className="absolute top-1/2 -translate-y-1/2 right-1 h-7 w-7 text-red-500 hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-8 text-yellow-600">
                            <UserX className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="font-semibold">Henüz joker personel eklenmemiş.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}