import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Award, Medal, Star, Crown, Flame, Zap, Target, Shield, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

// Önceden tanımlanmış rozet şablonları
const BADGE_TEMPLATES = [
  { id: 'monthly_champion', name: 'Ayın Şampiyonu', icon: '🏆', color: 'gold', description: 'Ay sonunda en çok kayıt yapan' },
  { id: 'weekly_champion', name: 'Haftanın Şampiyonu', icon: '⚡', color: 'blue', description: 'Hafta sonunda en çok kayıt yapan' },
  { id: 'top_performer', name: 'En İyi Performans', icon: '⭐', color: 'gold', description: 'Genel en iyi performans' },
  { id: 'daily_king', name: 'Günün Kralı', icon: '👑', color: 'purple', description: 'Günün en çok kaydı' },
  { id: 'first_place', name: '1. Sıra', icon: '🥇', color: 'gold', description: 'Birinci sırada' },
  { id: 'second_place', name: '2. Sıra', icon: '🥈', color: 'silver', description: 'İkinci sırada' },
  { id: 'third_place', name: '3. Sıra', icon: '🥉', color: 'bronze', description: 'Üçüncü sırada' },
  { id: 'speed_master', name: 'Hız Ustası', icon: '⚡', color: 'blue', description: 'Hızlı kayıt yapma' },
  { id: 'accuracy_expert', name: 'Hassasiyet Uzmanı', icon: '🎯', color: 'green', description: 'Doğru kayıt yapma' },
  { id: 'consistency', name: 'Tutarlılık', icon: '🔥', color: 'red', description: 'Sürekli performans' },
  { id: 'team_player', name: 'Takım Oyuncusu', icon: '🤝', color: 'purple', description: 'Ekip çalışması' },
  { id: 'veteran', name: 'Veteran', icon: '🛡️', color: 'silver', description: 'Kıdemli çalışan' },
  { id: 'rookie', name: 'Çaylak Yıldız', icon: '🌟', color: 'blue', description: 'Yeni başarılı çalışan' },
  { id: 'perfect_week', name: 'Mükemmel Hafta', icon: '💯', color: 'gold', description: 'Haftalık mükemmel performans' },
  { id: 'record_breaker', name: 'Rekor Kıran', icon: '📈', color: 'red', description: 'Yeni rekor kırma' },
];

export default function BadgeManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddBadgeDialogOpen, setIsAddBadgeDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(BADGE_TEMPLATES[0].id);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (user.role === 'admin' || user.vip_level === 'vip-3') {
        const userData = await User.list();
        setUsers(userData);
      }
    } catch (error) {
      console.error("Veri yüklenemedi:", error);
    }
    setLoading(false);
  };

  const handleAddBadge = async () => {
    if (!selectedUser) return;

    const template = BADGE_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) return;

    try {
      const currentBadges = selectedUser.badges || [];
      
      // Aynı rozetten birden fazla olmasın
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

      await User.update(selectedUser.id, {
        badges: [...currentBadges, newBadge]
      });

      alert('Rozet başarıyla eklendi!');
      setIsAddBadgeDialogOpen(false);
      setSelectedUser(null);
      loadData();
    } catch (error) {
      console.error('Rozet ekleme hatası:', error);
      alert('Rozet eklenirken bir hata oluştu.');
    }
  };

  const handleRemoveBadge = async (user, badgeId) => {
    if (!window.confirm('Bu rozeti kaldırmak istediğinizden emin misiniz?')) return;

    try {
      const currentBadges = user.badges || [];
      const updatedBadges = currentBadges.filter(b => b.id !== badgeId);

      await User.update(user.id, {
        badges: updatedBadges
      });

      alert('Rozet kaldırıldı!');
      loadData();
    } catch (error) {
      console.error('Rozet kaldırma hatası:', error);
      alert('Rozet kaldırılırken bir hata oluştu.');
    }
  };

  const openAddBadgeDialog = (user) => {
    setSelectedUser(user);
    setIsAddBadgeDialogOpen(true);
  };

  const getBadgeStyle = (color) => {
    switch (color) {
      case 'gold':
        return 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black border-2 border-yellow-300';
      case 'silver':
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-2 border-gray-300';
      case 'bronze':
        return 'bg-gradient-to-r from-orange-600 to-orange-700 text-white border-2 border-orange-400';
      case 'blue':
        return 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-2 border-blue-400';
      case 'green':
        return 'bg-gradient-to-r from-green-600 to-green-700 text-white border-2 border-green-400';
      case 'purple':
        return 'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-2 border-purple-400';
      case 'red':
        return 'bg-gradient-to-r from-red-600 to-red-700 text-white border-2 border-red-400';
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white border-2 border-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  if (currentUser?.role !== 'admin' && currentUser?.vip_level !== 'vip-3') {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-red-600 border-2">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-amber-400">Yetki Yok</h2>
            <p className="text-amber-600">Bu sayfaya erişmek için Admin veya VIP-3 yetkisine ihtiyacınız var.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
          Rozet Yönetimi
        </h1>
        <p className="text-amber-600 mt-2">
          Kullanıcılara rozet ekleyin veya kaldırın
        </p>
      </div>

      {/* Rozet Şablonları */}
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-amber-600 border-2 mb-6">
        <CardHeader>
          <CardTitle className="text-amber-400">Mevcut Rozet Şablonları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {BADGE_TEMPLATES.map((template) => (
              <div key={template.id} className={`${getBadgeStyle(template.color)} p-3 rounded-lg text-center`}>
                <div className="text-3xl mb-2">{template.icon}</div>
                <div className="font-bold text-sm">{template.name}</div>
                <div className="text-xs opacity-80 mt-1">{template.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Kullanıcı Listesi */}
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-amber-600 border-2">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-amber-400">
            <Users className="w-5 h-5" />
            <span>Kullanıcılar ve Rozetleri</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnimatePresence>
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-gray-700 border border-amber-600/30 hover:border-amber-600/60 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-yellow-700 rounded-full flex items-center justify-center text-black font-bold">
                        {user.first_name?.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-amber-400 mb-2">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {user.badges && user.badges.length > 0 ? (
                            user.badges.map((badge, idx) => (
                              <div key={idx} className="relative group">
                                <Badge 
                                  className={`${getBadgeStyle(badge.color)} text-xs px-2 py-1 cursor-pointer`}
                                  onClick={() => handleRemoveBadge(user, badge.id)}
                                >
                                  <span className="mr-1">{badge.icon}</span>
                                  <span>{badge.name}</span>
                                </Badge>
                                <span className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 bg-gray-900 text-amber-400 text-xs px-2 py-1 rounded mb-1 whitespace-nowrap">
                                  Kaldırmak için tıkla
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-500 text-sm">Henüz rozet yok</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => openAddBadgeDialog(user)}
                      size="sm"
                      className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-black font-bold"
                    >
                      <Trophy className="w-4 h-4 mr-1" />
                      Rozet Ekle
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Add Badge Dialog */}
      <Dialog open={isAddBadgeDialogOpen} onOpenChange={setIsAddBadgeDialogOpen}>
        <DialogContent className="bg-gray-900 border-amber-600">
          <DialogHeader>
            <DialogTitle className="text-amber-400">
              Rozet Ekle - {selectedUser?.first_name} {selectedUser?.last_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-amber-400">Rozet Seç</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="bg-gray-800 border-amber-600 text-amber-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-amber-600">
                  {BADGE_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id} className="text-amber-400">
                      {template.icon} {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            {selectedTemplate && (
              <div className="p-4 bg-gray-800 rounded-lg border border-amber-600/30">
                <Label className="text-amber-400 mb-2 block">Önizleme:</Label>
                <div className={`${getBadgeStyle(BADGE_TEMPLATES.find(t => t.id === selectedTemplate)?.color)} p-3 rounded-lg text-center inline-block`}>
                  <div className="text-3xl mb-2">{BADGE_TEMPLATES.find(t => t.id === selectedTemplate)?.icon}</div>
                  <div className="font-bold">{BADGE_TEMPLATES.find(t => t.id === selectedTemplate)?.name}</div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setIsAddBadgeDialogOpen(false)}
                className="border-amber-600 text-amber-400"
              >
                İptal
              </Button>
              <Button 
                onClick={handleAddBadge}
                className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-black font-bold"
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