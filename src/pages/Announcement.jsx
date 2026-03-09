import React, { useState, useEffect } from "react";
import { Announcement } from "@/entities/Announcement";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification"; // Fixed import: added 'from' keyword
import { Message } from "@/entities/Message";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Save, Shield, Clock, Trash2, Pin, SlidersHorizontal, Settings, UserCog, Zap, Type, Users, UserPlus, RefreshCw, Plus, X, Send, Volume2, RotateCcw, Edit, AlertCircle, Minus } from "lucide-react";
import { addMinutes, addHours, addDays, format, differenceInMinutes, differenceInHours, differenceInDays, isAfter, addWeeks, addMonths, differenceInMonths } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

import { motion, AnimatePresence } from "framer-motion";

// Minimal VIPBadge and DayBadge components
const VIPBadge = ({ role, size = 'md' }) => {
  let colorClass = '';
  let label = '';
  switch (role) {
    case 'admin':
      colorClass = 'bg-red-700';
      label = 'Yönetici';
      break;
    case 'vip-3':
      colorClass = 'bg-purple-700';
      label = 'VIP-3';
      break;
    case 'vip-2':
      colorClass = 'bg-blue-700';
      label = 'VIP-2';
      break;
    case 'vip-1':
      colorClass = 'bg-green-700';
      label = 'VIP-1';
      break;
    default:
      colorClass = 'bg-gray-500';
      label = 'Normal';
  }
  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm';
  return <Badge className={`${colorClass} text-white ${sizeClass}`}>{label}</Badge>;
};

const DayBadge = ({ level, size = 'md' }) => {
  const colorClass = 'bg-orange-600';
  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm';
  return <Badge className={`${colorClass} text-white ${sizeClass}`}>Gün {level}</Badge>;
};

const pages = {
    "Dashboard": "Ana Sayfa",
    "VisitorRegistration": "Ziyaretçi Kaydı",
    "InsideVisitors": "İçerideki Ziyaretçiler",
    "VisitorSearch": "Ziyaretçi Arama",
    "VisitorList": "Ziyaretçi Listesi",
    "UserManagement": "Kullanıcı Yönetimi",
    "LogPanel": "Log Kayıtları",
    "Points": "Puantaj",
    "Profile": "Profil",
    "StaffDirectory": "Personel Rehberi",
    "Announcement": "Duyuru Yönetimi",
    "Backup": "Yedekleme"
};

export default function AnnouncementPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [durationValue, setDurationValue] = useState(24);
  const [durationUnit, setDurationUnit] = useState('hours');
  const [announcements, setAnnouncements] = useState([]);
  const [announcementType, setAnnouncementType] = useState('scrolling');
  const [targetPages, setTargetPages] = useState([]);
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Rights dialog states
  const [rightsDuration, setRightsDuration] = useState(1);
  const [rightsDurationType, setRightsDurationType] = useState('days');
  const [rightsAmount, setRightsAmount] = useState(1);
  const [rightsType, setRightsType] = useState('count');
  const [rightsCanMakePinned, setRightsCanMakePinned] = useState(false);
  const [rightsCanMakeScrolling, setRightsCanMakeScrolling] = useState(true);
  const [rightsTargetPages, setRightsTargetPages] = useState([]);
  const [rightsAnnouncementDurationValue, setRightsAnnouncementDurationValue] = useState(24); // New state for per-announcement duration
  const [rightsAnnouncementDurationUnit, setRightsAnnouncementDurationUnit] = useState('hours'); // New state for per-announcement duration unit

  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [plate, setPlate] = useState('');

  const [isUserRightsViewOpen, setIsUserRightsViewOpen] = useState(false);
  const [selectedUserForView, setSelectedUserForView] = useState(null);
  const [usersWithRights, setUsersWithRights] = useState([]);
  const [sendNotification, setSendNotification] = useState(true);

  const [selectedUserForManagement, setSelectedUserForManagement] = useState(null);
  const [isUserManagementDialogOpen, setIsUserManagementDialogOpen] = useState(false);

  const pageOptions = [
    { value: 'Dashboard', label: 'Ana Sayfa' },
    { value: 'VisitorRegistration', label: 'Ziyaretçi Kaydı' },
    { value: 'InsideVisitors', label: 'İçerideki Ziyaretçiler' },
    { value: 'VisitorList', label: 'Ziyaretçi Listesi' },
    { value: 'StaffDirectory', label: 'Personel Rehberi' },
    { value: 'VisitorSearch', label: 'Ziyaretçi Arama' },
    { value: 'UserManagement', label: 'Kullanıcı Yönetimi' },
    { value: 'LogPanel', label: 'Log Kayıtları' },
    { value: 'Announcement', label: 'Duyuru Yönetimi' },
    { value: 'Points', label: 'Puantaj Yönetimi' },
    { value: 'Backup', label: 'Yedekleme' },
    { value: 'Profile', label: 'Profil Ayarları' }
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      let allFetchedAnnouncements = [];
      if (user.role === 'admin') {
        allFetchedAnnouncements = await Announcement.filter({}, '-created_date');
      } else {
        allFetchedAnnouncements = await Announcement.filter({ created_by_id: user.id }, '-created_date');
      }
      setAnnouncements(allFetchedAnnouncements);

      if (user.role === 'admin') {
        const allUsers = await User.list();
        const eligibleUsers = allUsers.filter(u =>
          u.id !== user.id && (u.vip_level === 'vip-1' || u.vip_level === 'vip-2' || u.vip_level === 'vip-3' || u.announcement_rights > 0)
        );
        setUsers(eligibleUsers);
      }
    } catch (error) {
      console.error("Veri yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsersWithRights = async () => {
    try {
      const allUsers = await User.list();
      const rightsUsers = allUsers.filter(user =>
        user.announcement_rights > 0 ||
        user.announcement_rights_pinned === true ||
        user.announcement_rights_scrolling === false ||
        (user.announcement_rights_expires && new Date(user.announcement_rights_expires) > new Date()) ||
        (user.announcement_rights_target_pages && user.announcement_rights_target_pages.length > 0)
      );
      setUsersWithRights(rightsUsers);
    } catch (error) {
      console.error("Hakları olan kullanıcılar yüklenemedi:", error);
    }
  };

  useEffect(() => {
    loadData();
    loadUsersWithRights();
  }, []);

  const canCreateAnnouncement = () => {
    if (!currentUser) return false;

    if (currentUser.role === 'admin') return true;

    if (currentUser.announcement_rights > 0 &&
        currentUser.announcement_rights_expires &&
        new Date() < new Date(currentUser.announcement_rights_expires)) {
      return true;
    }

    if (['vip-2', 'vip-3'].includes(currentUser.vip_level)) {
      return currentUser.announcement_rights > 0 && 
             currentUser.announcement_rights_expires && 
             new Date() < new Date(currentUser.announcement_rights_expires);
    }

    return false;
  };

  const canMakePinnedAnnouncement = () => {
    if (!currentUser) return false;

    if (currentUser.role === 'admin') return true;

    return currentUser.announcement_rights_pinned === true && 
           currentUser.announcement_rights > 0 &&
           currentUser.announcement_rights_expires &&
           new Date() < new Date(currentUser.announcement_rights_expires);
  };

  const canMakeScrollingAnnouncement = () => {
    if (!currentUser) return false;

    if (currentUser.role === 'admin') return true;

    return currentUser.announcement_rights_scrolling !== false && 
           currentUser.announcement_rights > 0 &&
           currentUser.announcement_rights_expires &&
           new Date() < new Date(currentUser.announcement_rights_expires);
  };

  const handlePublish = async () => {
    if (!content.trim() || !currentUser) return;

    if (!canCreateAnnouncement()) {
      alert("Duyuru yapma hakkınız bulunmuyor veya süresi dolmuş. Lütfen yönetici ile iletişime geçin.");
      return;
    }

    if (announcementType === 'pinned' && !title.trim()) {
      alert("Sabit duyurular için başlık gereklidir.");
      return;
    }

    if (announcementType === 'pinned' && !canMakePinnedAnnouncement()) {
      alert("Sabit duyuru yapma yetkiniz bulunmuyor.");
      return;
    }

    if (announcementType === 'scrolling' && !canMakeScrollingAnnouncement()) {
      alert("Kayan yazı duyuru yapma yetkiniz bulunmuyor.");
      return;
    }

    if (currentUser.role !== 'admin') {
      if (currentUser.announcement_rights !== undefined && currentUser.announcement_rights <= 0) {
        alert("Duyuru yapma hakkınız bitmiştir. Yeni hak almak için yönetici ile iletişime geçin.");
        return;
      }
      
      if (currentUser.announcement_rights_expires) {
        const expirationDate = new Date(currentUser.announcement_rights_expires);
        if (new Date() >= expirationDate) {
          alert("Duyuru yapma hakkınızın süresi dolmuştur. Yönetici ile iletişime geçin.");
          return;
        }
      }
    }

    setLoading(true);

    let expires_at;
    const now = new Date();

    // Determine expiry based on user role
    if (currentUser.role === 'admin') {
      // Admin uses the form controls
      if (durationUnit === 'unlimited') {
        expires_at = addDays(now, 365 * 10); // Effectively unlimited
      } else {
        if (durationUnit === 'hours') expires_at = addHours(now, durationValue);
        else if (durationUnit === 'days') expires_at = addDays(now, durationValue);
        else if (durationUnit === 'weeks') expires_at = addWeeks(now, durationValue);
        else expires_at = addHours(now, 24); // Fallback
      }
    } else {
      // Non-admin users get duration from their assigned rights
      const value = currentUser.announcement_duration_value || 24;
      const unit = currentUser.announcement_duration_unit || 'hours';

      if (unit === 'hours') expires_at = addHours(now, value);
      else if (unit === 'days') expires_at = addDays(now, value);
      else if (unit === 'weeks') expires_at = addWeeks(now, value);
      else expires_at = addHours(now, 24); // Fallback
    }

    try {
      const newAnnouncement = await Announcement.create({
        title: announcementType === 'pinned' ? title : '',
        content,
        company: announcementType === 'pinned' ? company : '',
        plate: announcementType === 'pinned' ? plate : '',
        expires_at: expires_at.toISOString(),
        created_by_name: `${currentUser.first_name} ${currentUser.last_name}`,
        created_by_id: currentUser.id,
        created_by_level: currentUser.level,
        created_by_badges: currentUser.badges || [],
        announcement_type: announcementType,
        target_pages: targetPages,
        is_active: true
      });

      if (sendNotification) {
        try {
          const allUsers = await User.list();
          const recipients = allUsers.filter(u => u.id !== currentUser.id);

          let messageContent = '';

          if (announcementType === 'pinned') {
            messageContent = `📌 SABİT DUYURU: ${title || 'Yeni Duyuru'}\n\n`;
            messageContent += `${content}\n\n`;

            if (company || plate) {
              messageContent += '--- DETAYLAR ---\n';
              if (company) messageContent += `🏢 Firma: ${company}\n`;
              if (plate) messageContent += `🚗 Plaka: ${plate}\n`;
            }
          } else {
            messageContent = `📢 KAYAN DUYURU\n\n${content}\n\n`;
          }

          messageContent += `--- DUYURU BİLGİLERİ ---\n`;
          messageContent += `👤 Yayınlayan: ${currentUser.first_name} ${currentUser.last_name}\n`;
          messageContent += `📅 Tarih: ${format(new Date(), 'dd.MM.yyyy HH:mm')}\n`;
          messageContent += `⏰ Bitiş: ${format(expires_at, 'dd.MM.yyyy HH:mm')}`;

          const messagesToCreate = recipients.map(user => ({
            sender_id: currentUser.id,
            sender_name: `${currentUser.first_name} ${currentUser.last_name}`,
            receiver_id: user.id,
            receiver_name: `${user.first_name} ${user.last_name}`,
            content: messageContent,
          }));

          const notificationsToCreate = recipients.map(user => ({
            user_id: user.id,
            type: 'announcement',
            title: announcementType === 'pinned' ?
              (title || 'Yeni Sabit Duyuru') :
              'Yeni Duyuru',
            content: `${currentUser.first_name} ${currentUser.last_name} yeni bir duyuru yayınladı.`,
            related_id: newAnnouncement.id
          }));

          if (messagesToCreate.length > 0) {
            await Message.bulkCreate(messagesToCreate);
          }
          if (notificationsToCreate.length > 0) {
            await Notification.bulkCreate(notificationsToCreate);
          }

          console.log(`${recipients.length} kullanıcıya duyuru mesajı ve bildirim gönderildi.`);
        } catch (messageError) {
          console.error("Mesajlar veya bildirimler gönderilemedi:", messageError);
        }
      }

      if (currentUser.role !== 'admin' && currentUser.announcement_rights > 0 && currentUser.announcement_rights < 999999) {
        await User.updateMyUserData({
          announcement_rights: currentUser.announcement_rights - 1
        });
        setCurrentUser(prevUser => ({
          ...prevUser,
          announcement_rights: prevUser.announcement_rights - 1
        }));
      }

      setTitle('');
      setContent('');
      setCompany('');
      setPlate('');
      setTargetPages([]);
      setSendNotification(true);
      loadData();
      loadUsersWithRights();
      alert("Duyuru başarıyla yayınlandı!");
    } catch (error) {
      console.error("Duyuru yayınlanamadı:", error);
      alert("Duyuru yayınlanırken bir hata oluştu.");
    }
    setLoading(false);
  };

  const handleDelete = async (announcementId, announcement) => {
    if (currentUser.role !== 'admin' && announcement.created_by_id !== currentUser.id) {
      alert("Sadece kendi duyurularınızı silebilirsiniz.");
      return;
    }

    if (window.confirm("Bu duyuruyu silmek istediğinizden emin misiniz?")) {
      try {
        await Announcement.delete(announcementId);
        loadData();
        alert("Duyuru başarıyla silindi.");
      } catch (error) {
        console.error("Duyuru silinemedi:", error);
        alert("Duyuru silinirken bir hata oluştu.");
      }
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement({ ...announcement });
    setIsEditDialogOpen(true);
  };

  const handleUpdateAnnouncement = async () => {
    if (!editingAnnouncement) return;
    
    setLoading(true);
    try {
      const { id, created_by_id, created_by_name, created_date, updated_date, ...updateData } = editingAnnouncement;
      
      if (updateData.expires_at && typeof updateData.expires_at === 'object') {
        updateData.expires_at = updateData.expires_at.toISOString();
      }

      await Announcement.update(id, updateData);
      
      setIsEditDialogOpen(false);
      setEditingAnnouncement(null);
      loadData();
      alert("Duyuru başarıyla güncellendi!");
    } catch (error) {
      console.error("Duyuru güncellenemedi:", error);
      alert("Duyuru güncellenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleTargetPageChange = (page) => {
    setTargetPages(prev =>
        prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page]
    );
  };

  const grantAnnouncementRights = async (userId) => {
    if (!userId) {
      alert("Lütfen bir kullanıcı seçin.");
      return;
    }
    if (!window.confirm("Seçilen kullanıcıya duyuru hakkı vermek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      let expires_at;
      const now = new Date();

      if (rightsType === 'unlimited') {
        expires_at = addDays(now, 365 * 10);
      } else if (rightsType === 'count') {
        expires_at = addDays(now, 30); // Default expiry for count-based rights, could be unlimited if desired
      } else { // rightsType === 'time'
        if (rightsDurationType === 'days') expires_at = addDays(now, rightsDuration);
        else if (rightsDurationType === 'weeks') expires_at = addWeeks(now, rightsDuration);
        else if (rightsDurationType === 'months') expires_at = addMonths(now, rightsDuration);
        else if (rightsDurationType === 'hours') expires_at = addHours(now, rightsDuration);
      }

      const rightsToGrant = rightsType === 'unlimited' ? 999999 :
                           rightsType === 'count' ? rightsAmount :
                           999999;

      await User.update(userId, {
        announcement_rights: rightsToGrant,
        announcement_rights_expires: expires_at.toISOString(),
        announcement_rights_pinned: rightsCanMakePinned,
        announcement_rights_scrolling: rightsCanMakeScrolling,
        announcement_rights_target_pages: rightsTargetPages.length > 0 ? rightsTargetPages : null,
        announcement_duration_value: rightsAnnouncementDurationValue, // New field
        announcement_duration_unit: rightsAnnouncementDurationUnit, // New field
      });

      const pageText = rightsTargetPages.length === 0 ?
        "tüm sayfalarda" :
        rightsTargetPages.length === 1 && rightsTargetPages[0] === 'Dashboard' ?
        "ana sayfada" :
        `${rightsTargetPages.map(page => pageOptions.find(p => p.value === page)?.label || page).join(', ')} sayfalarında`;

      await Notification.create({
        user_id: userId,
        type: 'announcement',
        title: 'Duyuru Hakkı Verildi',
        content: `Size ${rightsAmount} adet duyuru hakkı verildi. Bu hakkı ${pageText} kullanabilirsiniz. Süre: ${format(expires_at, 'dd.MM.yyyy HH:mm')}`
      });

      setIsGrantDialogOpen(false);
      setSelectedUserId(null);
      setRightsAmount(1);
      setRightsDuration(1);
      setRightsDurationType('days');
      setRightsCanMakePinned(false);
      setRightsCanMakeScrolling(true);
      setRightsTargetPages([]);
      // Reset new state variables as well
      setRightsAnnouncementDurationValue(24);
      setRightsAnnouncementDurationUnit('hours');

      loadData();
      loadUsersWithRights();
      alert(`${user.first_name} ${user.last_name} kullanıcısına başarıyla duyuru hakkı verildi.`);
    } catch (error) {
      console.error("Duyuru hakkı verilemedi:", error);
      alert("Duyuru hakkı verilirken bir hata oluştu.");
    }
  };

  const revokeUserRights = async (userId) => {
    if (!window.confirm("Bu kullanıcının duyuru haklarını iptal etmek istediğinizden emin misiniz?")) return;

    try {
      await User.update(userId, {
        announcement_rights: 0,
        announcement_rights_expires: new Date().toISOString(),
        announcement_rights_pinned: false,
        announcement_rights_scrolling: true,
        announcement_rights_target_pages: null,
        announcement_duration_value: 0, // Reset to default/invalid
        announcement_duration_unit: 'hours', // Reset unit
      });

      loadUsersWithRights();
      loadData();
      alert("Kullanıcı hakları başarıyla iptal edildi.");
    } catch (error) {
      console.error("Haklar iptal edilemedi:", error);
      alert("Haklar iptal edilirken bir hata oluştu.");
    }
  };

  const extendUserRights = async (userId, additionalRights = 5) => {
    try {
      const user = usersWithRights.find(u => u.id === userId);
      if (!user) return;

      await User.update(userId, {
        announcement_rights: (user.announcement_rights || 0) + additionalRights,
      });

      loadUsersWithRights();
      loadData();
      alert(`Kullanıcıya ${additionalRights} ek duyuru hakkı verildi.`);
    } catch (error) {
      console.error("Ek haklar verilemedi:", error);
      alert("Ek haklar verilirken bir hata oluştu.");
    }
  };

  const openUserManagement = (user) => {
    setSelectedUserForManagement(user);
    setIsUserManagementDialogOpen(true);
  };

  const reduceUserRights = async (userId, amount = 1) => {
    try {
      const user = usersWithRights.find(u => u.id === userId);
      if (!user) return;

      const newRights = Math.max(0, (user.announcement_rights || 0) - amount);
      await User.update(userId, {
        announcement_rights: newRights,
      });

      loadUsersWithRights();
      loadData();
      alert(`${user.first_name} ${user.last_name} kullanıcısının ${amount} hakkı azaltıldı.`);
    } catch (error) {
      console.error("Hak azaltma hatası:", error);
      alert("Hak azaltılırken bir hata oluştu.");
    }
  };

  const addUserRights = async (userId, amount = 5) => {
    try {
      const user = usersWithRights.find(u => u.id === userId) || users.find(u => u.id === userId);
      if (!user) return;

      const newRights = (user.announcement_rights || 0) + amount;
      
      let expiryDate = user.announcement_rights_expires;
      // If no expiry or expired, set a default expiry for new rights
      if (!expiryDate || new Date(expiryDate) <= new Date()) {
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30); // Default to 30 days
      }

      await User.update(userId, {
        announcement_rights: newRights,
        announcement_rights_expires: expiryDate.toISOString(),
        announcement_rights_scrolling: true,
        // Only set default per-announcement duration if not already set or invalid
        announcement_duration_value: user.announcement_duration_value || 24,
        announcement_duration_unit: user.announcement_duration_unit || 'hours',
      });

      loadUsersWithRights();
      loadData();
      alert(`${user.first_name} ${user.last_name} kullanıcısına ${amount} hak eklendi.`);
    } catch (error) {
      console.error("Hak ekleme hatası:", error);
      alert("Hak eklenirken bir hata oluştu.");
    }
  };

  const getRightsStatusColor = (user) => {
    if (user.announcement_rights === 0 || !user.announcement_rights) return "text-red-400";
    if (user.announcement_rights <= 3) return "text-yellow-400";
    if (user.announcement_rights >= 999999) return "text-green-400";
    return "text-green-400";
  };

  const getRightsExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { text: "Süresiz", color: "text-green-400" };

    const expiry = new Date(expiryDate);
    const now = new Date();

    if (expiry.getTime() <= now.getTime()) {
      return { text: "Süresi Dolmuş", color: "text-red-400" };
    }

    const diffDays = differenceInDays(expiry, now);

    if (diffDays === 0) return { text: "Bugün Bitiyor", color: "text-red-400" };
    if (diffDays === 1) return { text: "Yarın Bitiyor", color: "text-orange-400" };
    if (diffDays <= 7) return { text: `${diffDays} Gün Kaldı`, color: "text-yellow-400" };

    const diffMonths = differenceInMonths(expiry, now);
    if (diffMonths > 0) return { text: `${diffMonths} Ay Kaldı`, color: "text-blue-400" };

    return { text: `${diffDays} Gün Kaldı`, color: "text-green-400" };
  };

  const RemainingTime = ({ expiry }) => {
    const [remaining, setRemaining] = useState('');

    useEffect(() => {
      const calculateRemaining = () => {
        const now = new Date();
        const expiryDate = new Date(expiry);
        if (!isAfter(expiryDate, now)) {
          setRemaining("Süre doldu");
          return;
        }

        const days = differenceInDays(expiryDate, now);
        const hours = differenceInHours(expiryDate, now) % 24;
        const minutes = differenceInMinutes(expiryDate, now) % 60;

        let str = '';
        if (days > 0) str += `${days} gün `;
        if (hours > 0) str += `${hours} saat `;
        if (minutes > 0) str += `${minutes} dakika`;

        setRemaining(str.trim() ? str.trim() + ' kaldı' : 'Az kaldı');
      };

      calculateRemaining();
      const interval = setInterval(calculateRemaining, 1000 * 30);
      return () => clearInterval(interval);
    }, [expiry]);

    return <span className="text-xs text-yellow-600">{remaining}</span>;
  };

  const hasFullAccess = () => {
    if (!currentUser) return false;
    return currentUser.role === 'admin';
  }

  const hasBasicAccess = () => {
    if (!currentUser) return false;
    const userDisplayRole = currentUser.role === 'admin' ? 'admin' : currentUser.vip_level;
    return ['admin', 'vip-3', 'vip-2', 'vip-1'].includes(userDisplayRole);
  }

  if (!hasBasicAccess()) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <Card className="bg-gray-800 border-yellow-600 text-center">
          <CardContent className="p-8">
            <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-yellow-400">Yetki Yok</h2>
            <p className="text-yellow-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeAndVisibleAnnouncements = announcements.filter(ann => ann.is_active && new Date(ann.expires_at) > new Date());
  
  const displayAnnouncements = hasFullAccess() 
    ? activeAndVisibleAnnouncements 
    : activeAndVisibleAnnouncements.filter(ann => ann.created_by_id === currentUser.id);

  const pinnedAnnouncements = displayAnnouncements.filter(ann => ann.announcement_type === 'pinned');
  const scrollingAnnouncements = displayAnnouncements.filter(ann => ann.announcement_type === 'scrolling');

  const durationUnitMap = {
    hours: 'Saat',
    days: 'Gün',
    weeks: 'Hafta'
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-center text-amber-400 mb-2 flex items-center justify-center space-x-3">
        <Megaphone className="w-8 h-8" />
        <span>Duyuru Yönetim Paneli</span>
      </h1>
      <p className="text-center text-amber-600 mb-8">Yeni duyurular oluşturun, mevcut olanları yönetin ve kullanıcılara yetki verin.</p>

      {hasFullAccess() && (
        <div className="mb-6 flex justify-center">
          <div className="flex items-center space-x-2 bg-gray-800/50 backdrop-blur-sm p-2 rounded-xl border border-amber-600/30">
            <Button 
              size="sm"
              onClick={() => setIsGrantDialogOpen(true)}
              className="h-8 px-3 py-1 text-xs bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border border-yellow-300/50"
            >
              <UserPlus className="w-3 h-3 mr-1" />
              Yeni Hak Ver
            </Button>
            <Button
              size="sm"
              onClick={() => setIsUserRightsViewOpen(true)}
              className="h-8 px-3 py-1 text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border border-blue-400/50"
            >
              <Users className="w-3 h-3 mr-1" />
              Hakları Görüntüle ({usersWithRights.length})
            </Button>
            <Button
              size="sm"
              onClick={loadData}
              className="h-8 px-3 py-1 text-xs bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border border-green-400/50"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Yenile
            </Button>
          </div>
        </div>
      )}

      {/* User Rights Display */}
      <div className="mb-8 flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-4">
        {!hasFullAccess() && (
          <div className="flex items-center space-x-2">  
            <Badge className={`${currentUser?.announcement_rights > 0 ? 'bg-blue-600' : 'bg-red-600'} text-white`}>
              Kalan Hak: {currentUser?.announcement_rights || 0}
            </Badge>
            {currentUser?.announcement_rights_expires && (
              <Badge variant="outline" className={`${new Date() < new Date(currentUser.announcement_rights_expires) ? 'border-blue-600 text-blue-400' : 'border-red-600 text-red-400'}`}>
                {new Date() < new Date(currentUser.announcement_rights_expires) ? (
                  <RemainingTime expiry={currentUser.announcement_rights_expires} />
                ) : (
                  "Süresi Dolmuş"
                )}
              </Badge>
            )}
            {currentUser?.announcement_rights_pinned && (
              <Badge className="bg-yellow-600 text-black">Sabit Duyuru Yetkisi Var</Badge>
            )}
            {currentUser?.announcement_rights_scrolling !== false && currentUser?.announcement_rights > 0 && currentUser?.announcement_rights_expires && new Date() < new Date(currentUser.announcement_rights_expires) && (
              <Badge className="bg-cyan-600 text-black">Kayan Duyuru Yetkisi Var</Badge>
            )}
            {currentUser?.announcement_rights_target_pages?.length > 0 && (
                <Badge variant="outline" className="border-orange-600 text-orange-400">
                  {currentUser.announcement_rights_target_pages.map(p => pages[p] || p).join(', ')}
                </Badge>
            )}
          </div>
        )}
      </div>

      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-amber-600/50 mb-8">
          <CardHeader className="border-b border-amber-600">
            <CardTitle className="flex items-center space-x-2 text-amber-400">
              <Megaphone className="w-5 h-5" />
              <span>Yeni Duyuru Oluştur</span>
              {currentUser?.role !== 'admin' && (
                <Badge className={`${canCreateAnnouncement() ? 'bg-amber-600' : 'bg-red-600'} text-${canCreateAnnouncement() ? 'black' : 'white'} ml-auto`}>
                  {canCreateAnnouncement() ? `Kalan Hak: ${currentUser?.announcement_rights || 0}` : 'Hakkınız Yok'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {!canCreateAnnouncement() && (
              <div className="p-4 bg-red-900 border border-red-600 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-red-200 font-semibold">Duyuru Yapma Hakkınız Bulunmuyor</p>
                    <p className="text-red-300 text-sm mt-1">
                      {currentUser?.announcement_rights === 0 ? 
                        "Duyuru yapma hakkınız bitmiştir." :
                        currentUser?.announcement_rights_expires && new Date() >= new Date(currentUser.announcement_rights_expires) ?
                        "Duyuru yapma hakkınızın süresi dolmuştur." :
                        "Bu özelliği kullanabilmek için yeterli yetkiniz bulunmuyor."
                      } Yönetici ile iletişime geçin.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={e => { e.preventDefault(); handlePublish(); }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className="text-yellow-400">Duyuru Türü</Label>
                      <Select
                        value={announcementType}
                        onValueChange={setAnnouncementType}
                        disabled={!canCreateAnnouncement()}
                      >
                        <SelectTrigger className="bg-gray-900 border-yellow-600 text-yellow-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-yellow-600">
                          <SelectItem
                            value="scrolling"
                            className="text-yellow-400"
                            disabled={!canMakeScrollingAnnouncement()}
                          >
                            Kayan Yazı {!canMakeScrollingAnnouncement() && '(Yetki Yok)'}
                          </SelectItem>
                          <SelectItem
                            value="pinned"
                            className="text-yellow-400"
                            disabled={!canMakePinnedAnnouncement()}
                          >
                            Sabit Duyuru {!canMakePinnedAnnouncement() && '(Yetki Yok)'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="content" className="text-yellow-400">Duyuru Metni</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={canCreateAnnouncement() ? "Duyurunuzu buraya yazın..." : "Duyuru yapma hakkınız bulunmuyor..."}
                      className="h-24 bg-gray-900 border-yellow-600 text-yellow-400"
                      disabled={!canCreateAnnouncement()}
                    />
                  </div>

                  <AnimatePresence>
                    {announcementType === 'pinned' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        <div>
                          <Label htmlFor="title" className="text-yellow-400">Başlık *</Label>
                          <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value.toUpperCase())}
                            className="bg-gray-900 border-yellow-600 text-amber-400"
                            placeholder="DUYURU BAŞLIĞI"
                            disabled={!canCreateAnnouncement()}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="company" className="text-yellow-400">Firma</Label>
                            <Input
                              id="company"
                              value={company}
                              onChange={(e) => setCompany(e.target.value.toUpperCase())}
                              className="bg-gray-900 border-yellow-600 text-amber-400"
                              placeholder="FİRMA ADI"
                              disabled={!canCreateAnnouncement()}
                            />
                          </div>
                          <div>
                            <Label htmlFor="plate" className="text-yellow-400">Plaka</Label>
                            <Input
                              id="plate"
                              value={plate}
                              onChange={(e) => setPlate(e.target.value.toUpperCase())}
                              className="bg-gray-900 border-yellow-600 text-amber-400"
                              placeholder="34 ABC 123"
                              disabled={!canCreateAnnouncement()}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label className="text-yellow-400">Bildirim Seçenekleri</Label>
                    <div className="flex items-center space-x-3 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sendNotification"
                          checked={sendNotification}
                          onCheckedChange={(checked) => setSendNotification(checked)}
                          className="border-yellow-600 data-[state=checked]:bg-yellow-600"
                          disabled={!canCreateAnnouncement()}
                        />
                        <Label htmlFor="sendNotification" className="text-yellow-400 text-sm cursor-pointer">
                          📢 Tüm kullanıcılara bildirim gönder
                        </Label>
                      </div>
                      {sendNotification && users && (
                        <Badge className="bg-blue-600 text-white text-xs">
                          {users.length} kullanıcıya bildirim gönderilecek
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-yellow-600 mt-1">
                      This option active, all users notification send when new announcement published.
                    </p>
                  </div>

                  {/* DURATION SECTION - NOW WITH CONDITIONAL LOGIC */}
                  <div>
                    <Label className="text-yellow-400">Yayın Süresi</Label>
                    {hasFullAccess() ? (
                      // Admin sees full controls
                      <div className="flex items-center space-x-2">
                        {durationUnit !== 'unlimited' && (
                          <Input
                            type="number"
                            min="1"
                            value={durationValue}
                            onChange={(e) => setDurationValue(Math.max(1, parseInt(e.target.value, 10)))}
                            className="w-24 bg-gray-900 border-yellow-600 text-yellow-400"
                            disabled={!canCreateAnnouncement()}
                          />
                        )}
                        <Select value={durationUnit} onValueChange={setDurationUnit} disabled={!canCreateAnnouncement()}>
                          <SelectTrigger className="w-full bg-gray-900 border-yellow-600 text-yellow-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-yellow-600">
                            <SelectItem value="hours" className="text-yellow-400">Saat</SelectItem>
                            <SelectItem value="days" className="text-yellow-400">Gün</SelectItem>
                            <SelectItem value="weeks" className="text-yellow-400">Hafta</SelectItem>
                            <SelectItem value="unlimited" className="text-yellow-400">Süresiz</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      // Non-admin sees their assigned duration
                      <div className="p-2 bg-gray-900 border border-yellow-600/50 rounded-md text-center">
                        <p className="text-sm text-amber-400">
                          Duyurunuz 
                          <span className="font-bold text-white mx-1">
                            {currentUser?.announcement_duration_value || 24} {durationUnitMap[currentUser?.announcement_duration_unit || 'hours']}
                          </span>
                          boyunca yayında kalacaktır.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-yellow-400">Yayınlanacak Sayfalar (Boş bırakılırsa tüm sayfalarda görünür)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 p-3 bg-gray-900 rounded-lg border border-yellow-600">
                      {Object.entries(pages).map(([pageKey, pageName]) => (
                        <div key={pageKey} className="flex items-center space-x-2">
                          <Checkbox
                            id={pageKey}
                            checked={targetPages.includes(pageKey)}
                            onCheckedChange={() => handleTargetPageChange(pageKey)}
                            className="border-yellow-600 data-[state=checked]:bg-yellow-600"
                            disabled={!canCreateAnnouncement()}
                          />
                          <Label htmlFor={pageKey} className="text-sm text-yellow-400 font-normal">{pageName}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loading || !content.trim() || !canCreateAnnouncement()}
                  className={`${canCreateAnnouncement() ? 
                    'bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black' : 
                    'bg-gray-600 cursor-not-allowed text-gray-400'
                  } font-bold px-8 border-2 ${canCreateAnnouncement() ? 'border-yellow-300' : 'border-gray-500'}`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Yayınlanıyor...
                    </>
                  ) : !canCreateAnnouncement() ? (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Duyuru Yapma Hakkınız Yok
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Duyuru Yayınla {sendNotification && '+ Bildirim Gönder'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

      <div className="space-y-10">
        <div>
          <h2 className="text-xl font-bold text-amber-400 mb-4 flex items-center">
            <Pin className="w-5 h-5 mr-2" />
            Aktif Sabit Duyurular ({pinnedAnnouncements.length})
          </h2>
          {pinnedAnnouncements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
              {pinnedAnnouncements.map(ann => (
                <div key={ann.id} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-yellow-600/30 shadow-lg hover:shadow-yellow-600/20 transition-shadow duration-300 flex flex-col">
                  {/* Header */}
                  <div className="p-4 border-b border-yellow-600/20">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-yellow-600 text-black font-semibold text-xs px-2 py-1">📌 Sabit</Badge>
                      <div className="flex items-center space-x-1">
                        {(currentUser?.role === 'admin' || ann.created_by_id === currentUser?.id) && (
                          <Button size="icon" className="w-6 h-6 bg-blue-600/80 hover:bg-blue-600" onClick={() => handleEdit(ann)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                        {(currentUser?.role === 'admin' || ann.created_by_id === currentUser?.id) && (
                          <Button size="icon" className="w-6 h-6 bg-red-600/80 hover:bg-red-600" onClick={() => handleDelete(ann.id, ann)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <h3 className="text-amber-400 font-bold text-sm leading-tight">{ann.title}</h3>
                    {(ann.company || ann.plate) && (
                      <div className="text-xs text-amber-600 mt-2 flex flex-wrap gap-2">
                        {ann.company && <span>🏢 {ann.company}</span>}
                        {ann.plate && <span>🚗 {ann.plate}</span>}
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 flex-grow">
                    <p className="text-sm text-yellow-300 whitespace-pre-wrap break-words leading-relaxed">{ann.content}</p>
                  </div>
                  
                  {/* Footer */}
                  <div className="p-4 border-t border-yellow-600/20 text-xs text-amber-600 mt-auto">
                    <div className="space-y-1">
                      <div>👤 <span className="font-medium">{ann.created_by_name}</span></div>
                      <div>⏳ Bitiş: <span className="font-medium">{format(new Date(ann.expires_at), 'dd.MM.yyyy HH:mm')}</span></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Pin className="w-12 h-12 mx-auto mb-3 opacity-50 text-amber-600" />
              <p className="text-amber-600">Aktif sabit duyuru bulunmuyor.</p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold text-amber-400 mb-4 flex items-center">
            <Volume2 className="w-5 h-5 mr-2" />
            Aktif Kayan Yazı Duyuruları ({scrollingAnnouncements.length})
          </h2>
          {scrollingAnnouncements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
              {scrollingAnnouncements.map(ann => (
                <div key={ann.id} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-yellow-600/30 shadow-lg hover:shadow-yellow-600/20 transition-shadow duration-300 flex flex-col">
                   {/* Header */}
                   <div className="p-4 border-b border-yellow-600/20">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-blue-600 text-white font-semibold text-xs px-2 py-1">📢 Kayan</Badge>
                      <div className="flex items-center space-x-1">
                        {(currentUser?.role === 'admin' || ann.created_by_id === currentUser?.id) && (
                          <Button size="icon" className="w-6 h-6 bg-blue-600/80 hover:bg-blue-600" onClick={() => handleEdit(ann)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                        {(currentUser?.role === 'admin' || ann.created_by_id === currentUser?.id) && (
                          <Button size="icon" className="w-6 h-6 bg-red-600/80 hover:bg-red-600" onClick={() => handleDelete(ann.id, ann)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <h3 className="text-amber-400 font-bold text-sm leading-tight">Kayan Yazı Duyurusu</h3>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 flex-grow">
                    <p className="text-sm text-yellow-300 whitespace-pre-wrap break-words leading-relaxed">{ann.content}</p>
                  </div>
                  
                  {/* Footer */}
                  <div className="p-4 border-t border-yellow-600/20 text-xs text-amber-600 mt-auto">
                    <div className="space-y-1">
                      <div>👤 <span className="font-medium">{ann.created_by_name}</span></div>
                      <div>⏳ Bitiş: <span className="font-medium">{format(new Date(ann.expires_at), 'dd.MM.yyyy HH:mm')}</span></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Volume2 className="w-12 h-12 mx-auto mb-3 opacity-50 text-amber-600" />
              <p className="text-amber-600">Aktif kayan yazı duyurusu bulunmuyor.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isGrantDialogOpen} onOpenChange={setIsGrantDialogOpen}>
        <DialogContent className="bg-gray-900 border-yellow-600 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 text-xl flex items-center">
              <UserPlus className="w-6 h-6 mr-3" />
              Duyuru Hakkı Ver
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* User Selection */}
              <Card className="bg-gray-800 border-yellow-600/30 p-4">
                <Label className="text-yellow-400 text-sm font-medium mb-3 block">
                  <Users className="w-4 h-4 inline mr-2" />
                  Kullanıcı Seç
                </Label>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto p-2 bg-gray-700 rounded border border-yellow-600/50">
                  {users.filter(u => u.id !== currentUser?.id).map(user => (
                    <div key={user.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-600">
                      <input
                        type="radio"
                        id={`user-${user.id}`}
                        name="selectedUser"
                        value={user.id}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="text-yellow-400 focus:ring-yellow-500"
                      />
                      <label htmlFor={`user-${user.id}`} className="text-yellow-400 text-sm cursor-pointer flex-1">
                        {user.first_name} {user.last_name} <VIPBadge role={user.role === 'admin' ? 'admin' : user.vip_level} size="sm" />
                      </label>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Rights Type */}
              <Card className="bg-gray-800 border-yellow-600/30 p-4">
                <Label className="text-yellow-400 text-sm font-medium mb-3 block">
                  <Settings className="w-4 h-4 inline mr-2" />
                  Hak Türü
                </Label>
                <Select value={rightsType} onValueChange={setRightsType}>
                  <SelectTrigger className="bg-gray-700 border-yellow-600 text-yellow-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-yellow-600">
                    <SelectItem value="count" className="text-yellow-400">📊 Adet Bazında</SelectItem>
                    <SelectItem value="time" className="text-yellow-400">⏰ Süre Bazında</SelectItem>
                    <SelectItem value="unlimited" className="text-yellow-400">♾️ Sınırsız</SelectItem>
                  </SelectContent>
                </Select>

                {/* Rights Amount/Duration */}
                {rightsType === 'count' && (
                  <div className="mt-3">
                    <Label className="text-yellow-400 text-xs">Duyuru Adeti</Label>
                    <Input
                      type="number"
                      min="1"
                      value={rightsAmount}
                      onChange={(e) => setRightsAmount(parseInt(e.target.value) || 1)}
                      className="bg-gray-700 border-yellow-600 text-yellow-400 mt-1"
                    />
                  </div>
                )}

                {rightsType === 'time' && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div>
                      <Label className="text-yellow-400 text-xs">Süre</Label>
                      <Input
                        type="number"
                        min="1"
                        value={rightsDuration}
                        onChange={(e) => setRightsDuration(parseInt(e.target.value) || 1)}
                        className="bg-gray-700 border-yellow-600 text-yellow-400 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-yellow-400 text-xs">Birim</Label>
                      <Select value={rightsDurationType} onValueChange={setRightsDurationType}>
                        <SelectTrigger className="bg-gray-700 border-yellow-600 text-yellow-400 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-yellow-600">
                          <SelectItem value="hours" className="text-yellow-400">Saat</SelectItem>
                          <SelectItem value="days" className="text-yellow-400">Gün</SelectItem>
                          <SelectItem value="weeks" className="text-yellow-400">Hafta</SelectItem>
                          <SelectItem value="months" className="text-yellow-400">Ay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Announcement Duration */}
              <Card className="bg-gray-800 border-yellow-600/30 p-4">
                <Label className="text-yellow-400 text-sm font-medium mb-3 block">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Her Duyuru Geçerlilik Süresi
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-yellow-400 text-xs">Süre</Label>
                    <Input
                      type="number"
                      min="1"
                      value={rightsAnnouncementDurationValue}
                      onChange={(e) => setRightsAnnouncementDurationValue(parseInt(e.target.value) || 1)}
                      className="bg-gray-700 border-yellow-600 text-yellow-400 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-yellow-400 text-xs">Birim</Label>
                    <Select value={rightsAnnouncementDurationUnit} onValueChange={setRightsAnnouncementDurationUnit}>
                      <SelectTrigger className="bg-gray-700 border-yellow-600 text-yellow-400 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-yellow-600">
                        <SelectItem value="hours" className="text-yellow-400">Saat</SelectItem>
                        <SelectItem value="days" className="text-yellow-400">Gün</SelectItem>
                        <SelectItem value="weeks" className="text-yellow-400">Hafta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-yellow-600 mt-2">
                  Bu kullanıcının yayınladığı her duyuru bu süre kadar aktif kalacak.
                </p>
              </Card>

              {/* Announcement Types */}
              <Card className="bg-gray-800 border-yellow-600/30 p-4">
                <Label className="text-yellow-400 text-sm font-medium mb-3 block">
                  <Type className="w-4 h-4 inline mr-2" />
                  Duyuru Türleri
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="scrolling-rights"
                      checked={rightsCanMakeScrolling}
                      onChange={(e) => setRightsCanMakeScrolling(e.target.checked)}
                      className="text-yellow-400 focus:ring-yellow-500"
                    />
                    <label htmlFor="scrolling-rights" className="text-yellow-400 text-sm">
                      📢 Kayan Duyuru
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="pinned-rights"
                      checked={rightsCanMakePinned}
                      onChange={(e) => setRightsCanMakePinned(e.target.checked)}
                      className="text-yellow-400 focus:ring-yellow-500"
                    />
                    <label htmlFor="pinned-rights" className="text-yellow-400 text-sm">
                      📌 Sabit Duyuru
                    </label>
                  </div>
                </div>
              </Card>

              {/* Target Pages */}
              <Card className="bg-gray-800 border-yellow-600/30 p-4">
                <Label className="text-yellow-400 text-sm font-medium mb-3 block">
                  <Shield className="w-4 h-4 inline mr-2" />
                  Sayfa Yetkileri
                </Label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => setRightsTargetPages([])}
                      size="sm"
                      className={rightsTargetPages.length === 0 ? 
                        "bg-yellow-600 text-black" : 
                        "bg-gray-700 text-yellow-400 hover:bg-yellow-600 hover:text-black"}
                    >
                      Tüm Sayfalar
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setRightsTargetPages(['Dashboard'])}
                      size="sm"  
                      className={JSON.stringify(rightsTargetPages) === JSON.stringify(['Dashboard']) ? 
                        "bg-yellow-600 text-black" : 
                        "bg-gray-700 text-yellow-400 hover:bg-yellow-600 hover:text-black"}
                    >
                      Sadece Ana Sayfa
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto p-2 bg-gray-700 rounded border border-yellow-600/50">
                    {pageOptions.map(page => (
                      <div key={page.value} className="flex items-center space-x-1">
                        <input
                          type="checkbox"
                          id={`page-${page.value}`}
                          checked={rightsTargetPages.includes(page.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRightsTargetPages(prev => [...prev, page.value]);
                            } else {
                              setRightsTargetPages(prev => prev.filter(p => p !== page.value));
                            }
                          }}
                          className="text-yellow-400 focus:ring-yellow-500"
                        />
                        <label htmlFor={`page-${page.value}`} className="text-yellow-400 text-xs cursor-pointer">
                          {page.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <DialogFooter className="border-t border-yellow-600/30 pt-4">
            <div className="flex justify-between w-full">
              <Button 
                variant="outline" 
                onClick={() => setIsGrantDialogOpen(false)} 
                className="border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-black"
              >
                <X className="w-4 h-4 mr-2" />
                İptal
              </Button>
              <Button
                onClick={() => grantAnnouncementRights(selectedUserId)}
                disabled={!selectedUserId || (!rightsCanMakeScrolling && !rightsCanMakePinned)}
                className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-bold border-2 border-yellow-300"
              >
                <Save className="w-4 h-4 mr-2" />
                Hak Ver
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isUserRightsViewOpen} onOpenChange={setIsUserRightsViewOpen}>
        <DialogContent className="bg-gray-900 border-yellow-600 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Duyuru Hakları - Kullanıcı Listesi</span>
              <Badge className="bg-blue-600 text-white">
                {usersWithRights.length} Kullanıcı
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {usersWithRights.length === 0 ? (
              <div className="text-center py-8 text-yellow-600">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Henüz hakları olan kullanıcı yok.</p>
              </div>
            ) : (
              usersWithRights.map((user) => {
                const expiryStatus = getRightsExpiryStatus(user.announcement_rights_expires);
                return (
                  <div key={user.id} className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-4 border border-yellow-600/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full flex items-center justify-center text-black font-bold">
                          {user.profile_picture_url ? (
                            <img src={user.profile_picture_url} alt="" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            user.first_name?.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-yellow-400">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-yellow-600">{user.email}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            <VIPBadge role={user.role === 'admin' ? 'admin' : user.vip_level} size="sm" />
                            <DayBadge level={user.level || 1} size="sm" />
                          </div>
                        </div>
                      </div>

                      <div className="text-right space-y-2">
                        <div className="flex items-center justify-end space-x-3">
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getRightsStatusColor(user)}`}>
                              {user.announcement_rights >= 999999 ? 'Sınırsız' : `${user.announcement_rights || 0} Hak`}
                            </div>
                            <div className={`text-sm ${expiryStatus.color}`}>
                              {expiryStatus.text}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end space-x-1">
                          {user.announcement_rights_scrolling !== false && (
                            <Badge className="bg-blue-600 text-white text-xs">Kayan Yazı</Badge>
                          )}
                          {user.announcement_rights_pinned && (
                            <Badge className="bg-purple-600 text-white text-xs">Sabit Duyuru</Badge>
                          )}
                          {user.announcement_rights_target_pages?.length > 0 && (
                            <Badge className="bg-orange-600 text-white text-xs">
                              {user.announcement_rights_target_pages.length === pageOptions.length ? 'Tüm Sayfalar' :
                               user.announcement_rights_target_pages.map(p => pageOptions.find(opt => opt.value === p)?.label || p).join(', ')}
                            </Badge>
                          )}
                          {(user.announcement_duration_value && user.announcement_duration_value > 0) && (
                            <Badge className="bg-cyan-600 text-white text-xs">
                              {user.announcement_duration_value} {durationUnitMap[user.announcement_duration_unit]}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            onClick={() => extendUserRights(user.id, 5)}
                            size="sm"
                            className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white text-xs px-2 py-1"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            +5 Hak
                          </Button>
                          <Button
                            onClick={() => revokeUserRights(user.id)}
                            size="sm"
                            className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white text-xs px-2 py-1"
                          >
                            <X className="w-3 h-3 mr-1" />
                            İptal Et
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsUserRightsViewOpen(false)}
              className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-black font-bold"
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-yellow-600 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-yellow-400">Duyuruyu Düzenle</DialogTitle>
          </DialogHeader>
          {editingAnnouncement && (
             <div className="space-y-4 py-4">
              {editingAnnouncement.announcement_type === 'pinned' && (
                <div>
                  <Label htmlFor="edit-title" className="text-yellow-400">Başlık</Label>
                  <Input
                    id="edit-title"
                    value={editingAnnouncement.title}
                    onChange={(e) => setEditingAnnouncement({...editingAnnouncement, title: e.target.value})}
                    className="bg-gray-800 border-yellow-600 text-amber-400"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="edit-content" className="text-yellow-400">İçerik</Label>
                <Textarea
                  id="edit-content"
                  value={editingAnnouncement.content}
                  onChange={(e) => setEditingAnnouncement({...editingAnnouncement, content: e.target.value})}
                  className="bg-gray-800 border-yellow-600 text-amber-400"
                  rows={5}
                />
              </div>
              {editingAnnouncement.announcement_type === 'pinned' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-company" className="text-yellow-400">Firma</Label>
                    <Input
                      id="edit-company"
                      value={editingAnnouncement.company || ''}
                      onChange={(e) => setEditingAnnouncement({...editingAnnouncement, company: e.target.value.toUpperCase()})}
                      className="bg-gray-800 border-yellow-600 text-amber-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-plate" className="text-yellow-400">Plaka</Label>
                    <Input
                      id="edit-plate"
                      value={editingAnnouncement.plate || ''}
                      onChange={(e) => setEditingAnnouncement({...editingAnnouncement, plate: e.target.value.toUpperCase()})}
                      className="bg-gray-800 border-yellow-600 text-amber-400"
                    />
                  </div>
                </div>
              )}
              {hasFullAccess() && (
                <div>
                  <Label htmlFor="edit-expires-at" className="text-yellow-400">Bitiş Tarihi</Label>
                  <Input
                    id="edit-expires-at"
                    type="datetime-local"
                    value={editingAnnouncement.expires_at ? format(new Date(editingAnnouncement.expires_at), "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={(e) => setEditingAnnouncement({...editingAnnouncement, expires_at: new Date(e.target.value)})}
                    className="bg-gray-800 border-yellow-600 text-amber-400"
                  />
                </div>
              )}
              {hasFullAccess() && (
                <div>
                  <Label className="text-yellow-400">Yayınlanacak Sayfalar</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 p-3 bg-gray-900 rounded-lg border border-yellow-600">
                    {Object.entries(pages).map(([pageKey, pageName]) => (
                      <div key={pageKey} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-page-${pageKey}`}
                          checked={editingAnnouncement.target_pages?.includes(pageKey)}
                          onCheckedChange={(checked) => {
                            setEditingAnnouncement(prev => ({
                              ...prev,
                              target_pages: checked 
                                ? [...(prev.target_pages || []), pageKey]
                                : (prev.target_pages || []).filter(p => p !== pageKey)
                            }));
                          }}
                          className="border-yellow-600 data-[state=checked]:bg-yellow-600"
                        />
                        <Label htmlFor={`edit-page-${pageKey}`} className="text-sm text-yellow-400 font-normal">{pageName}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
             <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-black">
                  İptal
                </Button>
                <Button onClick={handleUpdateAnnouncement} className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-bold border-2 border-yellow-300">
                  Güncelle
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isUserManagementDialogOpen} onOpenChange={setIsUserManagementDialogOpen}>
        <DialogContent className="bg-gray-900 border-yellow-600 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 flex items-center space-x-2">
              <UserCog className="w-5 h-5" />
              <span>Kullanıcı Hak Detayları</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedUserForManagement && (
            <div className="space-y-6 py-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
                <div className="relative">
                  {selectedUserForManagement.profile_picture_url ? (
                    <img src={selectedUserForManagement.profile_picture_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-yellow-600" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-600 to-yellow-400 flex items-center justify-center text-black font-bold text-xl">
                      {selectedUserForManagement.first_name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-yellow-400">
                    {selectedUserForManagement.first_name} {selectedUserForManagement.last_name}
                  </h3>
                  <p className="text-yellow-600">{selectedUserForManagement.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <VIPBadge role={selectedUserForManagement.role === 'admin' ? 'admin' : selectedUserForManagement.vip_level} />
                    <DayBadge level={selectedUserForManagement.level || 1} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <Label className="text-yellow-400 font-semibold">Kalan Hak</Label>
                  <p className="text-2xl font-bold text-yellow-300 mt-1">
                    {selectedUserForManagement.announcement_rights >= 999999 ? 'Sınırsız' : (selectedUserForManagement.announcement_rights || 0)}
                  </p>
                </div>
                
                <div className="p-4 bg-gray-800 rounded-lg">
                  <Label className="text-yellow-400 font-semibold">Süre Durumu</Label>
                  <p className={`text-lg font-semibold mt-1 ${getRightsExpiryStatus(selectedUserForManagement.announcement_rights_expires).color}`}>
                    {getRightsExpiryStatus(selectedUserForManagement.announcement_rights_expires).text}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <Label className="text-yellow-400 font-semibold">Duyuru Türü Yetkileri</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={`${selectedUserForManagement.announcement_rights_scrolling !== false ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                        {selectedUserForManagement.announcement_rights_scrolling !== false ? '✅' : '❌'}
                      </Badge>
                      <span className="text-yellow-300">Kayan Yazı</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${selectedUserForManagement.announcement_rights_pinned ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                        {selectedUserForManagement.announcement_rights_pinned ? '✅' : '❌'}
                      </Badge>
                      <span className="text-yellow-300">Sabit Duyuru</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-800 rounded-lg">
                  <Label className="text-yellow-400 font-semibold">Duyuru Geçerlilik Süresi</Label>
                  <p className="text-lg font-semibold text-yellow-300 mt-1">
                    {selectedUserForManagement.announcement_duration_value || 0} {durationUnitMap[selectedUserForManagement.announcement_duration_unit]}
                  </p>
                </div>
              </div>

              {selectedUserForManagement.announcement_rights_target_pages?.length > 0 && (
                <div className="p-4 bg-gray-800 rounded-lg">
                  <Label className="text-yellow-400 font-semibold mb-3 block">Hedef Sayfalar</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUserForManagement.announcement_rights_target_pages.map(page => (
                      <Badge key={page} variant="outline" className="border-orange-600 text-orange-400">
                        {pageOptions.find(p => p.value === page)?.label || page}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => {
                    addUserRights(selectedUserForManagement.id, 10);
                    setIsUserManagementDialogOpen(false);
                  }}
                  className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  10 Hak Ekle
                </Button>
                
                <Button
                  onClick={() => {
                    reduceUserRights(selectedUserForManagement.id, 5);
                    setIsUserManagementDialogOpen(false);
                  }}
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
                  disabled={selectedUserForManagement.announcement_rights <= 0}
                >
                  <Minus className="w-4 h-4 mr-2" />
                  5 Hak Azalt
                </Button>

                <Button
                  onClick={() => {
                    revokeUserRights(selectedUserForManagement.id);
                    setIsUserManagementDialogOpen(false);
                  }}
                  className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  Tüm Hakları İptal
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setIsUserManagementDialogOpen(false)}
              variant="outline"
              className="border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-black"
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}