import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Visitor } from "@/entities/Visitor";
import { VisitorAlert as VisitorAlertEntity } from "@/entities/VisitorAlert";
import { VisitType } from "@/entities/VisitType";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  UserPlus,
  Plus,
  X,
  Save,
  Users,
  Clock,
  LogOut,
  User as UserIcon,
  RotateCcw,
  LogIn,
  Calendar,
  Building2,
  Car,
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Copy
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function VisitorRegistration() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [visitors, setVisitors] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [recentExits, setRecentExits] = useState([]);
  const [allVisitors, setAllVisitors] = useState([]);
  const [additionalVisitors, setAdditionalVisitors] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [companySuggestionsDismissed, setCompanySuggestionsDismissed] = useState(false);
  const [additionalSuggestions, setAdditionalSuggestions] = useState([]);
  const [showAdditionalSuggestions, setShowAdditionalSuggestions] = useState({});
  const [visitorAlerts, setVisitorAlerts] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [visitTypes, setVisitTypes] = useState([]);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company: '',
    plate: '',
    visit_date: format(new Date(), 'yyyy-MM-dd'),
    entry_time: format(new Date(), 'HH:mm'),
    exit_time: '',
    visit_type: 'calisma',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      const visitorData = await Visitor.list('-created_date', 100);
      setVisitors(visitorData);
      
      // Load more visitors for autocomplete (last 1000)
      const allVisitorData = await Visitor.list('-created_date', 1000);
      setAllVisitors(allVisitorData);

      // Load visitor alerts
      const alertData = await VisitorAlertEntity.filter({ is_active: true }, '-created_date', 100);
      setVisitorAlerts(alertData);

      // Load visit types
      const types = await VisitType.filter({ is_active: true }, 'order', 100);
      setVisitTypes(types);
      if (types.length > 0 && !formData.visit_type) {
        const defaultType = types.find(t => t.name === 'calisma') || types[0];
        setFormData(prev => ({ ...prev, visit_type: defaultType.name }));
      }

      // Separate recent entries and exits
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayVisitors = visitorData.filter(v => v.visit_date === today);
      
      // Son girişler (bugün kaydedilen ve henüz çıkış yapmamış)
      const entries = todayVisitors
        .filter(v => !v.exit_time)
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        .slice(0, 10);
      
      // Son çıkışlar (bugün çıkış saati eklenmiş)
      const exits = todayVisitors
        .filter(v => v.exit_time)
        .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
        .slice(0, 10);

      setRecentEntries(entries);
      setRecentExits(exits);
    } catch (error) {
      console.error("Veri yüklenemedi:", error);
    }
  };



  const handleInputChange = (field, value) => {
    const upperValue = field === 'first_name' || field === 'last_name' || field === 'company' || field === 'plate' ? value.toUpperCase() : value;
    
    setFormData(prev => ({
      ...prev,
      [field]: upperValue
    }));

    // Show autocomplete suggestions for name and plate fields
    if ((field === 'first_name' || field === 'last_name' || field === 'plate') && value.length >= 2) {
      setSuggestionsDismissed(false);
      getSuggestions(field, upperValue);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    if (field === 'company') {
      if (value.length >= 2) {
        setCompanySuggestionsDismissed(false);
        getCompanySuggestions(upperValue);
      } else {
        setCompanySuggestions([]);
        setShowCompanySuggestions(false);
      }
    }

    // Check for visitor alerts
    checkVisitorAlerts(field, upperValue);
  };

  const checkVisitorAlerts = (field, value) => {
    if (value.length < 2) {
      setActiveAlert(null);
      return;
    }

    const currentFormData = { ...formData, [field]: value };
    const normalizedValue = normalizeText(value);

    // Find matching alert
    const matchingAlert = visitorAlerts.find(alert => {
      const normalizedFirstName = normalizeText(alert.first_name);
      const normalizedLastName = normalizeText(alert.last_name);
      const normalizedCompany = normalizeText(alert.company);
      const normalizedFormFirstName = normalizeText(currentFormData.first_name);
      const normalizedFormLastName = normalizeText(currentFormData.last_name);
      const normalizedFormCompany = normalizeText(currentFormData.company);

      // Match by name
      if (alert.first_name && alert.last_name) {
        if (normalizedFormFirstName.includes(normalizedFirstName) && 
            normalizedFormLastName.includes(normalizedLastName)) {
          return true;
        }
      }

      // Match by company
      if (alert.company && normalizedFormCompany.includes(normalizedCompany)) {
        return true;
      }

      return false;
    });

    setActiveAlert(matchingAlert || null);
    if (matchingAlert) setAlertDismissed(false);
  };

  // Türkçe karakter normalizasyonu
  const normalizeText = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/ş/g, 's')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'i')
      .replace(/Ş/g, 's')
      .replace(/Ğ/g, 'g')
      .replace(/Ü/g, 'u')
      .replace(/Ö/g, 'o')
      .replace(/Ç/g, 'c');
  };

  const getCompanySuggestions = (value) => {
    const normalizedValue = normalizeText(value);
    const filtered = allVisitors.filter(visitor => {
      const normalizedCompany = normalizeText(visitor.company);
      return normalizedCompany?.includes(normalizedValue) && visitor.company;
    });

    const unique = filtered.reduce((acc, current) => {
      const key = `${current.first_name}-${current.last_name}-${current.company}-${current.plate}`;
      if (!acc.find(item => `${item.first_name}-${item.last_name}-${item.company}-${item.plate}` === key)) {
        acc.push(current);
      }
      return acc;
    }, []);

    setCompanySuggestions(unique.slice(0, 5));
    setShowCompanySuggestions(unique.length > 0 && !companySuggestionsDismissed);
  };

  const applyCompanySuggestion = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      first_name: suggestion.first_name || '',
      last_name: suggestion.last_name || '',
      company: suggestion.company || '',
      plate: suggestion.plate || '',
      visit_type: suggestion.visit_type || 'calisma',
      visit_date: format(new Date(), 'yyyy-MM-dd'),
      entry_time: format(new Date(), 'HH:mm'),
      exit_time: ''
    }));
    if (suggestion.vehicle_visitors && suggestion.vehicle_visitors.length > 0) {
      setAdditionalVisitors(suggestion.vehicle_visitors.map(v => ({
        first_name: v.first_name || '',
        last_name: v.last_name || ''
      })));
    }
    setCompanySuggestions([]);
    setShowCompanySuggestions(false);
  };

  const getSuggestions = (field, value) => {
    let filteredSuggestions = [];
    const normalizedValue = normalizeText(value);

    if (field === 'first_name' || field === 'last_name') {
      filteredSuggestions = allVisitors.filter(visitor => {
        const normalizedFirstName = normalizeText(visitor.first_name);
        const normalizedLastName = normalizeText(visitor.last_name);
        return (
          (normalizedFirstName?.includes(normalizedValue) || 
           normalizedLastName?.includes(normalizedValue)) &&
          (visitor.first_name || visitor.last_name)
        );
      });
    } else if (field === 'plate') {
      filteredSuggestions = allVisitors.filter(visitor => {
        const normalizedPlate = normalizeText(visitor.plate);
        return normalizedPlate?.includes(normalizedValue) && visitor.plate;
      });
    }

    const sortedSuggestions = [...filteredSuggestions].sort((a, b) => {
      const dateA = a.created_date || a.visit_date || '';
      const dateB = b.created_date || b.visit_date || '';
      return dateB.localeCompare(dateA);
    });

    const uniqueSuggestions = sortedSuggestions.reduce((acc, current) => {
      const key = `${current.first_name}-${current.last_name}-${current.plate}-${current.company}`;
      if (!acc.find(item => `${item.first_name}-${item.last_name}-${item.plate}-${item.company}` === key)) {
        acc.push(current);
      }
      return acc;
    }, []);

    setSuggestions(uniqueSuggestions.slice(0, 5));
    setShowSuggestions(uniqueSuggestions.length > 0 && !suggestionsDismissed);
  };

  const applySuggestion = (suggestion) => {
    // Fill all fields for main visitor (first record)
    setFormData(prev => ({
      ...prev,
      first_name: suggestion.first_name || '',
      last_name: suggestion.last_name || '',
      company: suggestion.company || '',
      plate: suggestion.plate || '',
      visit_type: suggestion.visit_type || 'sevkiyat',
      visit_date: format(new Date(), 'yyyy-MM-dd'),
      entry_time: format(new Date(), 'HH:mm'),
      exit_time: ''
    }));
    
    // Fill only first_name and last_name for additional visitors (2nd, 3rd, etc.)
    if (suggestion.vehicle_visitors && suggestion.vehicle_visitors.length > 0) {
      setAdditionalVisitors(suggestion.vehicle_visitors.map(v => ({
        first_name: v.first_name || '',
        last_name: v.last_name || ''
      })));
    }
    
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const clearForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      company: '',
      plate: '',
      visit_date: format(new Date(), 'yyyy-MM-dd'),
      entry_time: format(new Date(), 'HH:mm'),
      exit_time: '',
      visit_type: visitTypes.length > 0 ? visitTypes[0].name : '',
      description: ''
    });
    setHasVehicle(false);
    setAdditionalVisitors([]);
    setSuggestions([]);
    setShowSuggestions(false);
    setSuggestionsDismissed(false);
    setCompanySuggestions([]);
    setShowCompanySuggestions(false);
    setCompanySuggestionsDismissed(false);
  };

  const addAdditionalVisitor = () => {
    setAdditionalVisitors(prev => [...prev, { first_name: '', last_name: '' }]);
  };

  const removeAdditionalVisitor = (index) => {
    setAdditionalVisitors(prev => prev.filter((_, i) => i !== index));
  };

  const handleAdditionalVisitorChange = (index, field, value) => {
    const upperValue = value.toUpperCase();
    setAdditionalVisitors(prev => prev.map((visitor, i) =>
      i === index ? { ...visitor, [field]: upperValue } : visitor
    ));

    // Show autocomplete for additional visitors
    if ((field === 'first_name' || field === 'last_name') && value.length >= 2) {
      getAdditionalSuggestions(index, field, upperValue);
    } else {
      setShowAdditionalSuggestions(prev => ({ ...prev, [index]: false }));
    }
  };

  const getAdditionalSuggestions = (index, field, value) => {
    const normalizedValue = normalizeText(value);
    let filteredSuggestions = allVisitors.filter(visitor => {
      const normalizedFirstName = normalizeText(visitor.first_name);
      const normalizedLastName = normalizeText(visitor.last_name);
      return (
        (normalizedFirstName?.includes(normalizedValue) || 
         normalizedLastName?.includes(normalizedValue)) &&
        (visitor.first_name || visitor.last_name)
      );
    });

    const uniqueSuggestions = filteredSuggestions.reduce((acc, current) => {
      const key = `${current.first_name}-${current.last_name}`;
      if (!acc.find(item => `${item.first_name}-${item.last_name}` === key)) {
        acc.push(current);
      }
      return acc;
    }, []);

    setAdditionalSuggestions(prev => ({
      ...prev,
      [index]: uniqueSuggestions.slice(0, 5)
    }));
    setShowAdditionalSuggestions(prev => ({
      ...prev,
      [index]: uniqueSuggestions.length > 0
    }));
  };

  const applyAdditionalSuggestion = (index, suggestion) => {
    // Only fill first_name and last_name for additional visitors
    setAdditionalVisitors(prev => prev.map((visitor, i) =>
      i === index ? {
        ...visitor,
        first_name: suggestion.first_name || '',
        last_name: suggestion.last_name || ''
      } : visitor
    ));
    setShowAdditionalSuggestions(prev => ({ ...prev, [index]: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("Form gönderiliyor...");
    console.log("Current User:", currentUser);
    console.log("Form Data:", formData);
    
    if (!currentUser) {
      alert("Kullanıcı bilgisi yüklenemedi!");
      return;
    }
    
    if (!formData.first_name || !formData.last_name) {
      alert("Ad ve Soyad zorunludur!");
      return;
    }
    
    setLoading(true);

    try {
      let description = formData.description;
      
      // Araç durumu kontrolü - sadece araçlı/araçsız için
      // Eğer ek kişi varsa ve araç varsa, "Toplu" olarak işaretle
      const hasAdditionalPeople = additionalVisitors.filter(v => v.first_name && v.last_name).length > 0;
      
      if (hasVehicle && formData.plate) {
        if (hasAdditionalPeople) {
          description = description ? `${description} (Toplu - Araçla içeri girdi)` : 'Toplu - Araçla içeri girdi';
        } else {
          description = description ? `${description} (Araçla içeri girdi)` : 'Araçla içeri girdi';
        }
      } else if (!hasVehicle && formData.plate) {
        description = description ? `${description} (Araç dışarıda bırakıldı)` : 'Araç dışarıda bırakıldı';
      } else if (!hasVehicle && !formData.plate) {
        // Yaya - plaka yok
        description = description ? `${description} (Yaya)` : 'Yaya';
      }

      const visitorData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        company: formData.company || '',
        plate: formData.plate || '',
        visit_date: formData.visit_date,
        entry_time: formData.entry_time,
        exit_time: formData.exit_time || '',
        visit_type: formData.visit_type,
        description: description || '',
        registered_by: `${currentUser.first_name} ${currentUser.last_name}`,
        registered_by_id: currentUser.id,
        vehicle_visitors: additionalVisitors.filter(v => v.first_name && v.last_name)
      };

      console.log("Kaydedilecek veri:", visitorData);
      
      await Visitor.create(visitorData);
      
      console.log("Kayıt başarılı!");
      toast.success("Kayıt başarılı!");
      
      clearForm();
      await loadData();
      
    } catch (error) {
      console.error("HATA DETAYI:", error);
      toast.error("Kayıt hatası: " + (error.message || "Bilinmeyen hata"));
    } finally {
      setLoading(false);
    }
  };

  const addExitTime = async (visitorId, visitorName) => {
    try {
      const currentTime = format(new Date(), 'HH:mm');
      await Visitor.update(visitorId, { exit_time: currentTime });
      loadData();
    } catch (error) {
      console.error("Çıkış saati eklenemedi:", error);
    }
  };

  const canEditRecord = () => {
    if (!currentUser) return false;
    const userDisplayRole = currentUser.role === 'admin' ? 'admin' : currentUser.vip_level;
    return ['admin', 'vip-3', 'vip-2'].includes(userDisplayRole);
  };

  const getInsideDuration = (entryTime, visitDate) => {
    if (!entryTime || !visitDate) return '';
    const now = new Date();
    const entryDateTime = new Date(`${visitDate}T${entryTime}`);
    const diffMinutes = Math.floor((now - entryDateTime) / (1000 * 60));
    
    if (diffMinutes < 0) return '0 dk';
    if (diffMinutes < 60) return `${diffMinutes} dk`;
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}s ${minutes}dk`;
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
      copyText += `YEMEK GETİRDİ`;
    } else {
      copyText += `GİRİŞ YAPTI`;
    }

    navigator.clipboard.writeText(copyText).catch(err => {
      console.error('Kopyalama hatası:', err);
    });
  };

  const VisitorCard = ({ visitor, type }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-all duration-200 border border-amber-600/50"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-amber-700 rounded-full flex items-center justify-center text-black font-bold text-lg">
            {visitor.first_name?.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-amber-400 flex items-center space-x-2">
              <span>{visitor.first_name} {visitor.last_name}</span>
              {visitor.vehicle_visitors?.length > 0 && (
                <Badge variant="outline" className="text-xs border-amber-600 text-amber-400">
                  +{visitor.vehicle_visitors.length}
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-amber-600 space-y-1 mt-1">
              <div className="flex items-center space-x-4 flex-wrap">
                {visitor.company && (
                  <div className="flex items-center space-x-1">
                    <Building2 className="w-3 h-3" />
                    <span>{visitor.company}</span>
                  </div>
                )}
                {visitor.plate && (
                  <div className="flex items-center space-x-1">
                    <Car className="w-3 h-3" />
                    <span>{visitor.plate}</span>
                  </div>
                )}
                {visitor.description?.includes('Araçla içeri girdi') && (
                  <Badge className="text-xs bg-green-600 text-white">
                    🚗 Araçlı
                  </Badge>
                )}
                {visitor.description?.includes('Araç dışarıda bırakıldı') && (
                  <Badge className="text-xs bg-orange-600 text-white">
                    🚶 Araçsız
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                {type === 'entry' ? (
                  <span>Giriş: {visitor.entry_time} ({getInsideDuration(visitor.entry_time, visitor.visit_date)})</span>
                ) : (
                  <span>Çıkış: {visitor.exit_time} (Giriş: {visitor.entry_time})</span>
                )}
              </div>

              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(type === 'entry' ? visitor.created_date : visitor.updated_date), 'HH:mm')}</span>
                <span className="ml-2 text-xs">• {visitor.registered_by}</span>
              </div>
            </div>

            {visitor.vehicle_visitors?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {visitor.vehicle_visitors.map((v, i) => (
                  <div key={i} className="text-xs bg-gray-800 px-2 py-1 rounded border border-amber-600/30 text-amber-300">
                    {v.first_name} {v.last_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <Badge
            className={
              visitor.visit_type === 'sevkiyat' ? 'bg-blue-600 text-white' :
              visitor.visit_type === 'calisma' ? 'bg-green-600 text-white' :
              visitor.visit_type === 'servis' ? 'bg-teal-600 text-white' :
              'bg-purple-600 text-white'
            }
          >
            {visitor.visit_type}
          </Badge>
          
          <Button
            onClick={() => copyVisitorInfo(visitor)}
            size="sm"
            className="text-xs px-2 py-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
          >
            <Copy className="w-3 h-3 mr-1" />
            Kopyala
          </Button>
          
          {type === 'entry' && canEditRecord() && (
            <Button
              onClick={() => addExitTime(visitor.id, `${visitor.first_name} ${visitor.last_name}`)}
              size="sm"
              className="text-xs px-2 py-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-bold border-2 border-yellow-300"
            >
              <LogOut className="w-3 h-3 mr-1" />
              Çıkış
            </Button>
          )}
          
          {type === 'exit' && (
            <Badge variant="outline" className="bg-gray-600 text-gray-200 border-gray-500 text-xs">
              Çıktı
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Kayıt Formu */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-amber-600 border-2 h-fit">
          <CardHeader className="text-center border-b border-amber-600">
            <CardTitle className="flex items-center justify-center space-x-2 text-xl md:text-2xl text-amber-400">
              <UserPlus className="w-6 h-6 text-amber-400" />
              <span>Yeni Ziyaretçi Kaydı</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Active Alert - Fixed overlay modal above everything */}
            {activeAlert && !alertDismissed && (
              <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 px-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`pointer-events-auto w-full max-w-md rounded-xl border-2 shadow-2xl p-4 ${
                    activeAlert.alert_type === 'bekleniyor' ? 'bg-blue-950 border-blue-500' :
                    activeAlert.alert_type === 'alinacak' ? 'bg-green-950 border-green-500' :
                    activeAlert.alert_type === 'alinmayacak' ? 'bg-red-950 border-red-500' :
                    'bg-purple-950 border-purple-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {activeAlert.alert_type === 'bekleniyor' && <Bell className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />}
                    {activeAlert.alert_type === 'alinacak' && <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />}
                    {activeAlert.alert_type === 'alinmayacak' && <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />}
                    {activeAlert.alert_type === 'ozel' && <Info className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <div className="font-bold text-amber-400 text-sm mb-1">
                        {activeAlert.alert_type === 'bekleniyor' && '⚠️ BEKLENİYOR'}
                        {activeAlert.alert_type === 'alinacak' && '✅ İÇERİ ALINACAK'}
                        {activeAlert.alert_type === 'alinmayacak' && '❌ İÇERİ ALINMAYACAK'}
                        {activeAlert.alert_type === 'ozel' && '📌 ÖZEL UYARI'}
                      </div>
                      <div className="text-amber-300 text-sm">{activeAlert.alert_message}</div>
                    </div>
                    <button
                      onClick={() => setAlertDismissed(true)}
                      className="text-gray-400 hover:text-white p-1 rounded flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Ana Ziyaretçi Bilgileri */}
              <div className="flex items-end space-x-2 relative">
                {/* Autocomplete Suggestions - moved above inputs */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 z-50 bg-gray-800 border border-amber-600 rounded-md mb-1 max-h-48 overflow-y-auto shadow-2xl">
                    <div className="flex items-center justify-between px-3 py-1 border-b border-amber-600/50 bg-gray-900">
                      <span className="text-xs text-amber-500">Öneriler</span>
                      <button
                        type="button"
                        onClick={() => { setShowSuggestions(false); setSuggestionsDismissed(true); }}
                        className="text-amber-600 hover:text-red-400 transition-colors p-1 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => applySuggestion(suggestion)}
                        className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-600 last:border-b-0 transition-colors duration-200"
                      >
                        <div className="text-amber-400 font-semibold text-sm">
                          {suggestion.first_name} {suggestion.last_name}
                        </div>
                        <div className="text-xs text-amber-600 mt-1">
                          {suggestion.company && `🏢 ${suggestion.company}`}
                          {suggestion.plate && ` 🚗 ${suggestion.plate}`}
                          <span className="ml-2 text-xs">({suggestion.visit_type})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex-1">
                  <Label htmlFor="first_name" className="text-amber-400">Ad *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="bg-gray-900 border-amber-600 text-amber-400 placeholder-amber-600 focus:border-amber-400"
                    placeholder="AD"
                    required
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="last_name" className="text-amber-400">Soyad *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="bg-gray-900 border-amber-600 text-amber-400 placeholder-amber-600 focus:border-amber-400"
                    placeholder="SOYAD"
                    required
                  />
                </div>
                <Button
                  type="button"
                  onClick={addAdditionalVisitor}
                  size="sm"
                  className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
                >
                  <UserIcon className="w-4 h-4 mr-1" /> Kişi Ekle
                </Button>
              </div>

              {/* Ek Yolcular */}
              <AnimatePresence>
                {additionalVisitors.map((visitor, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center space-x-2 relative"
                  >
                    {/* Suggestions for additional visitors */}
                    {showAdditionalSuggestions[index] && additionalSuggestions[index]?.length > 0 && (
                      <div className="absolute bottom-full left-0 right-12 z-50 bg-gray-800 border border-amber-600 rounded-md mb-1 max-h-48 overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between px-3 py-1 border-b border-amber-600/50 bg-gray-900">
                          <span className="text-xs text-amber-500">Öneriler</span>
                          <button
                            type="button"
                            onClick={() => setShowAdditionalSuggestions(prev => ({ ...prev, [index]: false }))}
                            className="text-amber-600 hover:text-red-400 transition-colors p-1 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        {additionalSuggestions[index].map((suggestion, idx) => (
                          <div
                            key={idx}
                            onClick={() => applyAdditionalSuggestion(index, suggestion)}
                            className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-600 last:border-b-0 transition-colors duration-200"
                          >
                            <div className="text-amber-400 font-semibold text-sm">
                              {suggestion.first_name} {suggestion.last_name}
                            </div>
                            <div className="text-xs text-amber-600 mt-1">
                              {suggestion.company && `🏢 ${suggestion.company}`}
                              {suggestion.plate && ` 🚗 ${suggestion.plate}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <Input
                      value={visitor.first_name}
                      onChange={(e) => handleAdditionalVisitorChange(index, 'first_name', e.target.value)}
                      placeholder="AD"
                      className="bg-gray-900 border-amber-600 text-amber-400 placeholder-amber-600"
                    />
                    <Input
                      value={visitor.last_name}
                      onChange={(e) => handleAdditionalVisitorChange(index, 'last_name', e.target.value)}
                      placeholder="SOYAD"
                      className="bg-gray-900 border-amber-600 text-amber-400 placeholder-amber-600"
                    />
                    <Button
                      type="button"
                      onClick={() => removeAdditionalVisitor(index)}
                      size="sm"
                      variant="outline"
                      className="px-2 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>

              <div className="relative">
                <Label htmlFor="company" className="text-amber-400">Firma</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="bg-gray-900 border-amber-600 text-amber-400 placeholder-amber-600"
                  placeholder="FİRMA ADI"
                />
                {showCompanySuggestions && companySuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-gray-800 border border-amber-600 rounded-md mt-1 max-h-48 overflow-y-auto shadow-2xl">
                    <div className="flex items-center justify-between px-3 py-1 border-b border-amber-600/50 bg-gray-900">
                      <span className="text-xs text-amber-500">Öneriler</span>
                      <button
                        type="button"
                        onClick={() => { setShowCompanySuggestions(false); setCompanySuggestionsDismissed(true); }}
                        className="text-amber-600 hover:text-red-400 transition-colors p-1 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    {companySuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => applyCompanySuggestion(suggestion)}
                        className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-600 last:border-b-0 transition-colors duration-200"
                      >
                        <div className="text-amber-400 font-semibold text-sm">
                          {suggestion.first_name} {suggestion.last_name}
                        </div>
                        <div className="text-xs text-amber-600 mt-1">
                          {suggestion.company && `🏢 ${suggestion.company}`}
                          {suggestion.plate && ` 🚗 ${suggestion.plate}`}
                          <span className="ml-2 text-xs">({suggestion.visit_type})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="plate" className="text-amber-400">Plaka {!hasVehicle && <span className="text-amber-600 text-xs">(Opsiyonel)</span>}</Label>
                <Input
                  id="plate"
                  value={formData.plate}
                  onChange={(e) => handleInputChange('plate', e.target.value)}
                  className="bg-gray-900 border-amber-600 text-amber-400 placeholder-amber-600"
                  placeholder="34 ABC 123"
                />
              </div>

              <div>
                <Label className="text-amber-400 mb-2 block">Araç Durumu</Label>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setHasVehicle(false)}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                      !hasVehicle
                        ? 'bg-red-600 border-red-600 text-white font-bold'
                        : 'bg-gray-900 border-amber-600/50 text-amber-400 hover:border-amber-600'
                    }`}
                  >
                    🚶 Yaya
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasVehicle(true)}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                      hasVehicle
                        ? 'bg-green-600 border-green-600 text-white font-bold'
                        : 'bg-gray-900 border-amber-600/50 text-amber-400 hover:border-amber-600'
                    }`}
                  >
                    🚗 Araçlı
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="visit_date" className="text-amber-400">Tarih</Label>
                  <Input
                    id="visit_date"
                    type="date"
                    value={formData.visit_date}
                    onChange={(e) => handleInputChange('visit_date', e.target.value)}
                    className="bg-gray-900 border-amber-600 text-amber-400"
                  />
                </div>
                <div>
                  <Label htmlFor="entry_time" className="text-amber-400">Giriş Saati</Label>
                  <Input
                    id="entry_time"
                    type="time"
                    value={formData.entry_time}
                    onChange={(e) => handleInputChange('entry_time', e.target.value)}
                    className="bg-gray-900 border-amber-600 text-amber-400"
                  />
                </div>
                <div>
                  <Label htmlFor="visit_type" className="text-amber-400">Ziyaret Türü *</Label>
                  <Select value={formData.visit_type} onValueChange={(value) => handleInputChange('visit_type', value)}>
                    <SelectTrigger className="bg-gray-900 border-amber-600 text-amber-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-amber-600">
                      {visitTypes.map((type) => (
                        <SelectItem key={type.id} value={type.name} className="text-amber-400 capitalize">
                          {type.name.charAt(0).toUpperCase() + type.name.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-amber-400">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value.toUpperCase())}
                  className="bg-gray-900 border-amber-600 text-amber-400 placeholder-amber-600 h-20"
                  placeholder="AÇIKLAMA"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={clearForm}
                  variant="outline"
                  className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white border-gray-500 flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Temizle</span>
                </Button>

                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black flex items-center justify-center space-x-2 font-bold border-2 border-yellow-300"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? "Kaydediliyor..." : "Kaydet"}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Son İşlemler */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-amber-600 border-2">
          <CardHeader className="border-b border-amber-600">
            <CardTitle className="flex items-center space-x-2 text-amber-400">
              <Clock className="w-5 h-5" />
              <span>Bugünkü Hareketler</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Tabs defaultValue="entries" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-700">
                <TabsTrigger value="entries" className="data-[state=active]:bg-amber-600 data-[state=active]:text-black flex items-center space-x-2">
                  <LogIn className="w-4 h-4" />
                  <span>Son Girişler ({recentEntries.length})</span>
                </TabsTrigger>
                <TabsTrigger value="exits" className="data-[state=active]:bg-amber-600 data-[state=active]:text-black flex items-center space-x-2">
                  <LogOut className="w-4 h-4" />
                  <span>Son Çıkışlar ({recentExits.length})</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="entries" className="space-y-3 mt-4 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {recentEntries.map((visitor) => (
                    <VisitorCard key={`entry-${visitor.id}`} visitor={visitor} type="entry" />
                  ))}
                </AnimatePresence>
                {recentEntries.length === 0 && (
                  <div className="text-center py-8 text-amber-600">
                    <LogIn className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Bugün henüz giriş kaydı yok.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="exits" className="space-y-3 mt-4 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {recentExits.map((visitor) => (
                    <VisitorCard key={`exit-${visitor.id}`} visitor={visitor} type="exit" />
                  ))}
                </AnimatePresence>
                {recentExits.length === 0 && (
                  <div className="text-center py-8 text-amber-600">
                    <LogOut className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Bugün henüz çıkış kaydı yok.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}