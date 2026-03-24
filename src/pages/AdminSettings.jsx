import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { AuthorizationConfig } from '@/entities/AuthorizationConfig';
import { VisitType } from '@/entities/VisitType';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from "@/components/ui/checkbox"
import { motion } from 'framer-motion';
import { Settings, Users, Save, ShieldAlert, FileText, Crown, List, Plus, Trash2, Edit, Check, X, Key, Eye, EyeOff, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { updateGithubToken, clearGithubToken, getActiveTokenInfo } from '@/lib/githubStore';

export default function AdminSettings() {
    const [config, setConfig] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedRecipients, setSelectedRecipients] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [visitTypes, setVisitTypes] = useState([]);
    const [newTypeName, setNewTypeName] = useState('');
    const [newTypeDescription, setNewTypeDescription] = useState('');
    const [editingTypeId, setEditingTypeId] = useState(null);
    const [editingTypeName, setEditingTypeName] = useState('');
    const [editingTypeDescription, setEditingTypeDescription] = useState('');

    // GitHub Token state
    const [tokenInput, setTokenInput] = useState('');
    const [showToken, setShowToken] = useState(false);
    const [tokenSaving, setTokenSaving] = useState(false);
    const [tokenInfo, setTokenInfo] = useState(getActiveTokenInfo());

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const users = await User.list();
            setAllUsers(users);

            const configs = await AuthorizationConfig.list('', 1);
            if (configs.length > 0) {
                const loadedConfig = configs[0];
                setConfig(loadedConfig);
                setSelectedRecipients(new Set(loadedConfig.recipient_user_ids || []));
            } else {
                // Set a default config if none exists
                const defaultConfig = {
                    recipient_user_ids: [],
                    page_title: "VIP YETKİ ALMA",
                    page_subtitle: "Sistemi daha etkin kullanabilmek için VIP yetkisi alabilirsiniz.",
                    banner_text: "",
                    features_vip1: ["Ziyaretçi listesi görüntüleme", "İçerideki ziyaretçiler takibi"],
                    features_vip2: ["VIP-1 tüm yetkileri", "Ziyaretçi kayıt yapma"],
                    features_vip3: ["VIP-2 tüm yetkileri", "Kullanıcı yönetimi"]
                };
                setConfig(defaultConfig);
            }

            // Load visit types
            const types = await VisitType.filter({ is_active: true }, 'order', 100);
            setVisitTypes(types);
        } catch (error) {
            console.error("Ayarlar yüklenemedi:", error);
        }
        setLoading(false);
    };

    const handleRecipientToggle = (userId) => {
        const newSelection = new Set(selectedRecipients);
        if (newSelection.has(userId)) {
            newSelection.delete(userId);
        } else {
            newSelection.add(userId);
        }
        setSelectedRecipients(newSelection);
    };

    const handleSave = async () => {
        setSaving(true);
        const updatedConfigData = {
            ...config,
            recipient_user_ids: Array.from(selectedRecipients)
        };

        try {
            if (config && config.id) {
                await AuthorizationConfig.update(config.id, updatedConfigData);
            } else {
                const newConfig = await AuthorizationConfig.create(updatedConfigData);
                setConfig(newConfig);
            }
            alert("Ayarlar başarıyla kaydedildi!");
        } catch (error) {
            console.error("Ayarlar kaydedilemedi:", error);
            alert("Ayarlar kaydedilirken bir hata oluştu.");
        }
        setSaving(false);
    };

    const handleTextChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };
    
    const handleFeaturesChange = (e, vipLevel) => {
        const { value } = e.target;
        setConfig(prev => ({ ...prev, [vipLevel]: value.split('\\n') }));
    };

    const handleAddType = async () => {
        if (!newTypeName.trim()) {
            toast.error('Tür adı boş olamaz!');
            return;
        }
        try {
            await VisitType.create({ name: newTypeName.toLowerCase(), description: newTypeDescription.trim(), order: visitTypes.length, is_active: true });
            setNewTypeName(''); setNewTypeDescription(''); await loadData(); toast.success('Tür eklendi!');
        } catch (error) {
            console.error('Tür eklenemedi:', error);
            toast.error('Tür eklenirken hata oluştu!');
        }
    };

    const handleDeleteType = async (typeId) => {
        if (!window.confirm('Bu türü silmek istediğinizden emin misiniz?')) return;
        try {
            await VisitType.delete(typeId);
            await loadData();
            toast.success('Tür silindi!');
        } catch (error) {
            console.error('Tür silinemedi:', error);
            toast.error('Tür silinirken hata oluştu!');
        }
    };

    const handleEditType = (type) => {
        setEditingTypeId(type.id);
        setEditingTypeName(type.name);
        setEditingTypeDescription(type.description || '');
    };

    const handleSaveEditType = async () => {
        if (!editingTypeName.trim()) {
            toast.error('Tür adı boş olamaz!');
            return;
        }
        try {
            await VisitType.update(editingTypeId, { name: editingTypeName.toLowerCase(), description: editingTypeDescription.trim() });
            setEditingTypeId(null); setEditingTypeName(''); setEditingTypeDescription('');
            await loadData();
            toast.success('Tür güncellendi!');
        } catch (error) {
            console.error('Tür güncellenemedi:', error);
            toast.error('Tür güncellenirken hata oluştu!');
        }
    };

    const handleCancelEdit = () => {
        setEditingTypeId(null);
        setEditingTypeName('');
    };

    const handleSaveToken = async () => {
        if (!tokenInput.trim()) { toast.error('Token boş olamaz!'); return; }
        setTokenSaving(true);
        try {
            const ok = updateGithubToken(tokenInput.trim());
            if (ok) {
                setTokenInfo(getActiveTokenInfo());
                setTokenInput('');
                toast.success('GitHub token başarıyla güncellendi! Sayfa yenilenecek...');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                toast.error('Geçersiz token formatı.');
            }
        } catch (e) {
            toast.error('Token kaydedilemedi: ' + e.message);
        }
        setTokenSaving(false);
    };

    const handleClearToken = () => {
        if (!window.confirm('Admin tarafından kaydedilmiş token silinecek. Devam edilsin mi?')) return;
        clearGithubToken();
        setTokenInfo(getActiveTokenInfo());
        toast.success('Token temizlendi. Sayfa yenilenecek...');
        setTimeout(() => window.location.reload(), 1500);
    };
    
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div></div>;
    }

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">Admin Ayarları</h1>
                <p className="text-lg text-yellow-600 mt-2">Sistem genel ayarlarını buradan yönetin.</p>
            </motion.div>

            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600 border-2 mb-8">
                <CardHeader className="border-b border-yellow-600/50">
                    <CardTitle className="flex items-center space-x-2 text-yellow-400"><Key className="w-5 h-5"/><span>GitHub Token Ayarları</span></CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50 border border-amber-600/30">
                        <CheckCircle className={`w-5 h-5 flex-shrink-0 ${tokenInfo.source === 'admin' ? 'text-green-400' : 'text-yellow-500'}`} />
                        <div>
                            <p className="text-amber-400 text-sm font-semibold">
                                Aktif Token Kaynağı: <span className="text-white">{tokenInfo.source === 'admin' ? 'Admin tarafından ayarlandı' : tokenInfo.source === 'env' ? 'Railway Env Var' : 'Varsayılan (Yerleşik)'}</span>
                            </p>
                            <p className="text-amber-600 text-xs">Önizleme: {tokenInfo.preview}</p>
                        </div>
                    </div>
                    <div>
                        <Label className="text-yellow-400 mb-2 block">Yeni GitHub Token</Label>
                        <div className="relative">
                            <Key className="absolute left-3 top-2.5 w-4 h-4 text-amber-600" />
                            <Input
                                type={showToken ? 'text' : 'password'}
                                value={tokenInput}
                                onChange={e => setTokenInput(e.target.value)}
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                className="bg-gray-800 border-amber-600 text-amber-400 pl-10 pr-10 font-mono text-sm"
                            />
                            <button type="button" onClick={() => setShowToken(p => !p)} className="absolute right-3 top-2.5 text-amber-600 hover:text-amber-400">
                                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-amber-700 text-xs mt-1">GitHub Settings &gt; Developer settings &gt; Personal access tokens adresinden oluşturun. <strong>repo</strong> yetkisi gereklidir.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={handleSaveToken} disabled={tokenSaving || !tokenInput.trim()} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold">
                            <Save className="w-4 h-4 mr-2"/>
                            {tokenSaving ? 'Kaydediliyor...' : 'Token Kaydet'}
                        </Button>
                        {tokenInfo.source === 'admin' && (
                            <Button onClick={handleClearToken} variant="outline" className="border-red-600 text-red-400 hover:bg-red-900/30">
                                <RefreshCw className="w-4 h-4 mr-2"/>
                                Varsayılana Dön
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600 border-2 mb-8">
                <CardHeader className="border-b border-yellow-600/50">
                    <CardTitle className="flex items-center space-x-2 text-yellow-400"><List className="w-5 h-5"/><span>Ziyaret Türleri Yönetimi</span></CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {/* Yeni Tür Ekle */}
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Input 
                                    value={newTypeName}
                                    onChange={(e) => setNewTypeName(e.target.value)}
                                    placeholder="Tür adı (örn: toplanti)"
                                    className="bg-gray-800 border-amber-600 text-amber-400 placeholder-amber-600/50"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddType()}
                                />
                                <Button onClick={handleAddType} className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0">
                                    <Plus className="w-4 h-4 mr-1"/> Ekle
                                </Button>
                            </div>
                            <Input
                                value={newTypeDescription}
                                onChange={(e) => setNewTypeDescription(e.target.value)}
                                placeholder="Kopyalama açıklaması (örn: çalışma yapmak için giriş yaptı)"
                                className="bg-gray-800 border-amber-600/50 text-amber-300 placeholder-amber-700/50 text-sm"
                            />
                        </div>

                        {/* Mevcut Türler Listesi */}
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {visitTypes && visitTypes.length > 0 ? (
                                visitTypes.map((type) => (
                                    <div key={type.id} className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg border border-amber-600/30">
                                        {editingTypeId === type.id ? (
                                            <div className="flex-1 space-y-2 mr-2">
                                                <Input 
                                                    value={editingTypeName}
                                                    onChange={(e) => setEditingTypeName(e.target.value)}
                                                    className="bg-gray-800 border-amber-600 text-amber-400 w-full"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEditType()}
                                                    autoFocus
                                                />
                                                <Input
                                                    value={editingTypeDescription}
                                                    onChange={(e) => setEditingTypeDescription(e.target.value)}
                                                    placeholder="Kopyalama açıklaması"
                                                    className="bg-gray-800 border-amber-600/50 text-amber-300 placeholder-amber-700/50 text-sm w-full"
                                                />
                                                <div className="flex gap-1">
                                                    <Button onClick={handleSaveEditType} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                                        <Check className="w-4 h-4"/>
                                                    </Button>
                                                    <Button onClick={handleCancelEdit} size="sm" variant="outline" className="border-gray-600 text-gray-400">
                                                        <X className="w-4 h-4"/>
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex-1">
                                                    <span className="text-amber-400 font-semibold capitalize text-lg">{type.name}</span>
                                                    {type.description && <p className="text-amber-700 text-xs mt-0.5">{type.description}</p>}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button 
                                                        onClick={() => handleEditType(type)}
                                                        size="sm"
                                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                                    >
                                                        <Edit className="w-4 h-4 mr-1"/> Düzenle
                                                    </Button>
                                                    <Button 
                                                        onClick={() => handleDeleteType(type.id)}
                                                        size="sm"
                                                        className="bg-red-600 hover:bg-red-700 text-white"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-1"/> Sil
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-amber-600">
                                    <List className="w-12 h-12 mx-auto mb-3 opacity-50"/>
                                    <p>Henüz ziyaret türü eklenmemiş.</p>
                                    <p className="text-sm mt-1">Yukarıdaki alandan yeni tür ekleyin.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600 border-2">
                    <CardHeader className="border-b border-yellow-600/50">
                        <CardTitle className="flex items-center space-x-2 text-yellow-400"><ShieldAlert className="w-5 h-5"/><span>Yetki Talep Ayarları</span></CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <Label className="text-yellow-400 font-semibold">Talep Alacak Yöneticiler</Label>
                        <p className="text-sm text-yellow-600 mb-4">VIP Yetki talepleri burada seçtiğiniz kullanıcılara mesaj olarak gönderilir.</p>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {allUsers.map(user => (
                                <div key={user.id} className="flex items-center space-x-3 bg-gray-700/50 p-2 rounded-md">
                                    <Checkbox
                                        id={`user-${user.id}`}
                                        checked={selectedRecipients.has(user.id)}
                                        onCheckedChange={() => handleRecipientToggle(user.id)}
                                    />
                                    <label htmlFor={`user-${user.id}`} className="text-sm font-medium text-yellow-300 cursor-pointer">
                                        {user.first_name} {user.last_name} <span className="text-yellow-600">({user.email})</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600 border-2">
                    <CardHeader className="border-b border-yellow-600/50">
                        <CardTitle className="flex items-center space-x-2 text-yellow-400"><FileText className="w-5 h-5"/><span>"Yetki Al" Sayfası İçeriği</span></CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div>
                            <Label htmlFor="page_title" className="text-yellow-400">Ana Başlık</Label>
                            <Input id="page_title" name="page_title" value={config?.page_title || ''} onChange={handleTextChange} className="bg-gray-800 border-amber-600 text-amber-400"/>
                        </div>
                        <div>
                            <Label htmlFor="page_subtitle" className="text-yellow-400">Alt Başlık</Label>
                            <Input id="page_subtitle" name="page_subtitle" value={config?.page_subtitle || ''} onChange={handleTextChange} className="bg-gray-800 border-amber-600 text-amber-400"/>
                        </div>
                         <div>
                            <Label htmlFor="banner_text" className="text-yellow-400">Banner Metni (Opsiyonel)</Label>
                            <Input id="banner_text" name="banner_text" value={config?.banner_text || ''} onChange={handleTextChange} className="bg-gray-800 border-amber-600 text-amber-400"/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="features_vip1" className="text-yellow-400 flex items-center gap-1"><Crown className="w-3 h-3"/> VIP-1 Özellikleri</Label>
                                <Textarea id="features_vip1" name="features_vip1" value={config?.features_vip1?.join('\\n') || ''} onChange={(e) => handleFeaturesChange(e, 'features_vip1')} className="bg-gray-800 border-amber-600 text-amber-400 h-24" placeholder="Her özellik yeni satırda"/>
                            </div>
                            <div>
                                <Label htmlFor="features_vip2" className="text-yellow-400 flex items-center gap-1"><Crown className="w-3 h-3"/> VIP-2 Özellikleri</Label>
                                <Textarea id="features_vip2" name="features_vip2" value={config?.features_vip2?.join('\\n') || ''} onChange={(e) => handleFeaturesChange(e, 'features_vip2')} className="bg-gray-800 border-amber-600 text-amber-400 h-24" placeholder="Her özellik yeni satırda"/>
                            </div>
                            <div>
                                <Label htmlFor="features_vip3" className="text-yellow-400 flex items-center gap-1"><Crown className="w-3 h-3"/> VIP-3 Özellikleri</Label>
                                <Textarea id="features_vip3" name="features_vip3" value={config?.features_vip3?.join('\\n') || ''} onChange={(e) => handleFeaturesChange(e, 'features_vip3')} className="bg-gray-800 border-amber-600 text-amber-400 h-24" placeholder="Her özellik yeni satırda"/>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8 flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-yellow-400 to-amber-600 text-black font-bold px-8 py-3 text-lg">
                    <Save className="w-5 h-5 mr-2"/>
                    {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                </Button>
            </div>
        </div>
    );
}