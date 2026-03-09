import React, { useState, useEffect } from "react";
import { Visitor } from "@/entities/Visitor";
import { User } from "@/entities/User";
import { Log } from "@/entities/Log";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users,
  UserCheck,
  TrendingUp,
  Calendar,
  Building2,
  Clock,
  Download,
  RefreshCw,
  ClipboardList,
  LogIn,
  UserPlus,
  Wrench,
  MessageSquare,
  LogOut as LogOutIcon,
  Trash2,
  Car,
  Edit,
  Copy,
  X,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import VIPBadge from "../components/ui/VIPBadge";
import DayBadge from "../components/ui/DayBadge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ShiftReminder from "../components/dashboard/ShiftReminder";
import ShiftDisplay from "../components/dashboard/ShiftDisplay";
import { dailyUpdateService } from "../components/services/DailyUpdateService";
import CompanyChart from "../components/dashboard/CompanyChart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className={`aspect-square flex flex-col justify-center items-center text-center p-2 rounded-xl bg-gradient-to-br ${color.bg} border-2 ${color.border} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
    <div className="flex items-center space-x-2">
        <Icon className={`w-5 h-5 ${color.icon}`} />
    </div>
    <p className={`text-2xl font-bold ${color.text} my-1`}>{value}</p>
    <p className={`text-xs font-medium ${color.subtitle} leading-tight`}>{title}</p>
  </div>
);

export default function Dashboard() {
  const [visitors, setVisitors] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAdditionalVisitors, setEditingAdditionalVisitors] = useState([]);

  // Türkiye saati ile bugünün tarih stringini al
  const getTurkeyDateString = () => {
    return format(new Date(), 'yyyy-MM-dd');
  };

  useEffect(() => {
    loadData();
    if (!dailyUpdateService.isRunning) {
      dailyUpdateService.initialize();
      dailyUpdateService.start();
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      // VIP kontrolü - yetkisi yoksa yönlendir
      const userDisplayRole = user.role === 'admin' ? 'admin' : user.vip_level;
      if (!['admin', 'vip-3', 'vip-2', 'vip-1'].includes(userDisplayRole)) {
        console.log('Dashboard: VIP yetkisi yok, yönlendiriliyor...');
        window.location.href = createPageUrl('GetAuthorization');
        return;
      }

      const visitorData = await Visitor.list('-created_date', 1000);
      setVisitors(visitorData);
    } catch (error) {
      console.error("Veri yüklenemedi:", error);
    }
    setLoading(false);
  };

  const downloadExcel = async () => {
    const today = new Date();
    const csvData = visitors.map(visitor => ({
      'Ad': visitor.first_name, 'Soyad': visitor.last_name, 'Firma': visitor.company || '', 'Plaka': visitor.plate || '',
      'Tarih': visitor.visit_date, 'Giriş Saati': visitor.entry_time || '', 'Çıkış Saati': visitor.exit_time || '',
      'Ziyaret Türü': visitor.visit_type, 'Açıklama': visitor.description || '', 'Kayıt Yapan': visitor.registered_by || '',
      'Kayıt Tarihi': format(new Date(visitor.created_date), 'dd.MM.yyyy HH:mm')
    }));

    // Fix: Prevent crash if visitors array is empty by checking csvData length
    if (csvData.length === 0) {
      alert("İndirilecek ziyaretçi kaydı bulunamadı.");
      return;
    }

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `ziyaretci-kayitlari-${format(today, 'dd-MM-yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canRegisterVisitors = () => {
    if (!currentUser) return false;
    const userDisplayRole = currentUser.role === 'admin' ? 'admin' : currentUser.vip_level;
    return ['admin', 'vip-3', 'vip-2'].includes(userDisplayRole);
  };

  const canPerformAction = (visitor) => {
    if (!currentUser || !visitor) {
      return { canEdit: false, canDelete: false, canAddExit: false };
    }

    const userDisplayRole = currentUser.role === 'admin' ? 'admin' : currentUser.vip_level;

    // Admins and VIP-3 have full control
    if (['admin', 'vip-3'].includes(userDisplayRole)) {
      return { canEdit: true, canDelete: true, canAddExit: true };
    }

    // VIP-2 specific logic
    if (userDisplayRole === 'vip-2') {
      // Can fully manage their own records
      if (visitor.registered_by_id === currentUser.id) {
        return { canEdit: true, canDelete: true, canAddExit: true };
      }
      // Can only add exit time for others' records
      else {
        return { canEdit: false, canDelete: false, canAddExit: true };
      }
    }
    
    // VIP-1 and others have no action permissions
    return { canEdit: false, canDelete: false, canAddExit: false };
  };

  const handleEdit = (visitor) => {
    setEditingVisitor({
      ...visitor,
      description: visitor.description || '', // Ensure description is a string
    });
    setEditingAdditionalVisitors(visitor.vehicle_visitors || []);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const { id, ...updateData } = editingVisitor; 
      // Ensure all uppercase fields are uppercase before saving
      updateData.first_name = updateData.first_name.toUpperCase();
      updateData.last_name = updateData.last_name.toUpperCase();
      updateData.company = updateData.company ? updateData.company.toUpperCase() : '';
      updateData.plate = updateData.plate ? updateData.plate.toUpperCase() : '';
      updateData.vehicle_visitors = editingAdditionalVisitors.filter(v => v.first_name && v.last_name);

      await Visitor.update(id, updateData);
      
      await Log.create({
        action: "GÜNCELLEME",
        details: `${editingVisitor.first_name} ${editingVisitor.last_name} adlı ziyaretçinin kaydı güncellendi (Dashboard).`,
        user_name: `${currentUser.first_name} ${currentUser.last_name}`
      });
      
      setIsEditDialogOpen(false);
      setEditingVisitor(null);
      setEditingAdditionalVisitors([]);
      loadData();
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      alert("Kayıt güncellenirken bir hata oluştu.");
    }
  };

  const addExitTime = async (visitorId, visitorName) => {
    try {
      const currentTime = format(new Date(), 'HH:mm');
      await Visitor.update(visitorId, { exit_time: currentTime });

      await Log.create({
        action: "ÇIKIŞ",
        details: `${visitorName} adlı ziyaretçiye çıkış saati eklendi (Dashboard).`,
        user_name: `${currentUser.first_name} ${currentUser.last_name}`
      });

      loadData();
    } catch (error) {
      console.error("Çıkış saati eklenemedi:", error);
    }
  };

  const handleDelete = async (visitor) => {
    if (window.confirm("Bu kaydı silmek istediğinizden emin misiniz?")) {
      try {
        await Visitor.delete(visitor.id);

        await Log.create({
          action: "SİLME",
          details: `${visitor.first_name} ${visitor.last_name} adlı ziyaretçi silindi (Dashboard).`,
          user_name: `${currentUser.first_name} ${currentUser.last_name}`
        });

        loadData();
      } catch (error) {
        console.error("Silme hatası:", error);
        alert("Kayıt silinirken bir hata oluştu.");
      }
    }
  };

  const createQuickRecord = async (visitor) => {
    if (!currentUser) {
        alert("Kayıt yapmak için giriş yapmalısınız.");
        return;
    }
    if (!window.confirm(`${visitor.first_name} ${visitor.last_name} için yeni bir giriş kaydı oluşturmak istediğinizden emin misiniz?`)) {
        return;
    }

    try {
        const newRecord = {
            first_name: visitor.first_name,
            last_name: visitor.last_name,
            company: visitor.company,
            plate: visitor.plate,
            visit_date: format(new Date(), 'yyyy-MM-dd'),
            entry_time: format(new Date(), 'HH:mm'),
            exit_time: null,
            visit_type: visitor.visit_type,
            description: "Hızlı kayıt ile oluşturuldu.",
            vehicle_visitors: visitor.vehicle_visitors || [],
            registered_by: `${currentUser.first_name} ${currentUser.last_name}`,
            registered_by_id: currentUser.id
        };

        await Visitor.create(newRecord);

        await Log.create({
            action: "HIZLI KAYIT",
            details: `${visitor.first_name} ${visitor.last_name} için yeni ziyaret kaydı oluşturuldu.`,
            user_name: `${currentUser.first_name} ${currentUser.last_name}`
        });
        
        alert("Yeni ziyaret kaydı başarıyla oluşturuldu.");
        loadData();

    } catch (error) {
        console.error("Hızlı kayıt oluşturma hatası:", error);
        alert("Kayıt oluşturulurken bir hata oluştu.");
    }
  };

  const toTitleCase = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const copyVisitorInfo = (visitor) => {
    const currentTime = format(new Date(), 'HH:mm');
    let copyText = `FİRMA: ${visitor.company || 'BELİRTİLMEMİŞ'}\n\n`;
    
    // Ana ziyaretçi - baş harf büyük
    copyText += `${toTitleCase(visitor.first_name)} ${toTitleCase(visitor.last_name)}\n`;
    
    // Araçtaki diğer kişiler - baş harf büyük
    if (visitor.vehicle_visitors && visitor.vehicle_visitors.length > 0) {
      visitor.vehicle_visitors.forEach((person) => {
        copyText += `${toTitleCase(person.first_name)} ${toTitleCase(person.last_name)}\n`;
      });
    }
    
    copyText += `\nGİRİŞ SAATİ: ${currentTime}\n\n`;
    
    // Ziyaret türüne göre mesaj
    if (visitor.visit_type === 'calisma') {
      copyText += `ÇALIŞMA YAPMAK İÇİN GİRİŞ YAPTI`;
    } else if (visitor.visit_type === 'sevkiyat') {
      copyText += `MALZEME GETİRMEK İÇİN GİRİŞ YAPTI`;
    } else if (visitor.visit_type === 'yemek') {
      copyText += `YEMEK GETİRMEK İÇİN GİRİŞ YAPTI`;
    } else {
      copyText += `GİRİŞ YAPTI`;
    }

    navigator.clipboard.writeText(copyText).then(() => {
      toast.success('Bilgiler panoya kopyalandı!', { duration: 2000 });
    }).catch(err => {
      console.error('Kopyalama hatası:', err);
      toast.error('Kopyalama başarısız oldu.', { duration: 2000 });
    });
  };

  const copyDailyReport = () => {
    const todayDate = format(new Date(), 'dd.MM.yyyy');
    const totalToday = getTotalVisitorCount(todayVisitors);
    const totalExited = todayVisitors.filter(v => v.exit_time).length;
    
    let report = `GÜNLÜK RAPOR ${todayDate}\n\n`;
    report += `Toplam Giriş: ${totalToday}\n`;
    report += `İçeride: ${totalInsideCount}\n`;
    report += `Çıkış Yapmış: ${totalExited}\n`;
    report += `Sevkiyat: ${todaySevkiyat}\n`;
    report += `Araçlı: ${todayWithVehicle}\n`;
    report += `Yaya: ${todayWithoutVehicle}`;

    navigator.clipboard.writeText(report).then(() => {
      toast.success('Günlük rapor panoya kopyalandı!', { duration: 2000 });
    }).catch(err => {
      console.error('Kopyalama hatası:', err);
      toast.error('Kopyalama başarısız oldu.', { duration: 2000 });
    });
  };

  const todayString = getTurkeyDateString();

  const todayVisitors = visitors.filter(v => v.visit_date === todayString);

  const activeVisitors = visitors.filter(v => v.entry_time && !v.exit_time);
  
  // İçerideki toplam kişi sayısı (araçtaki kişilerle birlikte)
  const totalInsideCount = activeVisitors.reduce((total, visitor) => {
    return total + 1 + (visitor.vehicle_visitors?.length || 0);
  }, 0);
  
  // Günlük araçlı ve yaya girişleri - Toplu kaydedilenleri grup olarak say
  const todayWithVehicle = todayVisitors.filter(v => v.description?.includes('Toplu - Araçla içeri girdi') || v.description?.includes('Araçla içeri girdi')).length;
  
  // Yaya sayısını hesapla - Toplu olanları hariç tut, sadece yaya olanları say
  const todayWithoutVehicle = todayVisitors.filter(v => 
    (v.description?.includes('Yaya') || v.description?.includes('Araç dışarıda bırakıldı')) && 
    !v.description?.includes('Toplu')
  ).reduce((total, visitor) => {
    // Yaya olarak kayıt yapılmışsa, araçtaki kişiler de dahil toplam kişi sayısı
    return total + 1 + (visitor.vehicle_visitors?.length || 0);
  }, 0);
  
  const todaySevkiyat = todayVisitors.filter(v => v.visit_type === 'sevkiyat').length;
  const todayCalisma = todayVisitors.filter(v => v.visit_type === 'calisma');
  const todayCalismaCount = todayCalisma.reduce((total, visitor) => {
    return total + 1 + (visitor.vehicle_visitors?.length || 0);
  }, 0);
  const todayGorusme = todayVisitors.filter(v => v.visit_type === 'gorusme').length;
  const todayServis = todayVisitors.filter(v => v.visit_type === 'servis').length;

  const totalSevkiyat = visitors.filter(v => v.visit_type === 'sevkiyat').length;
  const totalCalisma = visitors.filter(v => v.visit_type === 'calisma');
  const totalCalismaCount = totalCalisma.reduce((total, visitor) => {
    return total + 1 + (visitor.vehicle_visitors?.length || 0);
  }, 0);
  const totalGorusme = visitors.filter(v => v.visit_type === 'gorusme').length;
  const totalServis = visitors.filter(v => v.visit_type === 'servis').length;

  const getTotalVisitorCount = (visitorList) => visitorList.reduce((total, visitor) => total + 1 + (visitor.vehicle_visitors?.length || 0), 0);

  const hasVIPAccess = () => {
    if (!currentUser) return false;
    const userDisplayRole = currentUser.role === 'admin' ? 'admin' : currentUser.vip_level;
    return ['admin', 'vip-3', 'vip-2', 'vip-1'].includes(userDisplayRole);
  };

  // VIP kontrolü - yetki yoksa yönlendirme sayfası göster
  if (!loading && currentUser && !hasVIPAccess()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-yellow-400">Yetki kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div></div>;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        {/* Left side: Welcome and Mini Shift Display */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <h1 className="text-base font-bold text-amber-400 uppercase">HOŞGELDİNİZ, {currentUser?.first_name}</h1>
            <p className="text-xs text-amber-600">{format(new Date(), "d MMMM yyyy, EEEE", { locale: tr })}</p>
          </div>
          <ShiftDisplay />
        </div>
        
        {/* Right side: Badges and Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            <VIPBadge role={currentUser?.role === 'admin' ? 'admin' : currentUser?.vip_level} size="sm" />
            <DayBadge level={currentUser?.level || 1} size="sm" />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full justify-start sm:justify-end">
            {canRegisterVisitors() && <Button asChild size="sm" className="bg-gradient-to-r from-green-600 to-green-400 hover:from-green-700 hover:to-green-500 text-white font-bold"><Link to={createPageUrl('VisitorRegistration')}><UserPlus className="w-4 h-4 mr-1" />Kayıt</Link></Button>}
            <Button onClick={loadData} size="sm" className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-bold border-2 border-yellow-300 shadow-lg hover:shadow-xl transition-all duration-200"><RefreshCw className="w-4 h-4 mr-1" />Yenile</Button>
            <Button onClick={copyDailyReport} size="sm" className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold"><Copy className="w-4 h-4 mr-1" />Günlük Rapor</Button>
            <Button onClick={downloadExcel} size="sm" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold"><Download className="w-4 h-4 mr-1" />Excel</Button>
          </div>
        </div>
      </div>
      
      <ShiftReminder />
      
      <div className="space-y-6 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-amber-400 mb-3 flex items-center"><Calendar className="w-5 h-5 mr-2" />Bugünkü İstatistikler</h2>
          <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2">
            <StatCard title="Bugünkü Ziyaretçi" value={getTotalVisitorCount(todayVisitors)} icon={Users} color={{ bg: "from-emerald-600 to-emerald-700", border: "border-emerald-500", icon: "text-emerald-200", text: "text-white", subtitle: "text-emerald-200" }}/>
            <StatCard title="İçeride Bulunan" value={totalInsideCount} icon={LogIn} color={{ bg: "from-orange-600 to-orange-700", border: "border-orange-500", icon: "text-orange-200", text: "text-white", subtitle: "text-orange-200" }}/>
            <StatCard title="Günlük Araçlı" value={todayWithVehicle} icon={Car} color={{ bg: "from-green-600 to-green-700", border: "border-green-500", icon: "text-green-200", text: "text-white", subtitle: "text-green-200" }}/>
            <StatCard title="Günlük Yaya" value={todayWithoutVehicle} icon={Users} color={{ bg: "from-orange-600 to-orange-700", border: "border-orange-500", icon: "text-orange-200", text: "text-white", subtitle: "text-orange-200" }}/>
            <StatCard title="Günlük Sevkiyat" value={todaySevkiyat} icon={ClipboardList} color={{ bg: "from-blue-600 to-blue-700", border: "border-blue-500", icon: "text-blue-200", text: "text-white", subtitle: "text-blue-200" }}/>
            <StatCard title="Günlük Çalışma" value={todayCalismaCount} icon={UserCheck} color={{ bg: "from-emerald-600 to-emerald-700", border: "border-emerald-500", icon: "text-emerald-200", text: "text-white", subtitle: "text-emerald-200" }}/>
            <StatCard title="Günlük Görüşme" value={todayGorusme} icon={MessageSquare} color={{ bg: "from-purple-600 to-purple-700", border: "border-purple-500", icon: "text-purple-200", text: "text-white", subtitle: "text-purple-200" }}/>
            <StatCard title="Günlük Servis" value={todayServis} icon={Wrench} color={{ bg: "from-teal-600 to-teal-700", border: "border-teal-500", icon: "text-teal-200", text: "text-white", subtitle: "text-teal-200" }}/>
          </div>
        </div>

        {/* Company Chart - Mini Card Above Total Stats */}
        <div className="mb-4">
          <CompanyChart visitors={todayVisitors} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-amber-400 mb-3 flex items-center"><TrendingUp className="w-5 h-5 mr-2" />Toplam İstatistikler</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            <StatCard title="Toplam Ziyaretçi" value={getTotalVisitorCount(visitors)} icon={Users} color={{ bg: "from-gray-600 to-gray-700", border: "border-gray-500", icon: "text-gray-200", text: "text-white", subtitle: "text-gray-200" }}/>
            <StatCard title="Toplam Sevkiyat" value={totalSevkiyat} icon={ClipboardList} color={{ bg: "from-indigo-600 to-indigo-700", border: "border-indigo-500", icon: "text-indigo-200", text: "text-white", subtitle: "text-indigo-200" }}/>
            <StatCard title="Toplam Çalışma" value={totalCalismaCount} icon={UserCheck} color={{ bg: "from-emerald-600 to-emerald-700", border: "border-emerald-500", icon: "text-emerald-200", text: "text-white", subtitle: "text-emerald-200" }}/>
            <StatCard title="Toplam Görüşme" value={totalGorusme} icon={MessageSquare} color={{ bg: "from-violet-600 to-violet-700", border: "border-violet-500", icon: "text-violet-200", text: "text-white", subtitle: "text-violet-200" }}/>
            <StatCard title="Toplam Servis" value={totalServis} icon={Wrench} color={{ bg: "from-cyan-600 to-cyan-700", border: "border-cyan-500", icon: "text-cyan-200", text: "text-white", subtitle: "text-cyan-200" }}/>
          </div>
        </div>
      </div>

      {/* Updated Last Records Section - Show ALL today's records */}
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-amber-600 border-2">
        <CardHeader className="py-3 border-b border-amber-600/30">
          <CardTitle className="flex items-center justify-between text-amber-400 text-lg">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Bugünkü Tüm Kayıtlar</span>
            </div>
            <Badge variant="outline" className="border-amber-600 text-amber-400">
              {todayVisitors.length} Kayıt
            </Badge>
          </CardTitle>
          <p className="text-xs text-amber-600 mt-1">
            {todayString} tarihli kayıtlar • Gece 00:00'da sıfırlanır
          </p>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-600 scrollbar-track-gray-800">
            {todayVisitors.map((visitor) => {
              const permissions = canPerformAction(visitor);
              const canPerformAnyAction = permissions.canAddExit || permissions.canEdit || permissions.canDelete;

              return (
                <div key={visitor.id} className="bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-xl p-3 border border-amber-600/20 hover:border-amber-600/40 transition-all duration-200">
                  {/* Main Info Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-yellow-700 rounded-full flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
                        {visitor.first_name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-amber-400 text-sm truncate">
                          {visitor.first_name} {visitor.last_name}
                          {visitor.vehicle_visitors?.length > 0 && (
                            <Badge variant="outline" className="ml-2 text-xs border-amber-600/50 text-amber-500">+{visitor.vehicle_visitors.length}</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-amber-600 mt-0.5">
                          {visitor.company && (
                            <><Building2 className="w-3 h-3" /><span className="truncate max-w-20">{visitor.company}</span></>
                          )}
                          {visitor.plate && (
                            <><Car className="w-3 h-3 ml-2" /><span>{visitor.plate}</span></>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={`text-xs ${
                          visitor.visit_type === 'sevkiyat' ? 'bg-blue-700 text-blue-200' : 
                          visitor.visit_type === 'calisma' ? 'bg-green-700 text-green-200' : 
                          visitor.visit_type === 'servis' ? 'bg-teal-700 text-teal-200' : 
                          'bg-purple-700 text-purple-200'
                        }`}
                      >
                        {visitor.visit_type}
                      </Badge>
                      {!visitor.exit_time ? (
                        <Badge variant="outline" className="bg-orange-700/20 text-orange-300 border-orange-600 text-xs">
                          İçeride
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-700/20 text-gray-400 border-gray-600 text-xs">
                          Çıktı
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Time Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3 text-xs text-amber-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{visitor.entry_time || 'N/A'}</span>
                        {visitor.exit_time && <span> → {visitor.exit_time}</span>}
                      </div>
                      <div className="text-amber-700">
                        {format(new Date(visitor.created_date), 'dd.MM HH:mm')}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {canPerformAnyAction && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        onClick={() => copyVisitorInfo(visitor)}
                        size="sm"
                        className="h-6 px-2 text-xs bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Kopyala
                      </Button>

                      {!visitor.exit_time && permissions.canAddExit && (
                        <Button
                          onClick={() => addExitTime(visitor.id, `${visitor.first_name} ${visitor.last_name}`)}
                          size="sm"
                          className="h-6 px-2 text-xs bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
                        >
                          <LogOutIcon className="w-3 h-3 mr-1" />
                          Çıkış
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => createQuickRecord(visitor)}
                        size="sm"
                        className="h-6 px-2 text-xs bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
                      >
                        <UserPlus className="w-3 h-3 mr-1" />
                        Yeni Kayıt
                      </Button>

                      {permissions.canEdit && (
                        <Button
                          onClick={() => handleEdit(visitor)}
                          size="sm"
                          className="h-6 px-2 text-xs bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-bold border-2 border-yellow-300"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Düzenle
                        </Button>
                      )}

                      {permissions.canDelete && (
                        <Button
                          onClick={() => handleDelete(visitor)}
                          size="sm"
                          className="h-6 px-2 text-xs bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Sil
                        </Button>
                      )}
                    </div>
                  )}

                  {!canPerformAnyAction && (
                    <div className="text-xs text-amber-500/70 pt-1 mt-1 border-t border-amber-600/20">
                      Sadece görüntüleme yetkisine sahipsiniz
                    </div>
                  )}

                  {/* Vehicle Visitors */}
                  {visitor.vehicle_visitors?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-amber-600/20">
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-amber-600">Araçtakiler:</span>
                        {visitor.vehicle_visitors.map((v, i) => (
                          <span key={i} className="text-xs bg-amber-600/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-600/30">
                            {v.first_name} {v.last_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {todayVisitors.length === 0 && (
              <div className="text-center py-8 text-amber-600">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Bugün henüz kayıt bulunmuyor.</p>
                <p className="text-xs mt-1">Türkiye saati: {format(new Date(new Date().getTime() + 3 * 60 * 60 * 1000), 'HH:mm:ss')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-amber-600 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-amber-400">Ziyaretçi Kaydını Düzenle</DialogTitle>
          </DialogHeader>
          {editingVisitor && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="text-amber-400">Ad</Label>
                  <Input 
                    id="first_name"
                    value={editingVisitor.first_name} 
                    onChange={(e) => setEditingVisitor(prev => ({...prev, first_name: e.target.value.toUpperCase()}))}
                    className="bg-gray-800 border-amber-600 text-amber-400"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-amber-400">Soyad</Label>
                  <Input 
                    id="last_name"
                    value={editingVisitor.last_name} 
                    onChange={(e) => setEditingVisitor(prev => ({...prev, last_name: e.target.value.toUpperCase()}))}
                    className="bg-gray-800 border-amber-600 text-amber-400"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="company" className="text-amber-400">Firma</Label>
                <Input
                  id="company"
                  value={editingVisitor.company || ''}
                  onChange={(e) => setEditingVisitor(prev => ({ ...prev, company: e.target.value.toUpperCase() }))}
                  className="bg-gray-800 border-amber-600 text-amber-400"
                />
              </div>
              <div>
                <Label htmlFor="plate" className="text-amber-400">Plaka</Label>
                <Input
                  id="plate"
                  value={editingVisitor.plate || ''}
                  onChange={(e) => setEditingVisitor(prev => ({ ...prev, plate: e.target.value.toUpperCase() }))}
                  className="bg-gray-800 border-amber-600 text-amber-400"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-amber-400">Açıklama</Label>
                <Textarea
                  id="description"
                  value={editingVisitor.description}
                  onChange={(e) => setEditingVisitor(prev => ({...prev, description: e.target.value}))}
                  className="bg-gray-800 border-amber-600 text-amber-400"
                  rows={3}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-amber-400">Araçtaki Diğer Kişiler</Label>
                  <Button 
                    type="button"
                    size="sm"
                    onClick={() => setEditingAdditionalVisitors([...editingAdditionalVisitors, { first_name: '', last_name: '' }])}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Kişi Ekle
                  </Button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {editingAdditionalVisitors.map((person, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={person.first_name}
                        onChange={(e) => {
                          const updated = [...editingAdditionalVisitors];
                          updated[index].first_name = e.target.value.toUpperCase();
                          setEditingAdditionalVisitors(updated);
                        }}
                        placeholder="AD"
                        className="bg-gray-800 border-amber-600 text-amber-400"
                      />
                      <Input
                        value={person.last_name}
                        onChange={(e) => {
                          const updated = [...editingAdditionalVisitors];
                          updated[index].last_name = e.target.value.toUpperCase();
                          setEditingAdditionalVisitors(updated);
                        }}
                        placeholder="SOYAD"
                        className="bg-gray-800 border-amber-600 text-amber-400"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingAdditionalVisitors(editingAdditionalVisitors.filter((_, i) => i !== index))}
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white px-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-black">
                  İptal
                </Button>
                <Button onClick={handleSaveEdit} className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-bold border-2 border-yellow-300">
                  Kaydet
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}