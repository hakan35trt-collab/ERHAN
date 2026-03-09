import React, { useState, useEffect } from "react";
import { Visitor } from "@/entities/Visitor";
import { Staff } from "@/entities/Staff"; // Added Staff import
import { User } from "@/entities/User";
import { Log } from "@/entities/Log";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Edit, 
  Trash2, 
  LogOut, 
  Download,
  Calendar,
  Building2,
  Users,
  Clock,
  Car, // Added Car icon
  Phone, // Added Phone icon
  Briefcase, // Added Briefcase icon
  UserPlus // Added UserPlus icon for quick re-registration
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { // Added Tabs imports
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function VisitorSearch() {
  const [visitors, setVisitors] = useState([]);
  const [staff, setStaff] = useState([]); // Added staff state
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]); // Added filteredStaff state
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('all'); // Tarih filtresi
  const [vehicleFilter, setVehicleFilter] = useState('all'); // Araç filtresi

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const searchLower = searchTerm.toLowerCase();
    const today = format(new Date(), 'yyyy-MM-dd');

    // Filter visitors
    let filtered = visitors.filter(visitor => {
      // Arama filtresi
      const matchesSearch = searchTerm.trim() === '' || (
        visitor.first_name?.toLowerCase().includes(searchLower) ||
        visitor.last_name?.toLowerCase().includes(searchLower) ||
        visitor.company?.toLowerCase().includes(searchLower) ||
        visitor.plate?.toLowerCase().includes(searchLower) ||
        visitor.registered_by?.toLowerCase().includes(searchLower) ||
        visitor.vehicle_visitors?.some(v => 
          v.first_name?.toLowerCase().includes(searchLower) ||
          v.last_name?.toLowerCase().includes(searchLower)
        )
      );

      // Tarih filtresi
      const matchesDate = dateFilter === 'all' || 
        (dateFilter === 'today' && visitor.visit_date === today);

      // Araç filtresi
      const matchesVehicle = vehicleFilter === 'all' ||
        (vehicleFilter === 'with' && visitor.description?.includes('Araçla içeri girdi')) ||
        (vehicleFilter === 'without' && visitor.description?.includes('Araç dışarıda bırakıldı'));

      return matchesSearch && matchesDate && matchesVehicle;
    });
    
    // Filter staff
    const filteredStaffData = staff.filter(person => {
      return searchTerm.trim() === '' || (
        person.first_name?.toLowerCase().includes(searchLower) ||
        person.last_name?.toLowerCase().includes(searchLower) ||
        person.position?.toLowerCase().includes(searchLower) ||
        person.plate?.toLowerCase().includes(searchLower) ||
        person.phone_number?.toLowerCase().includes(searchLower)
      );
    });
    
    setFilteredVisitors(filtered);
    setFilteredStaff(filteredStaffData);
  }, [searchTerm, visitors, staff, dateFilter, vehicleFilter]);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const visitorData = await Visitor.list('-created_date', 1000);
      setVisitors(visitorData);
      setFilteredVisitors(visitorData);
      
      const staffData = await Staff.list('-created_date'); // Load staff data
      setStaff(staffData);
      setFilteredStaff(staffData); // Initialize filteredStaff
    } catch (error) {
      console.error("Veri yüklenemedi:", error);
    }
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
      visit_date: visitor.visit_date || format(new Date(), 'yyyy-MM-dd'),
      entry_time: visitor.entry_time || format(new Date(), 'HH:mm')
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const { id, ...updateData } = editingVisitor;
      await Visitor.update(id, updateData);
      
      await Log.create({
        action: "GÜNCELLEME",
        details: `${editingVisitor.first_name} ${editingVisitor.last_name} adlı ziyaretçinin kaydı güncellendi.`,
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

  const downloadExcel = async () => {
    const today = new Date();
    const csvData = filteredVisitors.map(visitor => {
      const allVisitors = [
        { first_name: visitor.first_name, last_name: visitor.last_name },
        ...(visitor.vehicle_visitors || [])
      ];
      
      return allVisitors.map(v => ({
        'Ad': v.first_name,
        'Soyad': v.last_name,
        'Firma': visitor.company || '',
        'Plaka': visitor.plate || '',
        'Tarih': visitor.visit_date,
        'Giriş Saati': visitor.entry_time || '',
        'Çıkış Saati': visitor.exit_time || '',
        'Ziyaret Türü': visitor.visit_type,
        'Açıklama': visitor.description || '',
        'Kayıt Yapan': visitor.registered_by || '',
        'Kayıt Tarihi': format(new Date(visitor.created_date), 'dd.MM.yyyy HH:mm')
      }));
    }).flat();

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `arama-sonuclari-${format(today, 'dd-MM-yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTotalVisitorCount = () => {
    return filteredVisitors.reduce((total, visitor) => {
      return total + 1 + (visitor.vehicle_visitors?.length || 0);
    }, 0);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            Kapsamlı Arama
          </h1>
          <p className="text-lg text-yellow-600 mt-2">
            Ziyaretçiler ve personel kayıtlarında arama yapın
          </p>
        </div>
        <Button
          onClick={downloadExcel}
          className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-bold border-2 border-yellow-300 flex items-center space-x-2"
          disabled={filteredVisitors.length === 0}
        >
          <Download className="w-4 h-4" />
          <span>Sonuçları İndir</span>
        </Button>
      </div>

      {/* Arama ve İstatistikler */}
      <Card className="mb-8 bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600 border-2">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-yellow-400">
            <Search className="w-5 h-5" />
            <span>Arama Filtresi</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-yellow-400">Ad, Soyad, Firma, Plaka, Telefon ile arama yapın</Label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Arama terimi girin..."
                className="mt-1 bg-gray-900 border-yellow-600 text-yellow-400 placeholder-yellow-600"
              />
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Label className="text-yellow-400">Tarih:</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-32 bg-gray-900 border-yellow-600 text-yellow-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-yellow-600">
                    <SelectItem value="all" className="text-yellow-400">Tümü</SelectItem>
                    <SelectItem value="today" className="text-yellow-400">Bugün</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Label className="text-yellow-400">Araç:</Label>
                <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                  <SelectTrigger className="w-32 bg-gray-900 border-yellow-600 text-yellow-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-yellow-600">
                    <SelectItem value="all" className="text-yellow-400">Tümü</SelectItem>
                    <SelectItem value="with" className="text-yellow-400">Araçlı</SelectItem>
                    <SelectItem value="without" className="text-yellow-400">Araçsız</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-4 text-sm text-yellow-400 ml-auto">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{filteredVisitors.length} ziyaretçi</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4" />
                  <span>{filteredStaff.length} personel</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sonuçlar - Tabs */}
      <Tabs defaultValue="visitors" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800 border border-yellow-600">
          <TabsTrigger value="visitors" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-black">
            Ziyaretçiler ({filteredVisitors.length})
          </TabsTrigger>
          <TabsTrigger value="staff" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-black">
            Personel ({filteredStaff.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="visitors">
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600 border-2">
            <CardHeader>
              <CardTitle className="text-yellow-400">Ziyaretçi Kayıtları</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <AnimatePresence>
                  {filteredVisitors.map((visitor) => {
                    const permissions = canPerformAction(visitor);
                    const canPerformAnyAction = permissions.canAddExit || permissions.canEdit || permissions.canDelete;

                    return (
                      <motion.div
                        key={visitor.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-all duration-200 border border-yellow-600"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-700 rounded-full flex items-center justify-center text-black font-bold text-lg">
                              {visitor.first_name?.charAt(0)}
                            </div>
                            <div className="flex-1">
                               <div className="font-semibold text-lg text-yellow-400 mb-1">
                                {visitor.first_name} {visitor.last_name}
                                {visitor.vehicle_visitors?.length > 0 && (
                                  <Badge variant="outline" className="ml-2 text-xs border-yellow-600 text-yellow-400">+{visitor.vehicle_visitors.length}</Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm text-yellow-600">
                                {visitor.company && (
                                  <div className="flex items-center space-x-1">
                                    <Building2 className="w-4 h-4" />
                                    <span>{visitor.company}</span>
                                  </div>
                                )}
                                {visitor.plate && (
                                 <div className="flex items-center space-x-1">
                                   <Car className="w-4 h-4" />
                                   <span>{visitor.plate}</span>
                                 </div>
                                )}
                                <div className="flex items-center space-x-1">
                                 <Calendar className="w-4 h-4" />
                                 <span>{visitor.visit_date}</span>
                                </div>
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
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{visitor.entry_time || 'N/A'} - {visitor.exit_time || 'İçeride'}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <Badge 
                              className={
                                visitor.visit_type === 'sevkiyat' ? 'bg-blue-600 text-white' :
                                visitor.visit_type === 'calisma' ? 'bg-green-600 text-white' :
                                visitor.visit_type === 'servis' ? 'bg-teal-600 text-white' :
                                'bg-purple-600 text-white'
                              }
                            >
                              {visitor.visit_type?.toUpperCase()}
                            </Badge>
                            {!visitor.exit_time ? (
                              <Badge variant="outline" className="bg-orange-700 text-orange-200 border-orange-600">
                                İçeride
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-600 text-gray-200 border-gray-500">
                                Çıkış Yaptı
                              </Badge>
                            )}
                          </div>

                          {visitor.vehicle_visitors?.length > 0 && (
                            <div className="pt-2 border-t border-yellow-700">
                              <div className="text-sm text-yellow-600 mb-2">Araçtaki diğer kişiler:</div>
                              <div className="grid grid-cols-2 gap-1">
                                {visitor.vehicle_visitors.map((v, i) => (
                                  <div key={i} className="text-sm bg-gray-800 px-2 py-1 rounded border border-yellow-600 text-yellow-400">
                                    {v.first_name} {v.last_name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {visitor.description && (
                            <div className="pt-2 border-t border-gray-600">
                              <div className="text-sm text-yellow-600 mb-1">Açıklama:</div>
                              <p className="text-sm text-yellow-300 bg-yellow-600/10 px-2 py-1 rounded italic">
                                "{visitor.description}"
                              </p>
                            </div>
                          )}

                          <div className="text-xs text-yellow-500 pt-2 border-t border-gray-600">
                            Kayıt yapan: {visitor.registered_by} • {format(new Date(visitor.created_date), 'dd.MM.yyyy HH:mm')}
                          </div>

                          {/* Action buttons inside the card */}
                          {canPerformAnyAction && (
                            <div className="flex items-center space-x-2 pt-2">
                              {!visitor.exit_time && permissions.canAddExit && (
                                <Button onClick={() => addExitTime(visitor.id, `${visitor.first_name} ${visitor.last_name}`)} size="sm" className="text-xs bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white">
                                  <LogOut className="w-3 h-3 mr-1" />Çıkış
                                </Button>
                              )}
                              <Button onClick={() => createQuickRecord(visitor)} size="sm" className="text-xs bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white">
                                <UserPlus className="w-3 h-3 mr-1" />Yeni Kayıt
                              </Button>
                              {permissions.canEdit && (
                                <Button
                                  onClick={() => handleEdit(visitor)}
                                  size="sm"
                                  className="h-7 px-2 text-xs bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-bold border-2 border-yellow-300"
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Düzenle
                                </Button>
                              )}
                              {permissions.canDelete && (
                                <Button onClick={() => handleDelete(visitor)} size="sm" className="text-xs bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white">
                                  <Trash2 className="w-3 h-3 mr-1" />Sil
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredVisitors.length === 0 && (
                  <div className="text-center py-12 text-yellow-600">
                    {searchTerm ? "Arama kriterinize uygun ziyaretçi bulunamadı." : "Henüz ziyaretçi kaydı bulunmuyor."}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600 border-2">
            <CardHeader>
              <CardTitle className="text-yellow-400">Personel Kayıtları</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <AnimatePresence>
                  {filteredStaff.map((person) => (
                    <motion.div
                      key={person.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-all duration-200 border border-yellow-600"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-700 rounded-full flex items-center justify-center text-black font-bold text-lg">
                          {person.first_name?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-lg text-yellow-400 mb-1">
                            {person.first_name} {person.last_name}
                          </div>
                          <div className="text-sm text-yellow-600 mb-2">
                            <Badge className="bg-blue-600 text-white mr-2">{person.position}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-yellow-600">
                            {person.phone_number && (
                              <div className="flex items-center space-x-1">
                                <Phone className="w-4 h-4" />
                                <span>{person.phone_number}</span>
                              </div>
                            )}
                            {person.plate && (
                              <div className="flex items-center space-x-1">
                                <Car className="w-4 h-4" />
                                <span>{person.plate}</span>
                              </div>
                            )}
                          </div>
                          {person.description && (
                            <div className="mt-2">
                              <p className="text-sm text-yellow-300 bg-yellow-600/10 px-2 py-1 rounded italic">
                                "{person.description}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredStaff.length === 0 && (
                  <div className="text-center py-12 text-yellow-600">
                    {searchTerm ? "Arama kriterinize uygun personel bulunamadı." : "Henüz personel kaydı bulunmuyor."}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-yellow-600">
          <DialogHeader>
            <DialogTitle className="text-yellow-400">Ziyaretçi Kaydını Düzenle</DialogTitle>
          </DialogHeader>
          {editingVisitor && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-yellow-400">Ad</Label><Input value={editingVisitor.first_name} onChange={(e) => setEditingVisitor(prev => ({...prev, first_name: e.target.value.toUpperCase()}))} className="bg-gray-800 border-yellow-600 text-yellow-400"/></div>
                <div><Label className="text-yellow-400">Soyad</Label><Input value={editingVisitor.last_name} onChange={(e) => setEditingVisitor(prev => ({...prev, last_name: e.target.value.toUpperCase()}))} className="bg-gray-800 border-yellow-600 text-yellow-400"/></div>
              </div>

               <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-yellow-400">Firma</Label><Input value={editingVisitor.company || ''} onChange={(e) => setEditingVisitor(prev => ({...prev, company: e.target.value.toUpperCase()}))} className="bg-gray-800 border-yellow-600 text-yellow-400"/></div>
                <div><Label className="text-yellow-400">Plaka</Label><Input value={editingVisitor.plate || ''} onChange={(e) => setEditingVisitor(prev => ({...prev, plate: e.target.value}))} className="bg-gray-800 border-yellow-600 text-yellow-400"/></div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div><Label className="text-yellow-400">Tarih</Label><Input type="date" value={editingVisitor.visit_date} onChange={(e) => setEditingVisitor(prev => ({...prev, visit_date: e.target.value}))} className="bg-gray-800 border-yellow-600 text-yellow-400"/></div>
                <div><Label className="text-yellow-400">Giriş Saati</Label><Input type="time" value={editingVisitor.entry_time} onChange={(e) => setEditingVisitor(prev => ({...prev, entry_time: e.target.value}))} className="bg-gray-800 border-yellow-600 text-yellow-400"/></div>
                <div><Label className="text-yellow-400">Çıkış Saati</Label><Input type="time" value={editingVisitor.exit_time || ''} onChange={(e) => setEditingVisitor(prev => ({...prev, exit_time: e.target.value}))} className="bg-gray-800 border-yellow-600 text-yellow-400"/></div>
              </div>

              <div>
                <Label className="text-yellow-400">Ziyaret Türü</Label>
                <Select 
                  value={editingVisitor.visit_type} 
                  onValueChange={(value) => setEditingVisitor(prev => ({...prev, visit_type: value}))}
                >
                  <SelectTrigger className="bg-gray-800 border-yellow-600 text-yellow-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-yellow-600">
                    <SelectItem value="sevkiyat" className="text-yellow-400">Sevkiyat</SelectItem>
                    <SelectItem value="calisma" className="text-yellow-400">Çalışma</SelectItem>
                    <SelectItem value="gorusme" className="text-yellow-400">Görüşme</SelectItem>
                    <SelectItem value="servis" className="text-yellow-400">Servis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-yellow-400">Açıklama</Label>
                <Textarea
                  value={editingVisitor.description || ''}
                  onChange={(e) => setEditingVisitor(prev => ({...prev, description: e.target.value.toUpperCase()}))}
                  className="bg-gray-800 border-yellow-600 text-yellow-400"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-black">
                  İptal
                </Button>
                <Button onClick={handleSaveEdit} className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold">
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