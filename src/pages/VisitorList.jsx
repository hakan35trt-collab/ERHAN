import React, { useState, useEffect } from "react";
import { Visitor } from "@/entities/Visitor";
import { FrequentVisitor } from "@/entities/FrequentVisitor";
import { User } from "@/entities/User";
import { Log } from "@/entities/Log";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Edit,
  Trash2,
  LogOut,
  Calendar,
  Building2,
  Users,
  Clock,
  Filter,
  Plus,
  UserPlus,
  Car,
  RotateCcw,
  Download,
  Copy,
  X
} from "lucide-react";
import { format, subDays, isAfter, parseISO } from "date-fns";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function VisitorList() {
  const [visitors, setVisitors] = useState([]);
  const [frequentVisitors, setFrequentVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [editingAdditionalVisitors, setEditingAdditionalVisitors] = useState([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFrequentDialogOpen, setIsFrequentDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false); // New: for filter panel visibility

  // Filter states - default to today, now supports 'all', 'today', 'yesterday', 'week', 'month', or a specific date string (yyyy-MM-dd)
  const [dateFilter, setDateFilter] = useState('today');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [nameFilter, setNameFilter] = useState('');

  const [newFrequentVisitor, setNewFrequentVisitor] = useState({
    first_name: '',
    last_name: '',
    company: '',
    plate: '',
    visit_type: 'sevkiyat',
    description: '',
    vehicle_visitors: []
  });

  useEffect(() => {
    loadData();
  }, []);

  // Updated filtering logic to handle new date filter options
  useEffect(() => {
    let filtered = [...visitors];
    const today = new Date(); // Current date object for calculations
    const todayString = format(today, 'yyyy-MM-dd'); // Today's date as string

    // Date filter
    if (dateFilter !== 'all') {
      if (dateFilter === 'today') {
        filtered = filtered.filter(visitor => visitor.visit_date === todayString);
      } else if (dateFilter === 'yesterday') {
        const yesterdayString = format(subDays(today, 1), 'yyyy-MM-dd');
        filtered = filtered.filter(visitor => visitor.visit_date === yesterdayString);
      } else if (dateFilter === 'week') {
        const sevenDaysAgo = subDays(today, 7);
        filtered = filtered.filter(visitor => {
          const visitorDate = parseISO(visitor.visit_date); // Convert visitor's date string to Date object
          // Include visitors from the last 7 days (inclusive of sevenDaysAgo)
          return isAfter(visitorDate, sevenDaysAgo) || format(visitorDate, 'yyyy-MM-dd') === format(sevenDaysAgo, 'yyyy-MM-dd');
        });
      } else if (dateFilter === 'month') {
        const thirtyDaysAgo = subDays(today, 30);
        filtered = filtered.filter(visitor => {
          const visitorDate = parseISO(visitor.visit_date);
          // Include visitors from the last 30 days (inclusive of thirtyDaysAgo)
          return isAfter(visitorDate, thirtyDaysAgo) || format(visitorDate, 'yyyy-MM-dd') === format(thirtyDaysAgo, 'yyyy-MM-dd');
        });
      } else {
        // This 'else' block handles when dateFilter is a specific 'yyyy-MM-dd' string (from 'custom' selection)
        filtered = filtered.filter(visitor => visitor.visit_date === dateFilter);
      }
    }
    // If dateFilter is 'all', no date filtering is applied.

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'inside') {
        filtered = filtered.filter(visitor => !visitor.exit_time || visitor.exit_time === '');
      } else if (statusFilter === 'exited') {
        filtered = filtered.filter(visitor => visitor.exit_time && visitor.exit_time !== '');
      }
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(visitor => visitor.visit_type === typeFilter);
    }

    // Vehicle filter
    if (vehicleFilter !== 'all') {
      if (vehicleFilter === 'with_vehicle') {
        filtered = filtered.filter(visitor => 
          visitor.description?.includes('Araçla içeri girdi') || 
          visitor.description?.includes('Toplu - Araçla içeri girdi')
        );
      } else if (vehicleFilter === 'without_vehicle') {
        filtered = filtered.filter(visitor => 
          visitor.description?.includes('Yaya') || 
          visitor.description?.includes('Araç dışarıda bırakıldı')
        );
      }
    }

    // Name filter
    if (nameFilter.trim()) {
      const searchTerm = nameFilter.toLowerCase();
      filtered = filtered.filter(visitor =>
        visitor.first_name?.toLowerCase().includes(searchTerm) ||
        visitor.last_name?.toLowerCase().includes(searchTerm) ||
        visitor.company?.toLowerCase().includes(searchTerm) ||
        visitor.plate?.toLowerCase().includes(searchTerm) ||
        visitor.registered_by?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredVisitors(filtered);
  }, [visitors, dateFilter, statusFilter, typeFilter, vehicleFilter, nameFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      const visitorData = await Visitor.list('-created_date', 2000);
      setVisitors(visitorData);

      const frequentData = await FrequentVisitor.list('-created_date');
      setFrequentVisitors(frequentData);
    } catch (error) {
      console.error("Veri yüklenemedi:", error);
    }
    setLoading(false);
  };

  const canPerformAction = (visitor) => {
    if (!currentUser || !visitor) {
      return { canEdit: false, canDelete: false, canAddExit: false };
    }

    const userDisplayRole = currentUser.role === 'admin' ? 'admin' : currentUser.vip_level;

    // Admin sees all records — full control
    if (userDisplayRole === 'admin') {
      return { canEdit: true, canDelete: true, canAddExit: true };
    }

    // Check ownership: match by ID or by registered name
    const fullName = `${currentUser.first_name} ${currentUser.last_name}`;
    const isOwner =
      (visitor.registered_by_id && currentUser.id && String(visitor.registered_by_id) === String(currentUser.id)) ||
      (visitor.registered_by && visitor.registered_by === fullName);

    // VIP-3: full control on all records
    if (userDisplayRole === 'vip-3') {
      return { canEdit: true, canDelete: true, canAddExit: true };
    }

    // VIP-2 and VIP-1: own records = full control, others = only exit
    if (['vip-2', 'vip-1'].includes(userDisplayRole)) {
      if (isOwner) {
        return { canEdit: true, canDelete: true, canAddExit: true };
      }
      return { canEdit: false, canDelete: false, canAddExit: true };
    }

    return { canEdit: false, canDelete: false, canAddExit: false };
  };

  const canRegisterVisitors = () => {
    if (!currentUser) return false;
    const userDisplayRole = currentUser.role === 'admin' ? 'admin' : currentUser.vip_level;
    return ['admin', 'vip-3', 'vip-2'].includes(userDisplayRole);
  };

  const handleEdit = (visitor) => {
    setEditingVisitor({
      ...visitor,
      visit_date: visitor.visit_date || format(new Date(), 'yyyy-MM-dd'),
    });
    setEditingAdditionalVisitors(visitor.vehicle_visitors || []);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const { id, ...updateData } = editingVisitor;
      updateData.vehicle_visitors = editingAdditionalVisitors.filter(v => v.first_name && v.last_name);
      await Visitor.update(id, updateData);

      await Log.create({
        action: "GÜNCELLEME",
        details: `${editingVisitor.first_name} ${editingVisitor.last_name} adlı ziyaretçinin kaydı güncellendi.`,
        user_name: `${currentUser.first_name} ${currentUser.last_name}`
      });

      setIsEditDialogOpen(false);
      setEditingVisitor(null);
      setEditingAdditionalVisitors([]);
      loadData();
    } catch (error) {
      console.error("Güncelleme hatası:", error);
    }
  };

  const handleDelete = async (visitor) => {
    if (window.confirm("Bu kaydı silmek istediğinizden emin misiniz?")) {
      try {
        await Visitor.delete(visitor.id);
        await Log.create({
          action: "SİLME",
          details: `${visitor.first_name} ${visitor.last_name} adlı ziyaretçi silindi.`,
          user_name: `${currentUser.first_name} ${currentUser.last_name}`
        });
        loadData();
      } catch (error) {
        console.error("Silme hatası:", error);
      }
    }
  };

  const addExitTime = async (visitorId, visitorName) => {
    try {
      const currentTime = format(new Date(), 'HH:mm');
      await Visitor.update(visitorId, { exit_time: currentTime });
      await Log.create({
        action: "ÇIKIŞ",
        details: `${visitorName} adlı ziyaretçiye çıkış saati eklendi.`,
        user_name: `${currentUser.first_name} ${currentUser.last_name}`
      });
      loadData();
    } catch (error) {
      console.error("Çıkış saati eklenemedi:", error);
    }
  };

  const createQuickRecord = async (visitor) => {
    try {
      const visitorData = {
        first_name: visitor.first_name,
        last_name: visitor.last_name,
        company: visitor.company || '',
        plate: visitor.plate || '',
        visit_date: format(new Date(), 'yyyy-MM-dd'),
        entry_time: format(new Date(), 'HH:mm'),
        exit_time: '', // Reset exit time for new record
        visit_type: visitor.visit_type,
        description: visitor.description || '',
        vehicle_visitors: visitor.vehicle_visitors || [],
        registered_by: `${currentUser.first_name} ${currentUser.last_name}`,
        registered_by_id: currentUser.id
      };

      await Visitor.create(visitorData);
      await Log.create({
        action: "HIZLI KAYIT",
        details: `${visitor.first_name} ${visitor.last_name} adlı ziyaretçi için hızlı kayıt oluşturuldu.`,
        user_name: `${currentUser.first_name} ${currentUser.last_name}`
      });

      loadData();
    } catch (error) {
      console.error("Hızlı kayıt oluşturulamadı:", error);
    }
  };

  const handleAddFrequentVisitor = async () => {
    try {
      await FrequentVisitor.create({
        ...newFrequentVisitor,
        created_by_name: `${currentUser.first_name} ${currentUser.last_name}`,
        created_by_id: currentUser.id
      });

      setNewFrequentVisitor({
        first_name: '',
        last_name: '',
        company: '',
        plate: '',
        visit_type: 'sevkiyat',
        description: '',
        vehicle_visitors: []
      });

      // Dialog remains open to allow adding more or viewing
      loadData();
    } catch (error) {
      console.error("Sürekli ziyaretçi eklenemedi:", error);
    }
  };

  const createVisitorFromFrequent = async (frequentVisitor) => {
    try {
      const visitorData = {
        first_name: frequentVisitor.first_name,
        last_name: frequentVisitor.last_name,
        company: frequentVisitor.company || '',
        plate: frequentVisitor.plate || '',
        visit_date: format(new Date(), 'yyyy-MM-dd'),
        entry_time: format(new Date(), 'HH:mm'),
        visit_type: frequentVisitor.visit_type,
        description: frequentVisitor.description || '',
        vehicle_visitors: frequentVisitor.vehicle_visitors || [],
        registered_by: `${currentUser.first_name} ${currentUser.last_name}`,
        registered_by_id: currentUser.id
      };

      await Visitor.create(visitorData);
      await Log.create({
        action: "KAYIT",
        details: `${frequentVisitor.first_name} ${frequentVisitor.last_name} adlı sürekli ziyaretçi için yeni kayıt oluşturuldu.`,
        user_name: `${currentUser.first_name} ${currentUser.last_name}`
      });

      loadData();
    } catch (error) {
      console.error("Ziyaretçi kaydı oluşturulamadı:", error);
    }
  };

  const clearFilters = () => {
    setDateFilter('today'); // Reset to 'today' as per initial state
    setStatusFilter('all');
    setTypeFilter('all');
    setVehicleFilter('all');
    setNameFilter('');
    setIsFilterOpen(false); // Close filter panel after clearing
  };

  const downloadExcel = () => {
    const data = filteredVisitors.map(visitor => ({
      "Ad": visitor.first_name || '',
      "Soyad": visitor.last_name || '',
      "Firma": visitor.company || '',
      "Plaka": visitor.plate || '',
      "Ziyaret Tarihi": visitor.visit_date || '',
      "Giriş Saati": visitor.entry_time || '',
      "Çıkış Saati": visitor.exit_time || '',
      "Ziyaret Türü": visitor.visit_type || '',
      "Açıklama": visitor.description || '',
      "Kayıt Yapan": visitor.registered_by || '',
      "Araçtaki Diğer Kişiler": visitor.vehicle_visitors?.map(v => `${v.first_name} ${v.last_name}`).join('; ') || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ziyaretçiler");
    XLSX.writeFile(wb, `ziyaretci_listesi_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
  };

  const toTitleCase = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const copyVisitorInfo = (visitor) => {
    let copyText = `FİRMA: ${visitor.company || 'BELİRTİLMEMİŞ'}\n\n`;
    
    // Ana ziyaretçi - baş harf büyük
    copyText += `${toTitleCase(visitor.first_name)} ${toTitleCase(visitor.last_name)}\n`;
    
    // Araçtaki diğer kişiler - baş harf büyük
    if (visitor.vehicle_visitors && visitor.vehicle_visitors.length > 0) {
      visitor.vehicle_visitors.forEach((person) => {
        copyText += `${toTitleCase(person.first_name)} ${toTitleCase(person.last_name)}\n`;
      });
    }
    
    copyText += `\nGİRİŞ SAATİ: ${visitor.entry_time || 'N/A'}\n\n`;
    
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
      alert('Bilgiler panoya kopyalandı!');
    }).catch(err => {
      console.error('Kopyalama hatası:', err);
      alert('Kopyalama başarısız oldu.');
    });
  };

  const VisitorCard = ({ visitor }) => {
    const permissions = canPerformAction(visitor);
    const canPerformAnyAction = permissions.canAddExit || permissions.canEdit || permissions.canDelete;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="bg-gradient-to-r from-gray-800/90 to-gray-700/90 backdrop-blur-sm rounded-lg p-3 border border-amber-600/30 hover:border-amber-600/60 transition-all duration-300 shadow-sm hover:shadow-lg"
      >
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-sm flex-shrink-0 shadow-md">
            {visitor.first_name?.charAt(0)}
          </div>

          {/* Info Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-amber-400 text-sm truncate">
                {visitor.first_name} {visitor.last_name}
              </h3>
              <div className="flex items-center space-x-1">
                <Badge className={`text-xs px-2 py-0.5 ${
                  visitor.visit_type === 'sevkiyat' ? 'bg-blue-700 text-blue-200' :
                  visitor.visit_type === 'calisma' ? 'bg-green-700 text-green-200' :
                  visitor.visit_type === 'servis' ? 'bg-teal-700 text-teal-200' :
                  'bg-purple-700 text-purple-200'
                }`}>
                  {visitor.visit_type?.toUpperCase()}
                </Badge>
                {!visitor.exit_time || visitor.exit_time === '' ? (
                  <Badge variant="outline" className="bg-orange-700/20 text-orange-300 border-orange-600 text-xs px-2 py-0.5">
                    İçeride
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-700/20 text-gray-400 border-gray-600 text-xs px-2 py-0.5">
                    Çıktı
                  </Badge>
                )}
                {visitor.vehicle_visitors?.length > 0 && (
                  <Badge variant="outline" className="text-xs border-amber-600/50 text-amber-500 px-1.5 py-0.5">
                    +{visitor.vehicle_visitors.length}
                  </Badge>
                )}
              </div>
            </div>

            {/* Details Row - Horizontal layout for plate */}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-amber-600 mb-2">
              {visitor.company && (
                <div className="flex items-center space-x-1">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate max-w-24">{visitor.company}</span>
                </div>
              )}
              {visitor.plate && (
                <div className="flex items-center space-x-1">
                  <Car className="w-3 h-3" />
                  <span className="font-mono">{visitor.plate}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(visitor.visit_date), 'dd.MM.yyyy')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{visitor.entry_time || 'N/A'} → {visitor.exit_time || '...'}</span>
              </div>
            </div>

            {/* Description */}
            {visitor.description && (
              <p className="text-xs text-gray-400 truncate mb-2 italic">
                "{visitor.description}"
              </p>
            )}

            {/* Vehicle Visitors */}
            {visitor.vehicle_visitors?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                <span className="text-xs text-amber-600">Araçtakiler:</span>
                {visitor.vehicle_visitors.map((v, i) => (
                  <span key={i} className="text-xs text-amber-400 bg-amber-600/10 px-1.5 py-0.5 rounded border border-amber-600/30">
                    {v.first_name} {v.last_name}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons - Only show for VIP-2, VIP-3, and admin */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-600/20">
              {canPerformAnyAction && (
                <div className="flex items-center gap-1.5 flex-wrap">
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
                      <LogOut className="w-3 h-3 mr-1" />
                      Çıkış
                    </Button>
                  )}
                  {permissions.canEdit && (
                    <Button
                      onClick={() => handleEdit(visitor)}
                      size="sm"
                      className="h-6 px-2 text-xs bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-bold"
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

              {/* VIP-1 users see read-only information */}
              {!canPerformAnyAction && (
                <div className="text-xs text-amber-500/70">
                  Sadece görüntüleme yetkisi
                </div>
              )}
            </div>

            {/* Record Info */}
            <div className="text-xs text-amber-500/70 pt-1 mt-1 border-t border-gray-600">
              Kayıt: {visitor.registered_by} • {format(new Date(visitor.created_date), 'dd.MM.yyyy HH:mm')}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
            Ziyaretçi Listesi
          </h1>
          <p className="text-base text-amber-600 mt-2">
            Tüm ziyaretçi kayıtları ve arama işlemleri
          </p>
        </div>
      </div>

      {/* Modern Compact Filter Section */}
      <div className="mb-6">
        {/* Filter Toggle Bar */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-amber-600/30 rounded-lg p-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
            {/* Left Side - Filter Toggle and Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                variant="ghost"
                size="sm"
                className="text-amber-400 hover:bg-amber-400 hover:text-black flex items-center space-x-2 w-fit"
              >
                <Filter className="w-4 h-4" />
                <span>Filtreler</span>
                <motion.div
                  animate={{ rotate: isFilterOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-4 h-4"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 10l5 5 5-5z"/>
                  </svg>
                </motion.div>
              </Button>

              {/* Active Filter Summary */}
              <div className="flex items-center flex-wrap gap-2">
                <Badge variant="outline" className="border-amber-600/50 text-amber-400 text-xs">
                  {filteredVisitors.length} kayıt
                </Badge>
                {dateFilter === 'today' && (
                  <Badge className="bg-blue-600 text-white text-xs">
                    Bugün
                  </Badge>
                )}
                {dateFilter === 'yesterday' && (
                  <Badge className="bg-blue-600 text-white text-xs">
                    Dün
                  </Badge>
                )}
                {dateFilter === 'week' && (
                  <Badge className="bg-blue-600 text-white text-xs">
                    Son 7 gün
                  </Badge>
                )}
                {dateFilter === 'month' && (
                  <Badge className="bg-blue-600 text-white text-xs">
                    Son 30 gün
                  </Badge>
                )}
                {dateFilter === 'all' && (
                  <Badge className="bg-purple-600 text-white text-xs">
                    Tüm Tarihler
                  </Badge>
                )}
                {/* This covers specific dates selected via 'custom' input */}
                {dateFilter !== 'all' && dateFilter !== 'today' && dateFilter !== 'yesterday' && dateFilter !== 'week' && dateFilter !== 'month' && (
                  <Badge className="bg-blue-600 text-white text-xs">
                    Tarih: {format(parseISO(dateFilter), 'dd.MM.yyyy')}
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge className="bg-green-600 text-white text-xs">
                    {statusFilter === 'inside' ? 'İçeridekiler' : 'Çıkanlar'}
                  </Badge>
                )}
                {typeFilter !== 'all' && (
                  <Badge className="bg-purple-600 text-white text-xs">
                    {typeFilter}
                  </Badge>
                )}
                {vehicleFilter !== 'all' && (
                  <Badge className="bg-teal-600 text-white text-xs">
                    {vehicleFilter === 'with_vehicle' ? '🚗 Araçlı' : '🚶 Araçsız'}
                  </Badge>
                )}
                {nameFilter && (
                  <Badge className="bg-orange-600 text-white text-xs">
                    "{nameFilter}"
                  </Badge>
                )}
              </div>
            </div>

            {/* Right Side - Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Primary Actions - Top Row on Mobile */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={clearFilters}
                  size="sm"
                  className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-bold text-xs px-3 py-2 flex-1 sm:flex-none"
                >
                  <RotateCcw className="w-3 h-3 mr-1"/>
                  Temizle
                </Button>
                <Button
                  onClick={downloadExcel}
                  size="sm"
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-xs px-3 py-2 flex-1 sm:flex-none"
                >
                  <Download className="w-3 h-3 mr-1"/>
                  Excel
                </Button>
              </div>

              {/* Secondary Actions - Bottom Row on Mobile */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsFrequentDialogOpen(true)}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-xs px-3 py-2 flex-1 sm:flex-none"
                >
                  <Car className="w-3 h-3 mr-1"/>
                  Sürekli ({frequentVisitors.length})
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-amber-600 border mt-2">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <Label className="text-amber-400 text-sm">📅 Tarih</Label>
                      <Select value={dateFilter} onValueChange={(value) => {
                          if (value === 'custom') {
                              // If 'custom' is selected, set the filter to today's date string.
                              // The date input will then pick this up and allow modification.
                              setDateFilter(format(new Date(), 'yyyy-MM-dd'));
                          } else {
                              // For other predefined options, set dateFilter directly
                              setDateFilter(value);
                          }
                      }}>
                        <SelectTrigger className="bg-gray-900 border-amber-600 text-amber-400 h-8 text-sm mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-amber-600">
                          <SelectItem value="all" className="text-amber-400 text-sm">Tümü</SelectItem>
                          <SelectItem value="today" className="text-amber-400 text-sm">Bugün</SelectItem>
                          <SelectItem value="yesterday" className="text-amber-400 text-sm">Dün</SelectItem>
                          <SelectItem value="week" className="text-amber-400 text-sm">Son 7 gün</SelectItem>
                          <SelectItem value="month" className="text-amber-400 text-sm">Son 30 gün</SelectItem>
                          <SelectItem value="custom" className="text-amber-400 text-sm">Özel Tarih</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {/* Custom Date Input - Only show when dateFilter is a specific date string (i.e., not a keyword) */}
                      {dateFilter !== 'all' && dateFilter !== 'today' && dateFilter !== 'yesterday' && dateFilter !== 'week' && dateFilter !== 'month' && (
                        <Input
                          type="date"
                          value={dateFilter} // dateFilter will hold the yyyy-MM-dd string
                          onChange={(e) => setDateFilter(e.target.value)}
                          className="bg-gray-900 border-amber-600 text-amber-400 h-8 text-sm mt-2"
                        />
                      )}
                    </div>

                    <div>
                      <Label className="text-amber-400 text-sm">📊 Durum</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="bg-gray-900 border-amber-600 text-amber-400 h-8 text-sm mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-amber-600">
                          <SelectItem value="all" className="text-amber-400 text-sm">Tümü</SelectItem>
                          <SelectItem value="inside" className="text-amber-400 text-sm">İçeridekiler</SelectItem>
                          <SelectItem value="exited" className="text-amber-400 text-sm">Çıkanlar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-amber-400 text-sm">🏷️ Tür</Label>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="bg-gray-900 border-amber-600 text-amber-400 h-8 text-sm mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-amber-600">
                          <SelectItem value="all" className="text-amber-400 text-sm">Tümü</SelectItem>
                          <SelectItem value="sevkiyat" className="text-amber-400 text-sm">Sevkiyat</SelectItem>
                          <SelectItem value="calisma" className="text-amber-400 text-sm">Çalışma</SelectItem>
                          <SelectItem value="gorusme" className="text-amber-400 text-sm">Görüşme</SelectItem>
                          <SelectItem value="servis" className="text-amber-400 text-sm">Servis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-amber-400 text-sm">🚗 Araç Durumu</Label>
                      <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                        <SelectTrigger className="bg-gray-900 border-amber-600 text-amber-400 h-8 text-sm mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-amber-600">
                          <SelectItem value="all" className="text-amber-400 text-sm">Tümü</SelectItem>
                          <SelectItem value="with_vehicle" className="text-amber-400 text-sm">Araçlı</SelectItem>
                          <SelectItem value="without_vehicle" className="text-amber-400 text-sm">Araçsız</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-amber-400 text-sm">🔍 Arama</Label>
                      <Input
                        placeholder="Ad, soyad, firma, plaka..."
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        className="bg-gray-900 border-amber-600 text-amber-400 placeholder-amber-600 h-8 text-sm mt-1"
                      />
                    </div>
                  </div>

                  {/* Quick Filter Buttons */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-amber-600/30">
                    <Button
                      onClick={() => setDateFilter('all')}
                      size="sm"
                      variant={dateFilter === 'all' ? 'default' : 'outline'}
                      className={`text-xs h-7 ${dateFilter === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white'}`}
                    >
                      📅 Tüm Tarihler
                    </Button>
                    <Button
                      onClick={() => setDateFilter('today')}
                      size="sm"
                      variant={dateFilter === 'today' ? 'default' : 'outline'}
                      className={`text-xs h-7 ${dateFilter === 'today'
                        ? 'bg-blue-600 text-white'
                        : 'border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white'}`}
                    >
                      🗓️ Bugün
                    </Button>
                    <Button
                      onClick={() => setStatusFilter('inside')}
                      size="sm"
                      variant={statusFilter === 'inside' ? 'default' : 'outline'}
                      className={`text-xs h-7 ${statusFilter === 'inside'
                        ? 'bg-orange-600 text-white'
                        : 'border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white'}`}
                    >
                      🔴 İçeridekiler
                    </Button>
                    <Button
                      onClick={() => setStatusFilter('exited')}
                      size="sm"
                      variant={statusFilter === 'exited' ? 'default' : 'outline'}
                      className={`text-xs h-7 ${statusFilter === 'exited'
                        ? 'bg-gray-600 text-white'
                        : 'border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white'}`}
                    >
                      ✅ Çıkanlar
                    </Button>
                    <Button
                      onClick={() => setTypeFilter('sevkiyat')}
                      size="sm"
                      variant={typeFilter === 'sevkiyat' ? 'default' : 'outline'}
                      className={`text-xs h-7 ${typeFilter === 'sevkiyat'
                        ? 'bg-blue-600 text-white'
                        : 'border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white'}`}
                    >
                      🚛 Sevkiyat
                    </Button>
                    <Button
                      onClick={() => setTypeFilter('calisma')}
                      size="sm"
                      variant={typeFilter === 'calisma' ? 'default' : 'outline'}
                      className={`text-xs h-7 ${typeFilter === 'calisma'
                        ? 'bg-green-600 text-white'
                        : 'border-green-600 text-green-400 hover:bg-green-600 hover:text-white'}`}
                    >
                      👷 Çalışma
                    </Button>
                    <Button
                      onClick={() => setVehicleFilter('with_vehicle')}
                      size="sm"
                      variant={vehicleFilter === 'with_vehicle' ? 'default' : 'outline'}
                      className={`text-xs h-7 ${vehicleFilter === 'with_vehicle'
                        ? 'bg-teal-600 text-white'
                        : 'border-teal-600 text-teal-400 hover:bg-teal-600 hover:text-white'}`}
                    >
                      🚗 Araçlı
                    </Button>
                    <Button
                      onClick={() => setVehicleFilter('without_vehicle')}
                      size="sm"
                      variant={vehicleFilter === 'without_vehicle' ? 'default' : 'outline'}
                      className={`text-xs h-7 ${vehicleFilter === 'without_vehicle'
                        ? 'bg-amber-600 text-white'
                        : 'border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-white'}`}
                    >
                      🚶 Araçsız
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modern Compact Visitor Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto pr-2">
        <AnimatePresence>
          {filteredVisitors.map((visitor) => (
            <VisitorCard key={visitor.id} visitor={visitor} />
          ))}
        </AnimatePresence>

        {filteredVisitors.length === 0 && (
          <div className="col-span-full text-center py-12 text-amber-600">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Filtrelere uygun ziyaretçi kaydı bulunmuyor.</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-amber-600">
          <DialogHeader><DialogTitle className="text-amber-400">Ziyaretçi Kaydını Düzenle</DialogTitle></DialogHeader>
          {editingVisitor && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-amber-400">Ad</Label><Input value={editingVisitor.first_name} onChange={(e) => setEditingVisitor(prev => ({...prev, first_name: e.target.value.toUpperCase()}))} className="bg-gray-800 border-amber-600 text-amber-400"/></div>
                <div><Label className="text-amber-400">Soyad</Label><Input value={editingVisitor.last_name} onChange={(e) => setEditingVisitor(prev => ({...prev, last_name: e.target.value.toUpperCase()}))} className="bg-gray-800 border-amber-600 text-amber-400"/></div>
              </div>
               <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-amber-400">Firma</Label><Input value={editingVisitor.company || ''} onChange={(e) => setEditingVisitor(prev => ({...prev, company: e.target.value.toUpperCase()}))} className="bg-gray-800 border-amber-600 text-amber-400"/></div>
                <div><Label className="text-amber-400">Plaka</Label><Input value={editingVisitor.plate || ''} onChange={(e) => setEditingVisitor(prev => ({...prev, plate: e.target.value}))} className="bg-gray-800 border-amber-600 text-amber-400"/></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label className="text-amber-400">Tarih</Label><Input type="date" value={editingVisitor.visit_date} onChange={(e) => setEditingVisitor(prev => ({...prev, visit_date: e.target.value}))} className="bg-gray-800 border-amber-600 text-amber-400"/></div>
                <div><Label className="text-amber-400">Giriş Saati</Label><Input type="time" value={editingVisitor.entry_time} onChange={(e) => setEditingVisitor(prev => ({...prev, entry_time: e.target.value}))} className="bg-gray-800 border-amber-600 text-amber-400"/></div>
                <div><Label className="text-amber-400">Çıkış Saati</Label><Input type="time" value={editingVisitor.exit_time || ''} onChange={(e) => setEditingVisitor(prev => ({...prev, exit_time: e.target.value}))} className="bg-gray-800 border-amber-600 text-amber-400"/></div>
              </div>
               <div>
                  <Label className="text-amber-400">Ziyaret Türü</Label>
                  <Select value={editingVisitor.visit_type} onValueChange={(value) => setEditingVisitor(prev => ({...prev, visit_type: value}))}>
                    <SelectTrigger className="bg-gray-800 border-amber-600 text-amber-400"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-gray-800 border-amber-600">
                      <SelectItem value="sevkiyat" className="text-amber-400">Sevkiyat</SelectItem>
                      <SelectItem value="calisma" className="text-amber-400">Çalışma</SelectItem>
                      <SelectItem value="gorusme" className="text-amber-400">Görüşme</SelectItem>
                      <SelectItem value="servis" className="text-amber-400">Servis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-amber-400">Açıklama</Label><Textarea value={editingVisitor.description || ''} onChange={(e) => setEditingVisitor(prev => ({...prev, description: e.target.value.toUpperCase()}))} className="bg-gray-800 border-amber-600 text-amber-400"/></div>

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
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-black">İptal</Button>
                <Button onClick={handleSaveEdit} className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-bold">Kaydet</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Frequent Visitors Dialog */}
      <Dialog open={isFrequentDialogOpen} onOpenChange={setIsFrequentDialogOpen}>
        <DialogContent className="bg-gray-900 border-amber-600 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-amber-400">
              <Car className="w-5 h-5" />
              <span>Sürekli Gelen Araçlar ({frequentVisitors.length})</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Add New Frequent Visitor Form */}
            <Card className="bg-gray-800 border-amber-600">
              <CardHeader>
                <CardTitle className="text-amber-400 text-lg">
                  <Plus className="w-5 h-5 mr-2 inline" />
                  Yeni Sürekli Ziyaretçi Ekle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-amber-400">Ad</Label>
                    <Input
                      value={newFrequentVisitor.first_name}
                      onChange={(e) => setNewFrequentVisitor(prev => ({...prev, first_name: e.target.value.toUpperCase()}))}
                      className="bg-gray-900 border-amber-600 text-amber-400"
                    />
                  </div>
                  <div>
                    <Label className="text-amber-400">Soyad</Label>
                    <Input
                      value={newFrequentVisitor.last_name}
                      onChange={(e) => setNewFrequentVisitor(prev => ({...prev, last_name: e.target.value.toUpperCase()}))}
                      className="bg-gray-900 border-amber-600 text-amber-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-amber-400">Firma</Label>
                    <Input
                      value={newFrequentVisitor.company}
                      onChange={(e) => setNewFrequentVisitor(prev => ({...prev, company: e.target.value.toUpperCase()}))}
                      className="bg-gray-900 border-amber-600 text-amber-400"
                    />
                  </div>
                  <div>
                    <Label className="text-amber-400">Plaka</Label>
                    <Input
                      value={newFrequentVisitor.plate}
                      onChange={(e) => setNewFrequentVisitor(prev => ({...prev, plate: e.target.value}))}
                      className="bg-gray-900 border-amber-600 text-amber-400"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-amber-400">Varsayılan Ziyaret Türü</Label>
                  <Select value={newFrequentVisitor.visit_type} onValueChange={(value) => setNewFrequentVisitor(prev => ({...prev, visit_type: value}))}>
                    <SelectTrigger className="bg-gray-900 border-amber-600 text-amber-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-amber-600">
                      <SelectItem value="sevkiyat" className="text-amber-400">Sevkiyat</SelectItem>
                      <SelectItem value="calisma" className="text-amber-400">Çalışma</SelectItem>
                      <SelectItem value="gorusme" className="text-amber-400">Görüşme</SelectItem>
                      <SelectItem value="servis" className="text-amber-400">Servis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-amber-400">Açıklama</Label>
                  <Textarea
                    value={newFrequentVisitor.description}
                    onChange={(e) => setNewFrequentVisitor(prev => ({...prev, description: e.target.value.toUpperCase()}))}
                    className="bg-gray-900 border-amber-600 text-amber-400"
                  />
                </div>
                <Button
                  onClick={handleAddFrequentVisitor}
                  className="bg-gradient-to-r from-amber-600 to-yellow-400 hover:from-amber-700 hover:to-yellow-500 text-black font-bold w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Sürekli Ziyaretçi Ekle
                </Button>
              </CardContent>
            </Card>

            {/* Existing Frequent Visitors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {frequentVisitors.map((frequent) => (
                <div key={frequent.id} className="p-4 rounded-lg bg-gray-700 border border-amber-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-yellow-700 rounded-full flex items-center justify-center text-black font-bold text-lg">
                        {frequent.first_name?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-amber-400">
                          {frequent.first_name} {frequent.last_name}
                        </div>
                        <div className="text-sm text-amber-600">
                          {frequent.company && <div>🏢 {frequent.company}</div>}
                          {frequent.plate && <div>🚗 {frequent.plate}</div>}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => createVisitorFromFrequent(frequent)}
                      size="sm"
                      className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold"
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Kayıt Ekle
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={
                      frequent.visit_type === 'sevkiyat' ? 'bg-blue-600 text-white' :
                      frequent.visit_type === 'calisma' ? 'bg-green-600 text-white' :
                      frequent.visit_type === 'servis' ? 'bg-teal-600 text-white' :
                      'bg-purple-600 text-white'
                    }>
                      {frequent.visit_type}
                    </Badge>
                    {frequent.vehicle_visitors?.length > 0 && (
                      <Badge variant="outline" className="text-xs border-amber-600 text-amber-400">
                        +{frequent.vehicle_visitors.length} kişi
                      </Badge>
                    )}
                  </div>
                  {frequent.description && (
                    <p className="text-xs text-gray-300 mt-2 italic">"{frequent.description}"</p>
                  )}
                </div>
              ))}
            </div>

            {frequentVisitors.length === 0 && (
              <div className="text-center py-12 text-amber-600">
                <Car className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Henüz sürekli ziyaretçi kaydı bulunmuyor.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}