
import React, { useState, useEffect } from "react";
import { Log } from "@/entities/Log";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trash2, Clock, User as UserIcon, Shield } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function LogPanel() {
  const [logs, setLogs] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const userDisplayRole = user.role === 'admin' ? 'admin' : user.vip_level;
      if (['admin', 'vip-3'].includes(userDisplayRole)) {
        const logData = await Log.list('-created_date', 1000);
        setLogs(logData);
      }
    } catch (error) {
      console.error("Veri yüklenemedi:", error);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm("Tüm log kayıtlarını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      return;
    }

    setDeleting(true);
    try {
      const currentLogs = await Log.list();
      
      // Performans iyileştirmesi: Paralel silme işlemleri
      const deletePromises = currentLogs.map(async (log) => {
        try {
          await Log.delete(log.id);
          return { success: true };
        } catch (error) {
          if (error.response?.status === 404 || error.message?.includes('404') || error.message?.includes('Entity not found')) {
            return { success: true, skipped: true }; // Treat 404 as successfully skipped/non-existent
          }
          console.error(`Log ${log.id} silinemedi:`, error);
          return { success: false };
        }
      });

      const results = await Promise.all(deletePromises);
      const deletedCount = results.filter(r => r.success && !r.skipped).length; // Count actually deleted logs
      const skippedCount = results.filter(r => r.success && r.skipped).length; // Count skipped (404) logs
      const errorCount = results.filter(r => !r.success).length; // Count actual errors

      setLogs([]);
      
      if (errorCount > 0) {
        alert(`${deletedCount} log başarıyla silindi (${skippedCount} log zaten mevcut değildi), ${errorCount} kayıtta hata oluştu.`);
      } else {
        alert(`${deletedCount} log başarıyla silindi (${skippedCount} log zaten mevcut değildi).`);
      }
      
    } catch (error) {
      console.error("Log listesi alınırken hata:", error);
      alert("Log kayıtları silinirken bir hata oluştu.");
    }
    setDeleting(false);
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'SİLME': return 'bg-red-600 text-white';
      case 'GÜNCELLEME': return 'bg-orange-500 text-white';
      case 'ÇIKIŞ': return 'bg-blue-500 text-white';
      case 'HIZLI KAYIT': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const hasAccess = () => {
    if (!currentUser) return false;
    const userDisplayRole = currentUser.role === 'admin' ? 'admin' : currentUser.vip_level;
    return ['admin', 'vip-3'].includes(userDisplayRole);
  }

  if (!hasAccess() && currentUser) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600 border-2 text-center">
          <CardContent className="p-8">
            <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-yellow-400">Yetki Yok</h2>
            <p className="text-yellow-600">Bu sayfaya erişmek için Admin veya VIP-3 yetkisine ihtiyacınız var.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            Log Kayıtları
          </h1>
          <p className="text-lg text-yellow-600 mt-2">
            Sistemde yapılan son işlemler
          </p>
        </div>
        <Button
          onClick={handleClearLogs}
          disabled={deleting}
          className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-bold flex items-center space-x-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>{deleting ? 'Siliniyor...' : 'Tüm Logları Temizle'}</span>
        </Button>
      </div>
      
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600 border-2">
        <CardHeader className="border-b border-yellow-600">
          <CardTitle className="flex items-center space-x-2 text-yellow-400">
             <BookOpen className="w-5 h-5" />
             <span>İşlem Geçmişi</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {logs.length > 0 ? logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors duration-200">
                <div className="flex items-center space-x-4">
                  <Badge className={`${getActionColor(log.action)} px-2 py-1 font-semibold`}>{log.action}</Badge>
                  <p className="text-yellow-300">{log.details}</p>
                </div>
                <div className="text-sm text-yellow-600 flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <UserIcon className="w-4 h-4 text-yellow-500" />
                    <span>{log.user_name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span>{format(new Date(log.created_date), 'd MMMM HH:mm', { locale: tr })}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-yellow-600">
                 <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                Henüz log kaydı bulunmuyor.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
