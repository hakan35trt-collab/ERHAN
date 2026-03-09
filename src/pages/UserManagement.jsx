import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  UserPlus,
  Users,
  Settings,
  Mail,
  Shield,
  Trash2,
  Edit,
  Crown,
  Award
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays, intervalToDuration } from 'date-fns';
import { tr } from 'date-fns/locale';
import UserBadges from "../components/ui/UserBadges";

// Helper component for VIP Badges
const VIPBadge = ({ role, size = "md" }) => {
  let className = '';
  let roleText = '';

  switch (role) {
    case 'admin':
      className = 'bg-purple-600 text-white border-purple-400';
      roleText = 'ADMIN';
      break;
    case 'vip-3':
      className = 'bg-yellow-500 text-black border-yellow-400';
      roleText = 'VIP-3';
      break;
    case 'vip-2':
      className = 'bg-red-500 text-white border-red-400';
      roleText = 'VIP-2';
      break;
    case 'vip-1':
      className = 'bg-blue-500 text-white border-blue-400';
      roleText = 'VIP-1';
      break;
    case 'none': // Explicitly handle 'none' for VIP level
      className = 'bg-gray-500 text-white border-gray-400';
      roleText = 'NO VIP';
      break;
    default:
      className = 'bg-gray-500 text-white border-gray-400';
      roleText = role ? role.toUpperCase() : 'UNKNOWN';
  }

  const textSizeClass = size === "sm" ? "text-xs" : "text-sm";

  return (
    <Badge className={`${className} border ${textSizeClass}`}>
      {roleText}
    </Badge>
  );
};

// Helper component for Day Badges (formerly Level Badges)
const DayBadge = ({ level, size = "md" }) => {
  const textSizeClass = size === "sm" ? "text-xs" : "text-sm";
  return (
    <Badge className={`bg-green-600 text-white border-green-400 ${textSizeClass}`}>
      Gün: {level}
    </Badge>
  );
};


export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('vip-1');
  const [selectedBadgeTemplate, setSelectedBadgeTemplate] = useState('');
  const [isBadgeDialogOpen, setIsBadgeDialogOpen] = useState(false);
  const [badgeUser, setBadgeUser] = useState(null);

  const BADGE_TEMPLATES = [
    { id: 'monthly_champion', name: 'Ayın Şampiyonu', icon: '🏆', color: 'gold' },
    { id: 'weekly_champion', name: 'Haftanın Şampiyonu', icon: '⚡', color: 'blue' },
    { id: 'top_performer', name: 'En İyi Performans', icon: '⭐', color: 'gold' },
    { id: 'daily_king', name: 'Günün Kralı', icon: '👑', color: 'purple' },
    { id: 'first_place', name: '1. Sıra', icon: '🥇', color: 'gold' },
    { id: 'second_place', name: '2. Sıra', icon: '🥈', color: 'silver' },
    { id: 'third_place', name: '3. Sıra', icon: '🥉', color: 'bronze' },
    { id: 'speed_master', name: 'Hız Ustası', icon: '⚡', color: 'blue' },
    { id: 'accuracy_expert', name: 'Hassasiyet Uzmanı', icon: '🎯', color: 'green' },
    { id: 'consistency', name: 'Tutarlılık', icon: '🔥', color: 'red' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      setTheme(user.theme || 'dark');

      // Only admins can see the full user list
      if (user.role === 'admin') {
        const userData = await User.list();
        setUsers(userData);
      }
    } catch (error) {
      console.error("Veri yüklenemedi:", error);
    }
  };

  const handleInvite = async () => {
    alert("Kullanıcı davet özelliği Dashboard -> Ayarlar bölümünden kullanılabilir.");
    setIsInviteDialogOpen(false);
    setInviteEmail('');
  };

  const handleEditUser = (user) => {
    setEditingUser({
        ...user,
        hire_date: user.hire_date ? format(new Date(user.hire_date), 'yyyy-MM-dd') : ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      // We only update non-role fields here. `role` is managed by the platform.
      await User.update(editingUser.id, {
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        vip_level: editingUser.vip_level,
        hire_date: editingUser.hire_date || null
      });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      loadData();
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      alert("Kullanıcı güncellenirken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const openBadgeDialog = (user) => {
    setBadgeUser(user);
    setIsBadgeDialogOpen(true);
  };

  const handleAddBadge = async () => {
    if (!badgeUser || !selectedBadgeTemplate) return;

    const template = BADGE_TEMPLATES.find(t => t.id === selectedBadgeTemplate);
    if (!template) return;

    try {
      const currentBadges = badgeUser.badges || [];
      
      if (currentBadges.find(b => b.id === template.id)) {
        alert('Bu rozet zaten kullanıcıda mevcut!');
        return;
      }

      const newBadge = {
        id: template.id,
        name: template.name,
        icon: template.icon,
        color: template.color,
        earned_date: new Date().toISOString()
      };

      await User.update(badgeUser.id, {
        badges: [...currentBadges, newBadge]
      });

      alert('Rozet başarıyla eklendi!');
      setIsBadgeDialogOpen(false);
      setBadgeUser(null);
      setSelectedBadgeTemplate('');
      loadData();
    } catch (error) {
      console.error('Rozet ekleme hatası:', error);
      alert('Rozet eklenirken bir hata oluştu.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Bu kullanıcıyı silmek istediğinizden emin misiniz?")) {
      try {
        await User.delete(userId);
        loadData();
      } catch (error) {
        console.error("Silme hatası:", error);
      }
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-600 text-white border-purple-400';
      case 'vip-3': return 'bg-yellow-500 text-black border-yellow-400';
      case 'vip-2': return 'bg-red-500 text-white border-red-400';
      case 'vip-1': return 'bg-blue-500 text-white border-blue-400';
      default: return 'bg-gray-500 text-white border-gray-400';
    }
  };

  const getDurationText = (hireDate) => {
      if (!hireDate) return null;
      const startDate = new Date(hireDate);
      if (isNaN(startDate.getTime())) return null; // Handle invalid date strings

      const duration = intervalToDuration({ start: startDate, end: new Date() });
      const parts = [];
      if (duration.years > 0) parts.push(`${duration.years} Yıl`);
      if (duration.months > 0) parts.push(`${duration.months} Ay`);
      if (duration.days > 0) parts.push(`${duration.days} Gün`);
      return parts.join(', ');
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600 border-2 text-center">
          <CardContent className="p-8">
            <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-yellow-400">Yetki Yok</h2>
            <p className="text-yellow-600">Bu sayfaya erişmek için Admin yetkisine ihtiyacınız var.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            Kullanıcı Yönetimi
          </h1>
          <p className="text-lg text-yellow-600 mt-2">
            Sistem kullanıcılarını yönetin
          </p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold">
              <UserPlus className="w-4 h-4 mr-2" />
              <span>Kullanıcı Davet Et</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-yellow-600">
            <DialogHeader>
              <DialogTitle className="text-yellow-400">Yeni Kullanıcı Davet Et</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-yellow-400">E-posta Adresi</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="kullanici@example.com"
                  className="bg-gray-800 border-yellow-600 text-yellow-400"
                />
              </div>
              <div>
                <Label htmlFor="role" className="text-yellow-400">VIP Seviyesi</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="bg-gray-800 border-yellow-600 text-yellow-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-yellow-600">
                      <SelectItem value="admin" className="text-purple-400">Admin</SelectItem>
                      <SelectItem value="vip-3" className="text-yellow-400">VIP-3</SelectItem>
                      <SelectItem value="vip-2" className="text-red-400">VIP-2</SelectItem>
                      <SelectItem value="vip-1" className="text-blue-400">VIP-1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-yellow-900 p-4 rounded-lg border border-yellow-600">
                <p className="text-sm text-yellow-200">
                  <strong>Not:</strong> Kullanıcı davet etmek için Dashboard → Ayarlar bölümünü kullanın.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)} className="border-yellow-600 text-yellow-400">
                  İptal
                </Button>
                <Button onClick={handleInvite} className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black">
                  Davet Gönder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* İstatistikler - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600 border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-600">Toplam</p>
                <p className="text-2xl font-bold text-yellow-400">{users.length}</p>
              </div>
              <Users className="w-6 h-6 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600 border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-600">Admin</p>
                <p className="text-2xl font-bold text-purple-400">{users.filter(u => u.role === 'admin').length}</p>
              </div>
              <Crown className="w-6 h-6 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600 border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-600">VIP-3</p>
                <p className="text-2xl font-bold text-yellow-400">{users.filter(u => u.vip_level === 'vip-3').length}</p>
              </div>
              <Crown className="w-6 h-6 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600 border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-600">VIP 1-2</p>
                <p className="text-2xl font-bold text-blue-400">{users.filter(u => u.vip_level === 'vip-1' || u.vip_level === 'vip-2').length}</p>
              </div>
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kullanıcı Listesi - Compact */}
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600 border-2">
        <CardHeader className="border-b border-yellow-600">
          <CardTitle className="flex items-center space-x-2 text-yellow-400">
            <Users className="w-5 h-5" />
            <span>Kullanıcılar</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            <AnimatePresence>
              {users.map((user) => {
                const durationText = getDurationText(user.hire_date);
                const daysSinceHire = user.hire_date ? differenceInDays(new Date(), new Date(user.hire_date)) : 0;

                return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-all duration-200 border border-yellow-600"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full flex items-center justify-center text-black font-bold overflow-hidden relative">
                          {user.profile_picture_url ? (
                            <img src={user.profile_picture_url} alt="Profil" className="w-full h-full object-cover" />
                          ) : (
                            user.first_name?.charAt(0) || user.email?.charAt(0).toUpperCase()
                          )}
                          {(user.role === 'admin' || user.vip_level === 'vip-3') && (
                            <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-lg text-yellow-400 mb-1">
                            {user.first_name} {user.last_name}
                            {user.id === currentUser.id && (
                              <Badge variant="outline" className="ml-2 text-xs border-green-600 text-green-400">
                                Siz
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-yellow-600 mb-2">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <VIPBadge role={user.role === 'admin' ? 'admin' : user.vip_level} size="sm" />
                            <DayBadge level={daysSinceHire} size="sm" />
                            {durationText && (
                                <Badge variant="outline" className="border-cyan-600 text-cyan-300 text-xs">
                                  {durationText}
                                </Badge>
                            )}
                          </div>
                          {user.badges && user.badges.length > 0 && (
                            <div className="mt-2">
                              <UserBadges badges={user.badges} size="sm" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action buttons inside the card */}
                    <div className="flex items-center space-x-2 pt-2 border-t border-gray-600">
                      <Button
                        onClick={() => handleEditUser(user)}
                        size="sm"
                        className="text-xs bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-700 hover:to-yellow-500 text-black font-bold"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Düzenle
                      </Button>
                      <Button
                        onClick={() => openBadgeDialog(user)}
                        size="sm"
                        className="text-xs bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-bold"
                      >
                        <Award className="w-3 h-3 mr-1" />
                        Rozet
                      </Button>
                      {user.id !== currentUser.id && (
                        <Button
                          onClick={() => handleDeleteUser(user.id)}
                          size="sm"
                          className="text-xs bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-700 hover:to-yellow-500 text-black font-bold"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Sil
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )})}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog - Allow VIP level for admins too */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-yellow-600">
          <DialogHeader>
            <DialogTitle className="text-yellow-400">Kullanıcı Düzenle</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-yellow-400">Ad</Label>
                  <Input
                    value={editingUser.first_name || ''}
                    onChange={(e) => setEditingUser(prev => ({...prev, first_name: e.target.value.toUpperCase()}))}
                    className="bg-gray-800 border-yellow-600 text-yellow-400"
                  />
                </div>
                <div>
                  <Label className="text-yellow-400">Soyad</Label>
                  <Input
                    value={editingUser.last_name || ''}
                    onChange={(e) => setEditingUser(prev => ({...prev, last_name: e.target.value.toUpperCase()}))}
                    className="bg-gray-800 border-yellow-600 text-yellow-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-yellow-400">VIP Seviyesi</Label>
                  <Select
                    value={editingUser.vip_level || 'none'}
                    onValueChange={(value) => setEditingUser(prev => ({...prev, vip_level: value}))}
                  >
                    <SelectTrigger className="bg-gray-800 border-yellow-600 text-yellow-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-yellow-600">
                      <SelectItem value="none" className="text-gray-400">Yok</SelectItem>
                      <SelectItem value="vip-1" className="text-blue-400">VIP-1</SelectItem>
                      <SelectItem value="vip-2" className="text-red-400">VIP-2</SelectItem>
                      <SelectItem value="vip-3" className="text-yellow-400">VIP-3</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-yellow-600 mt-1">Admin kullanıcıları da VIP seviyesi alabilir.</p>
                </div>
                <div>
                  <Label className="text-yellow-400">İşe Giriş Tarihi</Label>
                  <Input
                    type="date"
                    value={editingUser.hire_date || ''}
                    onChange={(e) => setEditingUser(prev => ({...prev, hire_date: e.target.value}))}
                    className="bg-gray-800 border-yellow-600 text-yellow-400"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-amber-600 text-amber-400">
                  İptal
                </Button>
                <Button onClick={handleSaveEdit} className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-bold border-2 border-yellow-300">
                  Kaydet
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Badge Dialog */}
      <Dialog open={isBadgeDialogOpen} onOpenChange={setIsBadgeDialogOpen}>
        <DialogContent className="bg-gray-900 border-yellow-600">
          <DialogHeader>
            <DialogTitle className="text-yellow-400">
              Rozet Ekle - {badgeUser?.first_name} {badgeUser?.last_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-yellow-400">Rozet Seç</Label>
              <Select value={selectedBadgeTemplate} onValueChange={setSelectedBadgeTemplate}>
                <SelectTrigger className="bg-gray-800 border-yellow-600 text-yellow-400">
                  <SelectValue placeholder="Rozet seçin..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-yellow-600">
                  {BADGE_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id} className="text-yellow-400">
                      {template.icon} {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current Badges */}
            {badgeUser?.badges && badgeUser.badges.length > 0 && (
              <div className="p-4 bg-gray-800 rounded-lg">
                <Label className="text-yellow-400 mb-2 block">Mevcut Rozetler:</Label>
                <UserBadges badges={badgeUser.badges} size="sm" />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setIsBadgeDialogOpen(false)}
                className="border-yellow-600 text-yellow-400"
              >
                İptal
              </Button>
              <Button 
                onClick={handleAddBadge}
                disabled={!selectedBadgeTemplate}
                className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-black font-bold"
              >
                Rozet Ekle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}