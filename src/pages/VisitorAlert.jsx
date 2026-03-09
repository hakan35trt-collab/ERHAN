import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { VisitorAlert as VisitorAlertEntity } from "@/entities/VisitorAlert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function VisitorAlert() {
  const [currentUser, setCurrentUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company: '',
    alert_message: '',
    alert_type: 'bekleniyor',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      const alertData = await VisitorAlertEntity.list('-created_date', 100);
      setAlerts(alertData);
    } catch (error) {
      console.error("Veri yüklenemedi:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const alertData = {
        ...formData,
        first_name: formData.first_name ? formData.first_name.toUpperCase() : '',
        last_name: formData.last_name ? formData.last_name.toUpperCase() : '',
        company: formData.company ? formData.company.toUpperCase() : '',
        created_by_name: `${currentUser.first_name} ${currentUser.last_name}`,
        created_by_id: currentUser.id
      };

      await VisitorAlertEntity.create(alertData);
      
      setFormData({
        first_name: '',
        last_name: '',
        company: '',
        alert_message: '',
        alert_type: 'bekleniyor',
        is_active: true
      });
      
      loadData();
    } catch (error) {
      console.error("Uyarı eklenemedi:", error);
    }
    setLoading(false);
  };

  const handleDelete = async (alertId) => {
    if (window.confirm("Bu uyarıyı silmek istediğinizden emin misiniz?")) {
      try {
        await VisitorAlertEntity.delete(alertId);
        loadData();
      } catch (error) {
        console.error("Silme hatası:", error);
      }
    }
  };

  const toggleActive = async (alert) => {
    try {
      await VisitorAlertEntity.update(alert.id, {
        is_active: !alert.is_active
      });
      loadData();
    } catch (error) {
      console.error("Güncelleme hatası:", error);
    }
  };

  const getAlertTypeIcon = (type) => {
    switch (type) {
      case 'bekleniyor': return <Bell className="w-4 h-4" />;
      case 'alinacak': return <CheckCircle className="w-4 h-4" />;
      case 'alinmayacak': return <XCircle className="w-4 h-4" />;
      case 'ozel': return <Info className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getAlertTypeColor = (type) => {
    switch (type) {
      case 'bekleniyor': return 'bg-blue-600 text-white';
      case 'alinacak': return 'bg-green-600 text-white';
      case 'alinmayacak': return 'bg-red-600 text-white';
      case 'ozel': return 'bg-purple-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getAlertTypeLabel = (type) => {
    switch (type) {
      case 'bekleniyor': return 'BEKLENİYOR';
      case 'alinacak': return 'İÇERİ ALINACAK';
      case 'alinmayacak': return 'İÇERİ ALINMAYACAK';
      case 'ozel': return 'ÖZEL UYARI';
      default: return type.toUpperCase();
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-amber-400 flex items-center">
            <Bell className="w-8 h-8 mr-3" />
            Ziyaretçi Uyarı Sistemi
          </h1>
          <p className="text-amber-600 text-sm mt-1">
            Beklenen veya özel durumu olan ziyaretçiler için uyarı oluşturun
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-amber-600 border-2">
          <CardHeader className="border-b border-amber-600">
            <CardTitle className="text-amber-400 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Yeni Uyarı Ekle
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-amber-400">Ad</Label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({...prev, first_name: e.target.value.toUpperCase()}))}
                    className="bg-gray-900 border-amber-600 text-amber-400"
                    placeholder="İSİM (opsiyonel)"
                  />
                </div>
                <div>
                  <Label className="text-amber-400">Soyad</Label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({...prev, last_name: e.target.value.toUpperCase()}))}
                    className="bg-gray-900 border-amber-600 text-amber-400"
                    placeholder="SOYİSİM (opsiyonel)"
                  />
                </div>
              </div>

              <div>
                <Label className="text-amber-400">Firma</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({...prev, company: e.target.value.toUpperCase()}))}
                  className="bg-gray-900 border-amber-600 text-amber-400"
                  placeholder="FİRMA (opsiyonel)"
                />
              </div>

              <div>
                <Label className="text-amber-400">Uyarı Tipi *</Label>
                <Select value={formData.alert_type} onValueChange={(value) => setFormData(prev => ({...prev, alert_type: value}))}>
                  <SelectTrigger className="bg-gray-900 border-amber-600 text-amber-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-amber-600">
                    <SelectItem value="bekleniyor" className="text-amber-400">Bekleniyor</SelectItem>
                    <SelectItem value="alinacak" className="text-amber-400">İçeri Alınacak</SelectItem>
                    <SelectItem value="alinmayacak" className="text-amber-400">İçeri Alınmayacak</SelectItem>
                    <SelectItem value="ozel" className="text-amber-400">Özel Uyarı</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-amber-400">Uyarı Mesajı *</Label>
                <Textarea
                  value={formData.alert_message}
                  onChange={(e) => setFormData(prev => ({...prev, alert_message: e.target.value.toUpperCase()}))}
                  className="bg-gray-900 border-amber-600 text-amber-400 h-24"
                  placeholder="UYARI MESAJI"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-bold border-2 border-yellow-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                {loading ? "Ekleniyor..." : "Uyarı Ekle"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Uyarı Listesi */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-amber-600 border-2">
          <CardHeader className="border-b border-amber-600">
            <CardTitle className="text-amber-400 flex items-center justify-between">
              <span className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Aktif Uyarılar
              </span>
              <Badge variant="outline" className="border-amber-600 text-amber-400">
                {alerts.filter(a => a.is_active).length} Aktif
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              <AnimatePresence>
                {alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className={`p-4 rounded-lg border transition-all ${
                      alert.is_active 
                        ? 'bg-gray-700 border-amber-600/50' 
                        : 'bg-gray-800/50 border-gray-600/30 opacity-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={getAlertTypeColor(alert.alert_type)}>
                          {getAlertTypeIcon(alert.alert_type)}
                          <span className="ml-1">{getAlertTypeLabel(alert.alert_type)}</span>
                        </Badge>
                        {!alert.is_active && (
                          <Badge variant="outline" className="text-xs">
                            Pasif
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => toggleActive(alert)}
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs border-amber-600 text-amber-400"
                        >
                          {alert.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                        </Button>
                        <Button
                          onClick={() => handleDelete(alert.id)}
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {(alert.first_name || alert.last_name) && (
                        <div className="text-amber-400 font-semibold">
                          {alert.first_name} {alert.last_name}
                        </div>
                      )}
                      {alert.company && (
                        <div className="text-amber-600 text-sm">
                          🏢 {alert.company}
                        </div>
                      )}
                      <div className="text-amber-300 text-sm bg-amber-600/10 p-2 rounded border border-amber-600/30 mt-2">
                        {alert.alert_message}
                      </div>
                      <div className="text-xs text-amber-700 mt-2">
                        Oluşturan: {alert.created_by_name}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {alerts.length === 0 && (
                <div className="text-center py-12 text-amber-600">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Henüz uyarı eklenmemiş.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}