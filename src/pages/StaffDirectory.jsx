
import React, { useState, useEffect } from "react";
import { Staff } from "@/entities/Staff";
import { User } from "@/entities/User";
import { Log } from "@/entities/Log";
import { DirectoryConfig } from "@/entities/DirectoryConfig";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Briefcase, UserPlus, Edit, Trash2, Search, Phone, Car, Shield, MessageCircle, Download, Settings, Plus, X, FolderPlus, Move, User as UserIcon, MapPin } from "lucide-react";

const StaffCard = ({ staff, onEdit, onDelete, canEdit, index }) => (
    <Draggable draggableId={staff.id} index={index} isDragDisabled={!canEdit}>
        {(provided, snapshot) => (
            <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={`${snapshot.isDragging ? 'rotate-3 scale-105 z-50' : ''} transition-transform duration-200`}
            >
                <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card className="bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border border-yellow-600/40 hover:border-yellow-500/70 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-600/20 relative group overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600"></div>
                        
                        <CardContent className="p-4 relative">
                            {/* Header - Avatar and Name */}
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="relative">
                                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 via-yellow-600 to-amber-700 rounded-full flex items-center justify-center text-gray-900 font-bold text-lg shadow-lg border-2 border-yellow-400/50">
                                        {staff.first_name.charAt(0)}{staff.last_name.charAt(0)}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                                        <UserIcon className="w-2 h-2 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-yellow-400 font-bold text-base leading-tight truncate" title={`${staff.first_name} ${staff.last_name}`}>
                                        {staff.first_name} {staff.last_name}
                                    </h3>
                                    <p className="text-yellow-600 text-sm font-medium truncate flex items-center" title={staff.position}>
                                        <Briefcase className="w-3 h-3 mr-1 flex-shrink-0" />
                                        {staff.position}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Contact Information */}
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-700/50 border border-yellow-600/20">
                                    <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                                        <Phone className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-yellow-600 font-medium">Telefon</p>
                                        <p className="text-sm text-yellow-300 truncate">{staff.phone_number || 'Bilgi yok'}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-700/50 border border-yellow-600/20">
                                    <div className="w-8 h-8 bg-green-600/20 rounded-full flex items-center justify-center">
                                        <Car className="w-4 h-4 text-green-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-yellow-600 font-medium">Araç Plakası</p>
                                        <p className="text-sm text-yellow-300 truncate">{staff.plate || 'Kayıt yok'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {staff.description && (
                                <div className="mb-4 p-2 rounded-lg bg-gray-700/30 border border-yellow-600/20">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <MessageCircle className="w-3 h-3 text-yellow-600" />
                                        <p className="text-xs text-yellow-600 font-medium">Açıklama</p>
                                    </div>
                                    <p className="text-xs text-yellow-400/90 line-clamp-2" title={staff.description}>
                                        {staff.description}
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {canEdit && (
                                <div className="flex space-x-2 pt-3 border-t border-yellow-600/20">
                                    <Button 
                                        size="sm" 
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-200 shadow-md hover:shadow-lg"
                                        onClick={() => onEdit(staff)}
                                    >
                                        <Edit className="w-3 h-3 mr-1" />
                                        Düzenle
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white transition-all duration-200 shadow-md hover:shadow-lg"
                                        onClick={() => onDelete(staff.id, `${staff.first_name} ${staff.last_name}`)}
                                    >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Sil
                                    </Button>
                                </div>
                            )}

                            {/* Drag Handle Indicator */}
                            {canEdit && (
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity duration-200">
                                    <Move className="w-4 h-4 text-yellow-500" />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        )}
    </Draggable>
);

export default function StaffDirectory() {
    const [staffList, setStaffList] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
    const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [directoryConfig, setDirectoryConfig] = useState({ id: null, company_title: 'ŞİRKET', project_title: 'PROJE' });
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState('company');
    const [customCategoryType, setCustomCategoryType] = useState('');
    const [isCustomType, setIsCustomType] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const user = await User.me();
            setCurrentUser(user);
            
            const staffData = await Staff.list('-created_date');
            setStaffList(staffData);
            
            const configData = await DirectoryConfig.list();
            if (configData.length > 0) {
                setDirectoryConfig(configData[0]);
            } else {
                const newConfig = await DirectoryConfig.create({ company_title: 'ŞİRKET', project_title: 'PROJE' });
                setDirectoryConfig(newConfig);
            }
        } catch (error) {
            console.error("Veri yüklenemedi:", error);
        }
        setLoading(false);
    };
    
    const hasAccess = (permissionLevel) => {
        if (!currentUser) return false;
        const userDisplayRole = currentUser.role === 'admin' ? 'admin' : currentUser.vip_level;
        if (permissionLevel === 'view') return ['admin', 'vip-3', 'vip-2', 'vip-1'].includes(userDisplayRole);
        if (permissionLevel === 'edit') return ['admin', 'vip-3'].includes(userDisplayRole);
        if (permissionLevel === 'config') return ['admin'].includes(userDisplayRole);
        return false;
    };

    const handleOpenStaffDialog = (staff = null) => {
        setEditingStaff(staff ? { ...staff } : { 
            first_name: '', last_name: '', position: '', phone_number: '', plate: '', description: '',
            type: 'company', category: ''
        });
        setIsStaffDialogOpen(true);
    };

    const handleSaveStaff = async () => {
        if (!editingStaff.first_name || !editingStaff.last_name || !editingStaff.position || !editingStaff.category) {
            alert("Lütfen ad, soyad, görev ve kategori alanlarını doldurun.");
            return;
        }

        const action = editingStaff.id ? "GÜNCELLEME" : "OLUŞTURMA";
        const details = `${editingStaff.first_name} ${editingStaff.last_name} adlı personel kaydı ${action === "GÜNCELLEME" ? "güncellendi" : "oluşturuldu"}.`;

        try {
            if (editingStaff.id) await Staff.update(editingStaff.id, editingStaff);
            else await Staff.create(editingStaff);

            await Log.create({ action, details, user_name: `${currentUser.first_name} ${currentUser.last_name}` });
            
            setIsStaffDialogOpen(false);
            setEditingStaff(null);
            loadData();
        } catch (error) { console.error("Personel kaydı hatası:", error); }
    };

    const handleDeleteStaff = async (staffId, staffName) => {
        if (window.confirm(`${staffName} adlı personeli silmek istediğinizden emin misiniz?`)) {
            try {
                await Staff.delete(staffId);
                await Log.create({ action: "SİLME", details: `${staffName} adlı personel silindi.`, user_name: `${currentUser.first_name} ${currentUser.last_name}` });
                loadData();
            } catch (error) { console.error("Silme hatası:", error); }
        }
    };

    const handleSaveConfig = async () => {
        try {
            await DirectoryConfig.update(directoryConfig.id, { 
                company_title: directoryConfig.company_title, 
                project_title: directoryConfig.project_title 
            });
            setIsConfigDialogOpen(false);
            loadData();
        } catch (error) { console.error("Başlık güncelleme hatası:", error); }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            alert("Kategori adı boş olamaz.");
            return;
        }
        
        const finalCategoryType = isCustomType ? customCategoryType.toLowerCase().replace(/\s+/g, '_') : newCategoryType;
        
        if (isCustomType && !customCategoryType.trim()) {
            alert("Özel kategori türü boş olamaz.");
            return;
        }
        
        // Create a dummy staff member for this category to ensure it shows up
        try {
            await Staff.create({
                first_name: "DUMMY",
                last_name: "CATEGORY",
                position: "PLACEHOLDER",
                type: finalCategoryType,
                category: newCategoryName.toUpperCase(),
                phone_number: "",
                plate: "",
                description: "Bu kayıt kategori oluşturmak için geçicidir. Silebilirsiniz."
            });
            
            await Log.create({
                action: "YENİ KATEGORİ",
                details: `${newCategoryName.toUpperCase()} kategorisi ${finalCategoryType} türü için oluşturuldu.`,
                user_name: `${currentUser.first_name} ${currentUser.last_name}`
            });
            
            setNewCategoryName('');
            setCustomCategoryType('');
            setIsCustomType(false);
            setNewCategoryType('company');
            setIsCategoryDialogOpen(false);
            loadData();
        } catch (error) {
            console.error("Kategori ekleme hatası:", error);
            alert("Kategori eklenirken bir hata oluştu.");
        }
    };

    const handleDeleteCategory = async (categoryName, type) => {
        const categoryStaff = staffList.filter(s => s.category === categoryName && s.type === type);
        
        if (categoryStaff.length > 0) {
            const confirmMessage = `${categoryName} kategorisini silmek istediğinizden emin misiniz? Bu kategori altındaki ${categoryStaff.length} personel de silinecek.`;
            if (!window.confirm(confirmMessage)) return;
            
            try {
                for (const staff of categoryStaff) {
                    await Staff.delete(staff.id);
                }
                
                await Log.create({
                    action: "KATEGORİ SİLME",
                    details: `${categoryName} kategorisi ve ${categoryStaff.length} personel silindi.`,
                    user_name: `${currentUser.first_name} ${currentUser.last_name}`
                });
                
                loadData();
            } catch (error) {
                console.error("Kategori silme hatası:", error);
                alert("Kategori silinirken bir hata oluştu.");
            }
        }
    };

    const onDragEnd = async (result) => {
        if (!result.destination) return;
        
        const { source, destination, draggableId } = result;
        
        // If dropped in the same position, do nothing
        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }
        
        // Find the staff member being moved
        const staff = staffList.find(s => s.id === draggableId);
        if (!staff) return;
        
        // Extract new category and type from destination droppableId
        // Format: "company-CATEGORY_NAME" or "project-CATEGORY_NAME"
        const [newType, ...categoryParts] = destination.droppableId.split('-');
        const newCategory = categoryParts.join('-');
        
        try {
            await Staff.update(staff.id, {
                ...staff,
                type: newType,
                category: newCategory
            });
            
            await Log.create({
                action: "PERSONEL TAŞIMA",
                details: `${staff.first_name} ${staff.last_name} personeli ${newCategory} kategorisine taşındı.`,
                user_name: `${currentUser.first_name} ${currentUser.last_name}`
            });
            
            loadData();
        } catch (error) {
            console.error("Personel taşıma hatası:", error);
            alert("Personel taşınırken bir hata oluştu.");
        }
    };
    
    const downloadExcel = async (data, filename) => {
        if (data.length === 0) {
            alert("İndirilecek veri bulunmuyor.");
            return;
        }
        const csvData = data.map(staff => ({
            'Tür': staff.type === 'company' ? directoryConfig.company_title : directoryConfig.project_title,
            'Kategori': staff.category, 'Ad': staff.first_name, 'Soyad': staff.last_name, 'Görev': staff.position,
            'Telefon': staff.phone_number || '', 'Plaka': staff.plate || '', 'Açıklama': staff.description || ''
        }));
        const headers = Object.keys(csvData[0]);
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filterAndGroupStaff = (type) => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = staffList.filter(item =>
            item.type === type &&
            (item.first_name.toLowerCase().includes(lowercasedFilter) ||
             item.last_name.toLowerCase().includes(lowercasedFilter) ||
             item.position.toLowerCase().includes(lowercasedFilter) ||
             item.category.toLowerCase().includes(lowercasedFilter) ||
             (item.phone_number && item.phone_number.toLowerCase().includes(lowercasedFilter)) ||
             (item.plate && item.plate.toLowerCase().includes(lowercasedFilter)))
        );
        return filtered.reduce((acc, staff) => {
            const key = staff.category || 'Diğer';
            if (!acc[key]) acc[key] = [];
            acc[key].push(staff);
            return acc;
        }, {});
    };
    
    // Get unique types from existing staff
    const getAllStaffTypes = () => {
        const types = [...new Set(staffList.map(s => s.type))];
        return types.filter(type => type && type.trim() !== '');
    };
    
    const companyGroups = filterAndGroupStaff('company');
    const projectGroups = filterAndGroupStaff('project');
    const allStaffTypes = getAllStaffTypes();

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div></div>;
    if (!hasAccess('view')) return <div className="p-8 max-w-4xl mx-auto text-center"><Shield className="w-16 h-16 mx-auto text-red-500 mb-4" /><h2 className="text-2xl font-bold text-yellow-400">Yetki Yok</h2><p className="text-yellow-600">Bu sayfayı görüntüleme yetkiniz yok.</p></div>;

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">Personel Rehberi</h1>
                        <p className="text-lg text-yellow-600 mt-2">Şirket ve proje personelini yönetin.</p>
                    </div>
                    <div className="flex items-center space-x-2 flex-wrap gap-2">
                        <div className="relative"><Input type="text" placeholder="Personel ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-gray-800 border-yellow-600 text-yellow-400 pl-10" /><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-600" /></div>
                        <Button onClick={() => downloadExcel(Object.values(companyGroups).flat(), directoryConfig.company_title)} className="bg-green-600 hover:bg-green-700 text-white"><Download className="w-4 h-4 mr-2" />{directoryConfig.company_title}</Button>
                        <Button onClick={() => downloadExcel(Object.values(projectGroups).flat(), directoryConfig.project_title)} className="bg-blue-600 hover:bg-blue-700 text-white"><Download className="w-4 h-4 mr-2" />{directoryConfig.project_title}</Button>
                        {hasAccess('edit') && <Button onClick={() => handleOpenStaffDialog()} className="bg-yellow-500 hover:bg-yellow-600 text-black"><UserPlus className="w-4 h-4 mr-2" />Yeni Personel</Button>}
                        {hasAccess('edit') && <Button onClick={() => setIsCategoryDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white"><FolderPlus className="w-4 h-4 mr-2" />Kategori Ekle</Button>}
                        {hasAccess('config') && <Button onClick={() => setIsConfigDialogOpen(true)} variant="ghost" size="icon" className="text-yellow-400 hover:bg-gray-700"><Settings className="w-5 h-5" /></Button>}
                    </div>
                </div>

                <Tabs defaultValue="company" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-800 border border-yellow-600">
                        <TabsTrigger value="company">{directoryConfig.company_title}</TabsTrigger>
                        <TabsTrigger value="project">{directoryConfig.project_title}</TabsTrigger>
                    </TabsList>
                    
                    {/* Show tabs for all existing types */}
                    {allStaffTypes.length > 2 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {allStaffTypes.filter(type => type !== 'company' && type !== 'project').map(type => (
                                <Button
                                    key={type}
                                    variant="outline"
                                    size="sm"
                                    className="border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-black"
                                >
                                    {type.toUpperCase()}
                                </Button>
                            ))}
                        </div>
                    )}
                    
                    <TabsContent value="company" className="mt-6">
                        {Object.keys(companyGroups).length > 0 ? Object.entries(companyGroups).map(([category, staff]) => (
                            <div key={category} className="mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-yellow-400 border-b-2 border-yellow-600/50 pb-2 flex items-center">
                                        <FolderPlus className="w-6 h-6 mr-2" />
                                        {category.toUpperCase()}
                                    </h2>
                                    {hasAccess('edit') && (
                                        <Button onClick={() => handleDeleteCategory(category, 'company')} size="sm" variant="ghost" className="text-red-400 hover:bg-red-900/20">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                                <Droppable droppableId={`company-${category}`}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 rounded-xl transition-colors duration-300 ${snapshot.isDraggingOver ? 'bg-yellow-600/10 border-2 border-yellow-600/40 border-dashed' : 'bg-gray-900/20'}`}
                                        >
                                            <AnimatePresence>
                                                {staff.map((s, index) => <StaffCard key={s.id} staff={s} onEdit={handleOpenStaffDialog} onDelete={handleDeleteStaff} canEdit={hasAccess('edit')} index={index} />)}
                                            </AnimatePresence>
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        )) : <div className="text-center py-16 text-yellow-600"><Briefcase className="w-16 h-16 mx-auto mb-4 opacity-50" /><p className="text-lg">{searchTerm ? 'Arama sonucu bulunamadı.' : `${directoryConfig.company_title} için personel yok.`}</p></div>}
                    </TabsContent>
                    
                    <TabsContent value="project" className="mt-6">
                        {Object.keys(projectGroups).length > 0 ? Object.entries(projectGroups).map(([category, staff]) => (
                            <div key={category} className="mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-yellow-400 border-b-2 border-yellow-600/50 pb-2 flex items-center">
                                        <FolderPlus className="w-6 h-6 mr-2" />
                                        {category.toUpperCase()}
                                    </h2>
                                    {hasAccess('edit') && (
                                        <Button onClick={() => handleDeleteCategory(category, 'project')} size="sm" variant="ghost" className="text-red-400 hover:bg-red-900/20">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                                <Droppable droppableId={`project-${category}`}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 rounded-xl transition-colors duration-300 ${snapshot.isDraggingOver ? 'bg-yellow-600/10 border-2 border-yellow-600/40 border-dashed' : 'bg-gray-900/20'}`}
                                        >
                                            <AnimatePresence>
                                                {staff.map((s, index) => <StaffCard key={s.id} staff={s} onEdit={handleOpenStaffDialog} onDelete={handleDeleteStaff} canEdit={hasAccess('edit')} index={index} />)}
                                            </AnimatePresence>
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        )) : <div className="text-center py-16 text-yellow-600"><Briefcase className="w-16 h-16 mx-auto mb-4 opacity-50" /><p className="text-lg">{searchTerm ? 'Arama sonucu bulunamadı.' : `${directoryConfig.project_title} için personel yok.`}</p></div>}
                    </TabsContent>
                </Tabs>
                
                {/* Staff Dialog */}
                <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
                    <DialogContent className="bg-gray-900 border-yellow-600 text-white max-w-md">
                        <DialogHeader><DialogTitle className="text-yellow-400">{editingStaff?.id ? 'Personel Düzenle' : 'Yeni Personel Ekle'}</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label className="text-yellow-400">Tür</Label><Select value={editingStaff?.type} onValueChange={(v) => setEditingStaff({...editingStaff, type: v})}><SelectTrigger className="bg-gray-800 border-yellow-600"><SelectValue /></SelectTrigger><SelectContent className="bg-gray-900 border-yellow-700 text-white"><SelectItem value="company">{directoryConfig.company_title}</SelectItem><SelectItem value="project">{directoryConfig.project_title}</SelectItem></SelectContent></Select></div>
                                <div><Label className="text-yellow-400">Kategori / Departman</Label><Input value={editingStaff?.category} onChange={(e) => setEditingStaff({...editingStaff, category: e.target.value.toUpperCase()})} className="bg-gray-800 border-yellow-600" placeholder="örn: SEVKİYAT" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label className="text-yellow-400">Ad</Label><Input value={editingStaff?.first_name} onChange={(e) => setEditingStaff({...editingStaff, first_name: e.target.value.toUpperCase()})} className="bg-gray-800 border-yellow-600" placeholder="ADI" /></div>
                                <div><Label className="text-yellow-400">Soyad</Label><Input value={editingStaff?.last_name} onChange={(e) => setEditingStaff({...editingStaff, last_name: e.target.value.toUpperCase()})} className="bg-gray-800 border-yellow-600" placeholder="SOYADI" /></div>
                            </div>
                            <div><Label className="text-yellow-400">Görev</Label><Input value={editingStaff?.position} onChange={(e) => setEditingStaff({...editingStaff, position: e.target.value.toUpperCase()})} className="bg-gray-800 border-yellow-600" placeholder="GÖREVİ" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                 <div><Label className="text-yellow-400">Telefon</Label><Input value={editingStaff?.phone_number} onChange={(e) => setEditingStaff({...editingStaff, phone_number: e.target.value})} className="bg-gray-800 border-yellow-600" placeholder="05XX XXX XX XX" /></div>
                                 <div><Label className="text-yellow-400">Plaka</Label><Input value={editingStaff?.plate} onChange={(e) => setEditingStaff({...editingStaff, plate: e.target.value.toUpperCase()})} className="bg-gray-800 border-yellow-600" placeholder="34 ABC 123" /></div>
                            </div>
                            <div><Label className="text-yellow-400">Açıklama</Label><Textarea value={editingStaff?.description || ''} onChange={(e) => setEditingStaff({...editingStaff, description: e.target.value})} className="bg-gray-800 border-yellow-600" placeholder="AÇIKLAMA / NOTLAR" /></div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsStaffDialogOpen(false)} className="text-yellow-400 border-yellow-600 hover:bg-gray-700">İptal</Button>
                            <Button onClick={handleSaveStaff} className="bg-yellow-600 hover:bg-yellow-700 text-black">Kaydet</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Category Management Dialog - Updated */}
                <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                    <DialogContent className="bg-gray-900 border-yellow-600 text-white max-w-md">
                        <DialogHeader><DialogTitle className="text-yellow-400">Yeni Kategori Ekle</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label className="text-yellow-400">Kategori Türü</Label>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="preset-type"
                                            name="typeSelection"
                                            checked={!isCustomType}
                                            onChange={() => setIsCustomType(false)}
                                            className="text-yellow-400"
                                        />
                                        <Label htmlFor="preset-type" className="text-yellow-400">Hazır Seçenekler</Label>
                                    </div>
                                    {!isCustomType && (
                                        <Select value={newCategoryType} onValueChange={setNewCategoryType}>
                                            <SelectTrigger className="bg-gray-800 border-yellow-600">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-900 border-yellow-700 text-white">
                                                <SelectItem value="company">{directoryConfig.company_title}</SelectItem>
                                                <SelectItem value="project">{directoryConfig.project_title}</SelectItem>
                                                {allStaffTypes.filter(type => type !== 'company' && type !== 'project').map(type => (
                                                    <SelectItem key={type} value={type}>{type.toUpperCase()}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="custom-type"
                                            name="typeSelection"
                                            checked={isCustomType}
                                            onChange={() => setIsCustomType(true)}
                                            className="text-yellow-400"
                                        />
                                        <Label htmlFor="custom-type" className="text-yellow-400">Özel Tür Oluştur</Label>
                                    </div>
                                    {isCustomType && (
                                        <Input
                                            value={customCategoryType}
                                            onChange={(e) => setCustomCategoryType(e.target.value.toUpperCase())}
                                            className="bg-gray-800 border-yellow-600"
                                            placeholder="örn: MÜTEAHHITLER, TAŞERONLAR..."
                                        />
                                    )}
                                </div>
                            </div>
                            <div>
                                <Label className="text-yellow-400">Kategori Adı</Label>
                                <Input
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value.toUpperCase())}
                                    className="bg-gray-800 border-yellow-600"
                                    placeholder="PATRONLAR, SEVKİYAT, vb..."
                                />
                            </div>
                            <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-600/30">
                                <p className="text-xs text-blue-300">
                                    <strong>İpucu:</strong> Özel tür oluştururken, personel eklerken bu yeni türü seçebileceksiniz. 
                                    Örneğin "MÜTEAHHITLER" türü oluşturduktan sonra, yeni personel eklerken bu seçeneği göreceksiniz.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)} className="text-yellow-400 border-yellow-600 hover:bg-gray-700">İptal</Button>
                            <Button onClick={handleAddCategory} className="bg-yellow-600 hover:bg-yellow-700 text-black">Kategori Ekle</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Config Dialog */}
                <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
                     <DialogContent className="bg-gray-900 border-yellow-600 text-white max-w-md">
                        <DialogHeader><DialogTitle className="text-yellow-400">Sekme Başlıklarını Düzenle</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div><Label className="text-yellow-400">Şirket Sekmesi Başlığı</Label><Input value={directoryConfig.company_title} onChange={(e) => setDirectoryConfig({...directoryConfig, company_title: e.target.value.toUpperCase()})} className="bg-gray-800 border-yellow-600" /></div>
                            <div><Label className="text-yellow-400">Proje Sekmesi Başlığı</Label><Input value={directoryConfig.project_title} onChange={(e) => setDirectoryConfig({...directoryConfig, project_title: e.target.value.toUpperCase()})} className="bg-gray-800 border-yellow-600" /></div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)} className="text-yellow-400 border-yellow-600 hover:bg-gray-700">İptal</Button>
                            <Button onClick={handleSaveConfig} className="bg-yellow-600 hover:bg-yellow-700 text-black">Kaydet</Button>
                        </DialogFooter>
                     </DialogContent>
                </Dialog>
            </div>
        </DragDropContext>
    );
}
