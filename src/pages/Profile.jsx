
import React, { useState, useEffect, useRef } from "react";
import { User } from "@/entities/User";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User as UserIcon,
  Settings,
  Save,
  Mail,
  Shield,
  Edit
} from "lucide-react";
import { format, differenceInDays, intervalToDuration } from 'date-fns';
import DayBadge from '../components/ui/DayBadge';
import VIPBadge from '../components/ui/VIPBadge';


export default function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company: '',
    project: ''
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      setTheme(user.theme || 'dark');
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        company: user.company || '',
        project: user.project || ''
      });
    } catch (error) {
      console.error("Kullanıcı bilgileri yüklenemedi:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await User.updateMyUserData({
        first_name: formData.first_name.toUpperCase(),
        last_name: formData.last_name.toUpperCase(),
        company: formData.company.toUpperCase(),
        project: formData.project.toUpperCase()
      });

      loadUser();
    } catch (error) {
      console.error("Profil güncellenemedi:", error);
    }
    setLoading(false);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploading(true);
      try {
        const { file_url } = await UploadFile({ file });
        await User.updateMyUserData({ profile_picture_url: file_url });
        loadUser();
      } catch (error) {
        console.error("Profil resmi yüklenemedi:", error);
      }
      setUploading(false);
    }
  };

  const getDurationText = (hireDate) => {
      if (!hireDate) return null;
      const duration = intervalToDuration({ start: new Date(hireDate), end: new Date() });
      const parts = [];
      if (duration.years > 0) parts.push(`${duration.years} Yıl`);
      if (duration.months > 0) parts.push(`${duration.months} Ay`);
      if (duration.days > 0) parts.push(`${duration.days} Gün`);
      return parts.join(', ');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  const daysSinceHire = currentUser.hire_date ? differenceInDays(new Date(), new Date(currentUser.hire_date)) : 0;
  const durationText = getDurationText(currentUser.hire_date);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
          Profil Ayarları
        </h1>
        <p className="text-lg text-yellow-600 mt-2">
          Hesap bilgilerinizi güncelleyin
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profil Bilgileri */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600 border-2">
          <CardHeader className="border-b border-yellow-600">
            <CardTitle className="flex items-center space-x-2 text-yellow-400">
              <UserIcon className="w-5 h-5" />
              <span>Profil Bilgileri</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-24 h-24">
                <div className="w-24 h-24 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-3xl overflow-hidden border-2 border-yellow-600">
                  {currentUser.profile_picture_url ? (
                    <img src={currentUser.profile_picture_url} alt="Profil" className="w-full h-full object-cover" />
                  ) : (
                    currentUser.first_name?.charAt(0) || currentUser.email?.charAt(0).toUpperCase()
                  )}
                </div>
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full w-8 h-8 bg-yellow-600 hover:bg-yellow-500 text-black"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div> : <Edit className="w-4 h-4" />}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-center text-yellow-400">
                  {currentUser.first_name} {currentUser.last_name}
                </h3>
                <p className="text-yellow-600 text-center">{currentUser.email}</p>
                <div className="flex justify-center mt-2 space-x-2">
                  <VIPBadge role={currentUser.role === 'admin' ? 'admin' : currentUser.vip_level} size="sm" />
                  <DayBadge level={daysSinceHire} size="sm" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="text-yellow-400">Ad</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({...prev, first_name: e.target.value.toUpperCase()}))}
                    placeholder="ADI"
                    className="bg-gray-900 border-yellow-600 text-yellow-400 placeholder-yellow-600"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-yellow-400">Soyad</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({...prev, last_name: e.target.value.toUpperCase()}))}
                    placeholder="SOYADI"
                    className="bg-gray-900 border-yellow-600 text-yellow-400 placeholder-yellow-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company" className="text-yellow-400">Şirket</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({...prev, company: e.target.value.toUpperCase()}))}
                    placeholder="ŞİRKET ADI"
                    className="bg-gray-900 border-yellow-600 text-yellow-400 placeholder-yellow-600"
                  />
                </div>
                <div>
                  <Label htmlFor="project" className="text-yellow-400">Proje</Label>
                  <Input
                    id="project"
                    value={formData.project}
                    onChange={(e) => setFormData(prev => ({...prev, project: e.target.value.toUpperCase()}))}
                    placeholder="PROJE ADI"
                    className="bg-gray-900 border-yellow-600 text-yellow-400 placeholder-yellow-600"
                  />
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-bold border-2 border-yellow-300"
              >
                <Save className="w-4 h-4 mr-2" />
                <span>{loading ? "Kaydediliyor..." : "Kaydet"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hesap Detayları */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600 border-2">
          <CardHeader className="border-b border-yellow-600">
            <CardTitle className="flex items-center space-x-2 text-yellow-400">
              <Settings className="w-5 h-5" />
              <span>Hesap Detayları</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="p-4 rounded-lg bg-gray-700 border border-yellow-600">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="font-medium text-yellow-400">E-posta Adresi</div>
                  <div className="text-sm text-yellow-600">{currentUser.email}</div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gray-700 border border-yellow-600">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="font-medium text-yellow-400">Kıdem Bilgileri</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <DayBadge level={daysSinceHire} size="sm" />
                    {durationText && <span className="text-xs text-yellow-500">({durationText})</span>}
                  </div>
                  {currentUser.hire_date && (
                    <p className="text-xs text-yellow-600 mt-1">İşe Başlama: {format(new Date(currentUser.hire_date), 'dd.MM.yyyy')}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gray-700 border border-yellow-600">
              <h4 className="font-medium text-yellow-400 mb-2">VIP Sistem Açıklamaları</h4>
              <div className="text-sm space-y-2 text-yellow-300">
                <div><strong className="text-red-400">Admin:</strong> Tüm yetkilere sahip</div>
                <div><strong className="text-yellow-400">VIP-3:</strong> Yönetim bölümü dahil tüm işlemler</div>
                <div><strong className="text-red-400">VIP-2:</strong> Yönetim hariç tüm işlemler</div>
                <div><strong className="text-blue-400">VIP-1:</strong> Sadece görüntüleme yetkisi</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
