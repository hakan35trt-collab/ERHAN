import React, { useState, useEffect } from "react";
import { Visitor } from "@/entities/Visitor";
import { User } from "@/entities/User";
import { Log } from "@/entities/Log";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  LogIn,
  Edit,
  Trash2,
  LogOut,
  Building2,
  Users,
  Clock,
  MessageCircle,
  Car,
  User as UserIcon,
  UserPlus,
  RefreshCw,
  Search,
  CheckSquare,
  Square,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ghGet, ghPut } from "@/lib/githubStore";

export default function InsideVisitors() {
  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkExiting, setBulkExiting] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const normalizedSearch = normalizeText(searchTerm);
      const filtered = visitors.filter(visitor => {
        const firstName = normalizeText(visitor.first_name);
        const lastName = normalizeText(visitor.last_name);
        const company = normalizeText(visitor.company);
        const plate = normalizeText(visitor.plate);

        const mainMatch = firstName.includes(normalizedSearch) ||
                         lastName.includes(normalizedSearch) ||
                         company.includes(normalizedSearch) ||
                         plate.includes(normalizedSearch);

        const vehicleMatch = visitor.vehicle_visitors?.some(v => {
          const vFirstName = normalizeText(v.first_name);
          const vLastName = normalizeText(v.last_name);
          return vFirstName.includes(normalizedSearch) || vLastName.includes(normalizedSearch);
        });

        return mainMatch || vehicleMatch;
      });
      setFilteredVisitors(filtered);
    } else {
      setFilteredVisitors(visitors);
    }
  }, [visitors, searchTerm]);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      const allVisitors = await Visitor.list('-created_date', 1000);
      const insideVisitors = allVisitors.filter(visitor =>
        !visitor.exit_time || visitor.exit_time === '' || visitor.exit_time === null
      );
      setVisitors(insideVisitors);
      // Seçili olanları güncelle — artık içeride olmayanları çıkar
      setSelectedIds(prev => {
        const insideIdSet = new Set(insideVisitors.map(v => v.id));
        const next = new Set([...prev].filter(id => insideIdSet.has(id)));
        return next;
      });
    } catch (error) {
      console.error("Veri yüklenemedi:", error);
    }
  };

  const canPerformAction = (visitor) => {
    if (!currentUser || !visitor) {
      return { canEdit: false, canDelete: false, canAddExit: false };
    }

    const userDisplayRole = currentUser.role === 'admin' ? 'admin' : currentUser.vip_level;

    if (userDisplayRole === 'admin') {
      return { canEdit: true, canDelete: true, canAddExit: true };
    }

    const fullName = `${currentUser.first_name} ${currentUser.last_name}`;
    const isOwner =
      (visitor.registered_by_id && currentUser.id && String(visitor.registered_by_id) === String(currentUser.id)) ||
      (visitor.registered_by && visitor.registered_by === fullName);

    if (userDisplayRole === 'vip-3') {
      return { canEdit: true, canDelete: true, canAddExit: true };
    }

    if (['vip-2', 'vip-1'].includes(userDisplayRole)) {
      if (isOwner) {
        return { canEdit: true, canDelete: true, canAddExit: true };
      }
      return { canEdit: false, canDelete: false, canAddExit: true };
    }

    return { canEdit: false, canDelete: false, canAddExit: false };
  };

  const handleEdit = (visitor) => {
    setEditingVisitor({
      ...visitor,
      description: visitor.description || '',
      visit_date: visitor.visit_date || format(new Date(), 'yyyy-MM-dd'),
      entry_time: visitor.entry_time || format(new Date(), 'HH:mm'),
      exit_time: visitor.exit_time || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const { id, ...updateData } = editingVisitor;
      updateData.first_name = updateData.first_name.toUpperCase();
      updateData.last_name = updateData.last_name.toUpperCase();
      updateData.company = updateData.company ? updateData.company.toUpperCase() : '';
      updateData.plate = updateData.plate ? updateData.plate.toUpperCase() : '';

      await Visitor.update(id, updateData);
      await Log.create({
        action: "GÜNCELLEME",
        details: `${editingVisitor.first_name} ${editingVisitor.last_name} adlı ziyaretçinin kaydı güncellendi (İçeridekiler).`,
        user_name: `${currentUser.first_name} ${currentUser.last_name}`
      });
      setIsEditDialogOpen(false);
      setEditingVisitor(null);
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
          details: `${visitor.first_name} ${visitor.last_name} adlı ziyaretçi silindi (İçeridekiler).`,
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
        details: `${visitorName} adlı ziyaretçiye çıkış saati eklendi (İçeridekiler).`,
        user_name: `${currentUser.first_name} ${currentUser.last_name}`
      });
      loadData();
    } catch (error) {
      console.error("Çıkış saati eklenemedi:", error);
    }
  };

  // Toplu çıkış — tek GitHub yazması (hızlı)
  const handleBulkExit = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`${selectedIds.size} ziyaretçi için toplu çıkış yapılsın mı?`)) return;

    setBulkExiting(true);
    try {
      const currentTime = format(new Date(), 'HH:mm');
      const { content: allItems, sha } = await ghGet('data/visitors.json');

      if (!Array.isArray(allItems)) throw new Error('visitors.json okunamadı');

      const updatedNames = [];
      const updated = allItems.map(item => {
        if (selectedIds.has(item.id) && (!item.exit_time || item.exit_time === '')) {
          updatedNames.push(`${item.first_name} ${item.last_name}`);
          return { ...item, exit_time: currentTime };
        }
        return item;
      });

      await ghPut('data/visitors.json', updated, sha, `data: toplu çıkış ${updatedNames.length} ziyaretçi`);

      await Log.create({
        action: "TOPLU ÇIKIŞ",
        details: `${updatedNames.join(', ')} adlı ${updatedNames.length} ziyaretçi toplu çıkış yaptı.`,
        user_name: `${currentUser.first_name} ${currentUser.last_name}`
      });

      setSelectedIds(new Set());
      await loadData();
    } catch (error) {
      console.error("Toplu çıkış hatası:", error);
      alert("Toplu çıkış sırasında hata oluştu: " + error.message);
    } finally {
      setBulkExiting(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const exitableIds = filteredVisitors
      .filter(v => canPerformAction(v).canAddExit)
      .map(v => v.id);
    setSelectedIds(new Set(exitableIds));
  };

  const clearSelection = () => setSelectedIds(new Set());

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

  const getTotalVisitorCount = (visitorList) => {
    return visitorList.reduce((total, visitor) => {
      return total + 1 + (visitor.vehicle_visitors?.length || 0);
    }, 0);
  };

  const normalizeText = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/ş/g, 's')
      .replace(/Ş/g, 's')
      .replace(/ğ/g, 'g')
      .replace(/Ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/Ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/Ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'c')
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'i')
      .replace(/I/g, 'i');
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const getInsideDuration = (entryTime, entryDate) => {
    if (!entryTime) return '';
    const now = new Date();
    const datePart = entryDate || format(new Date(), 'yyyy-MM-dd');
    const entryDateTime = new Date(`${datePart}T${entryTime}`);

    if (isNaN(entryDateTime.getTime())) return '';

    const diffMinutes = Math.floor((now - entryDateTime) / (1000 * 60));

    if (diffMinutes < 0) return '0 dk';
    if (diffMinutes < 60) return `${diffMinutes} dk`;

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}s ${minutes}dk`;
  };

  const getVisitTypeColor = (visitType) => {
    switch (visitType) {
      case 'sevkiyat': return 'bg-blue-600 text-white';
      case 'calisma': return 'bg-green-600 text-white';
      case 'gorusme': return 'bg-purple-600 text-white';
      case 'servis': return 'bg-yellow-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const totalInsideCount = getTotalVisitorCount(visitors);
  const exitableCount = filteredVisitors.filter(v => canPerformAction(v).canAddExit).length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h1 className="text-3xl font-bold text-amber-400">İçerideki Ziyaretçiler ({totalInsideCount})</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-600" />
            <Input
              type="text"
              placeholder="Ad, firma, plaka ara..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-gray-800 border-amber-600 text-amber-400 placeholder-amber-600"
            />
          </div>
          <Button onClick={loadData} className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-bold border-2 border-yellow-300">
            <RefreshCw className="w-4 h-4 mr-2" />
            Yenile
          </Button>
        </div>
      </div>

      {/* Toplu işlem araç çubuğu */}
      {exitableCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-gray-800/80 border border-amber-600/40 rounded-lg">
          <Button
            onClick={selectAll}
            size="sm"
            variant="outline"
            className="border-amber-600 text-amber-400 hover:bg-amber-600/20 text-xs"
          >
            <CheckSquare className="w-3.5 h-3.5 mr-1" />
            Tümünü Seç ({exitableCount})
          </Button>
          {selectedIds.size > 0 && (
            <>
              <Button
                onClick={clearSelection}
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-400 hover:bg-gray-700 text-xs"
              >
                <Square className="w-3.5 h-3.5 mr-1" />
                Seçimi Temizle
              </Button>
              <Button
                onClick={handleBulkExit}
                disabled={bulkExiting}
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-xs border border-orange-400"
              >
                <Zap className="w-3.5 h-3.5 mr-1" />
                {bulkExiting ? 'Çıkış Yapılıyor...' : `Toplu Çıkış Yap (${selectedIds.size})`}
              </Button>
            </>
          )}
          {selectedIds.size > 0 && (
            <span className="text-amber-600 text-xs ml-1">{selectedIds.size} ziyaretçi seçildi</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto pr-2">
        <AnimatePresence>
          {filteredVisitors.map((visitor) => {
            const permissions = canPerformAction(visitor);
            const canPerformAnyAction = permissions.canAddExit || permissions.canEdit || permissions.canDelete;
            const isSelected = selectedIds.has(visitor.id);

            return (
              <motion.div
                key={visitor.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className={`bg-gradient-to-r from-gray-800/90 to-gray-700/90 backdrop-blur-sm rounded-lg p-4 border transition-all duration-300 shadow-sm hover:shadow-lg ${
                  isSelected
                    ? 'border-orange-500 ring-2 ring-orange-500/40'
                    : 'border-amber-600/30 hover:border-amber-600/60'
                }`}
              >
                <div className="space-y-3">
                  {/* Header with checkbox, Avatar and Main Info */}
                  <div className="flex items-center space-x-3">
                    {permissions.canAddExit && (
                      <div
                        className="flex-shrink-0 cursor-pointer"
                        onClick={() => toggleSelect(visitor.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(visitor.id)}
                          className="border-amber-600 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                      </div>
                    )}
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                      {visitor.first_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-lg text-amber-400 truncate">
                          {visitor.first_name} {visitor.last_name}
                        </h3>
                        <div className="flex items-center space-x-1">
                          {visitor.vehicle_visitors?.length > 0 && (
                            <Badge variant="outline" className="text-xs border-amber-600 text-amber-400 bg-amber-600/10">
                              +{visitor.vehicle_visitors.length}
                            </Badge>
                          )}
                          <Badge className={`text-xs px-2 py-1 ${getVisitTypeColor(visitor.visit_type)}`}>
                            {visitor.visit_type?.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Company and Plate Info */}
                  {(visitor.company || visitor.plate) && (
                    <div className="flex items-center space-x-4 text-sm text-amber-600">
                      {visitor.company && (
                        <div className="flex items-center space-x-1">
                          <Building2 className="w-4 h-4" />
                          <span className="truncate">{visitor.company}</span>
                        </div>
                      )}
                      {visitor.plate && (
                        <div className="flex items-center space-x-1">
                          <Car className="w-4 h-4" />
                          <span>{visitor.plate}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Time Information */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1 text-amber-600">
                        <Clock className="w-4 h-4" />
                        <span>Giriş: {visitor.entry_time}</span>
                      </div>
                      <div className="font-bold text-orange-400 text-sm">
                        İçeride: {getInsideDuration(visitor.entry_time, visitor.visit_date)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 text-xs text-amber-600">
                      <UserIcon className="w-3 h-3" />
                      <span>Kayıt: {visitor.registered_by}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {visitor.description && (
                    <div className="bg-amber-600/10 rounded-md p-2 border border-amber-600/30">
                      <div className="flex items-start space-x-1">
                        <MessageCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-400" />
                        <p className="text-xs text-amber-300 italic">
                          "{visitor.description}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Vehicle Visitors */}
                  {visitor.vehicle_visitors?.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-amber-600" />
                        <span className="text-xs text-amber-600 font-medium">Araçtakiler:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {visitor.vehicle_visitors.map((v, i) => (
                          <div key={i} className="text-xs text-amber-400 bg-gray-800 px-2 py-1 rounded border border-amber-600 flex items-center space-x-1">
                            <UserIcon className="w-3 h-3" />
                            <span>{v.first_name} {v.last_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {canPerformAnyAction && (
                    <div className="border-t border-gray-600 pt-3 mt-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {permissions.canAddExit && (
                            <Button
                                onClick={() => addExitTime(visitor.id, `${visitor.first_name} ${visitor.last_name}`)}
                                size="sm"
                                className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-bold border-2 border-yellow-300 text-xs px-2 py-1"
                            >
                                <LogOut className="w-3 h-3 mr-1" />
                                Çıkış Yap
                            </Button>
                        )}
                        <Button
                          onClick={() => createQuickRecord(visitor)}
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-3 py-2 text-xs"
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Yeni Kayıt
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {permissions.canEdit && (
                            <Button
                                onClick={() => handleEdit(visitor)}
                                size="sm"
                                className="flex-1 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-bold px-3 py-2 text-xs"
                            >
                                <Edit className="w-3 h-3 mr-1" />
                                Düzenle
                            </Button>
                        )}
                        {permissions.canDelete && (
                            <Button
                                onClick={() => handleDelete(visitor)}
                                size="sm"
                                className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-3 py-2 text-xs"
                            >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Sil
                            </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredVisitors.length === 0 && (
          <div className="col-span-full text-center py-20 text-amber-600">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">
              {searchTerm ? 'Arama sonucu bulunamadı.' : 'Şu anda içeride ziyaretçi bulunmuyor.'}
            </p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-amber-600 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-amber-400">Ziyaretçi Kaydını Düzenle</DialogTitle>
          </DialogHeader>
          {editingVisitor && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="text-amber-400">Ad *</Label>
                  <Input
                    id="first_name"
                    value={editingVisitor.first_name}
                    onChange={(e) => setEditingVisitor(prev => ({...prev, first_name: e.target.value.toUpperCase()}))}
                    className="bg-gray-800 border-amber-600 text-amber-400"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-amber-400">Soyad *</Label>
                  <Input
                    id="last_name"
                    value={editingVisitor.last_name}
                    onChange={(e) => setEditingVisitor(prev => ({...prev, last_name: e.target.value.toUpperCase()}))}
                    className="bg-gray-800 border-amber-600 text-amber-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="visit_date" className="text-amber-400">Tarih</Label>
                  <Input
                    id="visit_date"
                    type="date"
                    value={editingVisitor.visit_date}
                    onChange={(e) => setEditingVisitor(prev => ({...prev, visit_date: e.target.value}))}
                    className="bg-gray-800 border-amber-600 text-amber-400"
                  />
                </div>
                <div>
                  <Label htmlFor="entry_time" className="text-amber-400">Giriş Saati</Label>
                  <Input
                    id="entry_time"
                    type="time"
                    value={editingVisitor.entry_time}
                    onChange={(e) => setEditingVisitor(prev => ({...prev, entry_time: e.target.value}))}
                    className="bg-gray-800 border-amber-600 text-amber-400"
                  />
                </div>
                <div>
                  <Label htmlFor="exit_time" className="text-amber-400">Çıkış Saati</Label>
                  <Input
                    id="exit_time"
                    type="time"
                    value={editingVisitor.exit_time}
                    onChange={(e) => setEditingVisitor(prev => ({...prev, exit_time: e.target.value}))}
                    className="bg-gray-800 border-amber-600 text-amber-400"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="visit_type" className="text-amber-400">Ziyaret Türü</Label>
                <Select
                  value={editingVisitor.visit_type}
                  onValueChange={(value) => setEditingVisitor(prev => ({...prev, visit_type: value}))}
                >
                  <SelectTrigger id="visit_type" className="bg-gray-800 border-amber-600 text-amber-400">
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
                <Label htmlFor="description" className="text-amber-400">Açıklama</Label>
                <Textarea
                  id="description"
                  value={editingVisitor.description}
                  onChange={(e) => setEditingVisitor(prev => ({...prev, description: e.target.value}))}
                  className="bg-gray-800 border-amber-600 text-amber-400"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-black">
                  İptal
                </Button>
                <Button onClick={handleSaveEdit} className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-bold">
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
