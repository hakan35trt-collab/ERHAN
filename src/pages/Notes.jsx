
import React, { useState, useEffect } from 'react';
import { Note } from '@/entities/Note';
import { User } from '@/entities/User';
import { Notification } from '@/entities/Notification';
import { Log } from '@/entities/Log';
import { NoteRead } from '@/entities/NoteRead';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, FileText, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import NoteForm from '../components/notes/NoteForm';
import NoteCard from '../components/notes/NoteCard';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const notesData = await Note.list('-created_date');
      const allNotes = notesData;
      const allNoteIds = allNotes.map(n => n.id);

      if (allNoteIds.length > 0) {
        const allReads = await NoteRead.filter({ note_id: { '$in': allNoteIds } });
        
        let userMap = new Map();
        try {
          const allUsers = await User.list();
          userMap = new Map(allUsers.map(u => [u.id, u]));
        } catch (userListError) {
          console.warn("Tüm kullanıcılar listelenemedi, okuyan bilgisi kısıtlı olabilir.", userListError);
          if (user) {
            userMap.set(user.id, user);
          }
        }
        
        const readsByNote = allReads.reduce((acc, read) => {
          if (!acc[read.note_id]) {
            acc[read.note_id] = [];
          }
          const readerInfo = userMap.get(read.user_id);
          if (readerInfo) {
            acc[read.note_id].push(readerInfo);
          }
          return acc;
        }, {});

        const notesWithReaders = allNotes.map(note => ({
          ...note,
          readByUsers: readsByNote[note.id] || [],
        }));

        setNotes(notesWithReaders);
      } else {
        setNotes([]);
      }

    } catch (error) {
      console.error("Veri yüklenirken bir hata oluştu:", error);
    }
    setLoading(false);
  };
  
  const canManageNotes = () => {
    if (!currentUser) return false;
    const userDisplayRole = currentUser.role === 'admin' ? 'admin' : currentUser.vip_level;
    return ['admin', 'vip-3', 'vip-2'].includes(userDisplayRole);
  };

  // Yeni fonksiyon: Toplu silme sadece admin ve vip-3 için
  const canBulkManageNotes = () => {
    if (!currentUser) return false;
    const userDisplayRole = currentUser.role === 'admin' ? 'admin' : currentUser.vip_level;
    return ['admin', 'vip-3'].includes(userDisplayRole);
  };

  // Yeni fonksiyon: Belirli bir notu yönetme yetkisi kontrolü
  const canManageSpecificNote = (note) => {
    if (!currentUser || !note) return false;
    const userDisplayRole = currentUser.role === 'admin' ? 'admin' : currentUser.vip_level;
    
    // Admin ve VIP-3 tüm notları yönetebilir
    if (['admin', 'vip-3'].includes(userDisplayRole)) {
      return true;
    }
    
    // VIP-2 sadece kendi notlarını yönetebilir
    if (userDisplayRole === 'vip-2') {
      return note.created_by_id === currentUser.id;
    }
    
    // VIP-1 ve diğerleri not yönetemez
    return false;
  };

  const handleOpenForm = (note = null) => {
    setEditingNote(note);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingNote(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (noteData) => {
    setLoading(true);
    try {
      if (editingNote) {
        if (!canManageSpecificNote(editingNote)) {
          alert("Bu notu düzenleme yetkiniz yok.");
          setLoading(false);
          return;
        }
        const { id, ...updateData } = noteData;
        
        try {
          const oldDetails = `Başlık: ${editingNote.title || 'Yok'}, İçerik: ${editingNote.content}`;
          const newDetails = `Başlık: ${updateData.title || 'Yok'}, İçerik: ${updateData.content}`;
          await Log.create({
              action: "NOT GÜNCELLEME",
              user_name: `${currentUser.first_name} ${currentUser.last_name}`,
              details: `Bir not güncellendi.`,
              old_record_details: oldDetails,
              new_record_details: newDetails
          });
        } catch (logError) {
          console.warn("Log kaydı yapılamadı:", logError);
        }

        await Note.update(id, updateData);
        alert('Not başarıyla güncellendi.');
      } else {
        const newNote = await Note.create(noteData);
        
        try {
          const newDetails = `Başlık: ${noteData.title || 'Yok'}, İçerik: ${noteData.content}`;
          await Log.create({
              action: "YENİ NOT",
              user_name: `${currentUser.first_name} ${currentUser.last_name}`,
              details: "Yeni bir not oluşturuldu.",
              new_record_details: newDetails
          });
        } catch (logError) {
          console.warn("Log kaydı yapılamadı:", logError);
        }

        try {
          const allUsers = await User.list();
          const notifications = allUsers
            .filter(user => user.id !== currentUser.id)
            .map(user => ({
              user_id: user.id,
              type: 'announcement',
              title: `Yeni Not: ${noteData.title || 'Başlıksız'}`,
              content: `${currentUser.first_name} yeni bir not ekledi.`,
              related_id: newNote.id
            }));

          if (notifications.length > 0) {
            await Notification.bulkCreate(notifications);
          }
        } catch (notificationError) {
          console.warn("Bildirimler gönderilemedi:", notificationError);
        }
        
        alert('Not başarıyla eklendi.');
      }
      handleCloseForm();
      loadData();
    } catch (error) {
      console.error("İşlem hatası:", error);
      alert("Not kaydedilirken bir hata oluştu: " + error.message);
    }
    setLoading(false);
  };

  const handleDelete = async (note) => {
    if (!canManageSpecificNote(note)) {
      alert("Bu notu silme yetkiniz yok.");
      return;
    }
    
    if (window.confirm("Bu notu silmek istediğinizden emin misiniz?")) {
      try {
        try {
          const oldDetails = `Başlık: ${note.title || 'Yok'}, İçerik: ${note.content}`;
          await Log.create({
              action: "NOT SİLME",
              user_name: `${currentUser.first_name} ${currentUser.last_name}`,
              details: `"${note.title || 'Başlıksız'}" başlıklı not silindi.`,
              old_record_details: oldDetails
          });
        } catch (logError) {
          console.warn("Log kaydı yapılamadı:", logError);
        }

        await Note.delete(note.id);
        alert('Not başarıyla silindi.');
        loadData();
      } catch (error) {
        console.error("Silme hatası:", error);
        alert("Not silinirken bir hata oluştu: " + error.message);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (!canBulkManageNotes()) {
      alert("Toplu silme yetkisine sahip değilsiniz.");
      return;
    }
    
    if (selectedNotes.length === 0) {
      alert("Lütfen silmek için en az bir not seçin.");
      return;
    }

    if (window.confirm(`${selectedNotes.length} notu silmek istediğinizden emin misiniz?`)) {
      setLoading(true);
      try {
        let deletedCount = 0;
        for (const noteId of selectedNotes) {
          try {
            await Note.delete(noteId);
            deletedCount++;
          } catch (error) {
            console.error(`Not ${noteId} silinemedi:`, error);
          }
        }

        try {
          await Log.create({
              action: "TOPLU NOT SİLME",
              user_name: `${currentUser.first_name} ${currentUser.last_name}`,
              details: `${deletedCount} adet not toplu olarak silindi.`
          });
        } catch (logError) {
          console.warn("Log kaydı yapılamadı:", logError);
        }

        alert(`${deletedCount} not başarıyla silindi.`);
        setSelectedNotes([]);
        setSelectAll(false);
        loadData();
      } catch (error) {
        console.error("Toplu silme hatası:", error);
        alert("Notlar silinirken bir hata oluştu.");
      }
      setLoading(false);
    }
  };

  const toggleNoteSelection = (noteId) => {
    setSelectedNotes(prev => {
      if (prev.includes(noteId)) {
        return prev.filter(id => id !== noteId);
      } else {
        return [...prev, noteId];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedNotes([]);
    } else {
      // Sadece yönetme yetkisi olan notları seç
      const selectableNotes = notes.filter(note => canManageSpecificNote(note)).map(note => note.id);
      setSelectedNotes(selectableNotes);
    }
    setSelectAll(!selectAll);
  };
  
  const handleMarkAsRead = async (noteId) => {
    const noteIndex = notes.findIndex(n => n.id === noteId);
    if (noteIndex !== -1 && currentUser) {
      const updatedNotes = [...notes];
      const noteToUpdate = updatedNotes[noteIndex];
      if (!noteToUpdate.readByUsers.some(u => u.id === currentUser.id)) {
        try {
          await NoteRead.create({
            note_id: noteId,
            user_id: currentUser.id,
            read_at: new Date().toISOString()
          });

          const currentUserInfo = { 
            id: currentUser.id,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            profile_picture_url: currentUser.profile_picture_url
          };
          
          noteToUpdate.readByUsers.push(currentUserInfo); 
          setNotes(updatedNotes);
        } catch (error) {
          console.error("Not okunmuş olarak işaretlenemedi:", error);
          alert("Not okunmuş olarak işaretlenirken bir hata oluştu.");
        }
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div></div>;
  }
  
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-400 flex items-center space-x-3">
            <FileText className="w-8 h-8" />
            <span>Notlar</span>
          </h1>
          <p className="text-amber-600 mt-2">Okunmamış notları okumak için üzerine tıklayın</p>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-wrap">
            {canBulkManageNotes() && notes.length > 0 && (
              <Button
                onClick={toggleSelectAll}
                variant="outline"
                className="border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-black flex-1 md:flex-initial"
              >
                {selectAll ? <CheckSquare className="w-5 h-5 mr-2" /> : <Square className="w-5 h-5 mr-2" />}
                {selectAll ? 'Tümünü Kaldır' : 'Tümünü Seç'}
              </Button>
            )}
            {canManageNotes() && (
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenForm()} className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-bold border-2 border-yellow-300 shadow-lg hover:shadow-xl transition-all duration-200 flex-1 md:flex-initial">
                    <Plus className="w-5 h-5 mr-2" />
                    Yeni Not Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-amber-600">
                  <DialogHeader>
                    <DialogTitle className="text-amber-400">
                      {editingNote ? 'Notu Düzenle' : 'Yeni Not Ekle'}
                    </DialogTitle>
                  </DialogHeader>
                  <NoteForm
                    note={editingNote}
                    currentUser={currentUser}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseForm}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
          {canBulkManageNotes() && selectedNotes.length > 0 && (
            <Button 
              onClick={handleBulkDelete}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold w-full"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Seçilenleri Sil ({selectedNotes.length})
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {notes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            currentUser={currentUser}
            allNotes={notes}
            onEdit={() => handleOpenForm(note)}
            onDelete={() => handleDelete(note)}
            onMarkAsRead={() => handleMarkAsRead(note.id)}
            isSelected={selectedNotes.includes(note.id)}
            onToggleSelect={() => toggleNoteSelection(note.id)}
            canManage={canManageSpecificNote(note)}
            canBulkSelect={canBulkManageNotes()}
          />
        ))}
      </div>
      {notes.length === 0 && (
          <div className="col-span-full text-center py-16 text-yellow-600">
             <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
             <p className="text-lg">Henüz not bulunmuyor.</p>
             <p className="text-sm">Yeni bir not ekleyerek başlayabilirsiniz.</p>
          </div>
      )}
    </div>
  );
}
