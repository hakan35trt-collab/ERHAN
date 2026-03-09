import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addHours, addDays, addYears, format } from 'date-fns';
import { UploadFile } from '@/integrations/Core';
import { Image as ImageIcon, X } from 'lucide-react';

export default function NoteForm({ note, currentUser, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: ''
  });
  const [expiryOption, setExpiryOption] = useState('permanent');
  const [customExpiry, setCustomExpiry] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"));
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title || '',
        content: note.content || '',
        image_url: note.image_url || ''
      });
      setExpiryOption('custom');
      setCustomExpiry(format(new Date(note.expires_at), "yyyy-MM-dd'T'HH:mm"));
    } else {
      setFormData({ title: '', content: '', image_url: '' });
      setExpiryOption('permanent');
      setCustomExpiry(format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"));
    }
  }, [note]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploading(true);
      try {
        const { file_url } = await UploadFile({ file });
        setFormData(prev => ({ ...prev, image_url: file_url }));
      } catch (error) {
        console.error("Resim yüklenemedi:", error);
        alert("Resim yüklenirken bir hata oluştu.");
      }
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.content) {
      alert("Not içeriği boş olamaz.");
      return;
    }

    let expires_at;
    const now = new Date();

    switch (expiryOption) {
      case '1h':
        expires_at = addHours(now, 1);
        break;
      case '12h':
        expires_at = addHours(now, 12);
        break;
      case '24h':
        expires_at = addHours(now, 24);
        break;
      case '7d':
        expires_at = addDays(now, 7);
        break;
      case 'permanent':
        expires_at = addYears(now, 100);
        break;
      case 'custom':
        expires_at = new Date(customExpiry);
        break;
      default:
        expires_at = addYears(now, 100);
    }
    
    const finalData = {
      ...formData,
      expires_at: expires_at.toISOString(),
      ...(note ? { id: note.id } : {
        created_by_name: `${currentUser.first_name} ${currentUser.last_name}`,
        created_by_id: currentUser.id,
      })
    };
    onSubmit(finalData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-yellow-400">
      <div>
        <Label htmlFor="title">Başlık (Opsiyonel)</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="bg-gray-800 border-amber-600"
        />
      </div>
      
      <div>
        <Label htmlFor="content">İçerik *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="bg-gray-800 border-amber-600 h-32"
          required
        />
      </div>

      <div>
        <Label className="text-yellow-400">Resim (Opsiyonel)</Label>
        {!formData.image_url ? (
          <div 
            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-yellow-600 border-dashed rounded-md cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="space-y-1 text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-yellow-500" />
              <div className="flex text-sm text-yellow-600">
                <p className="pl-1">
                  {uploading ? "Yükleniyor..." : "Resim yüklemek için tıklayın"}
                </p>
              </div>
              <p className="text-xs text-yellow-700">PNG, JPG, GIF</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <img src={formData.image_url} alt="Önizleme" className="w-full h-48 object-cover rounded-md"/>
            <Button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 w-8 h-8 p-0 bg-red-600 hover:bg-red-700 text-white rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
      </div>

      <div>
        <Label htmlFor="expiry">Sona Erme Tarihi</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={expiryOption} onValueChange={setExpiryOption}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-amber-600">
              <SelectValue placeholder="Süre seçin..." />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-amber-600 text-yellow-400">
              <SelectItem value="permanent">Kalıcı</SelectItem>
              <SelectItem value="1h">1 Saat Sonra</SelectItem>
              <SelectItem value="12h">12 Saat Sonra</SelectItem>
              <SelectItem value="24h">24 Saat Sonra</SelectItem>
              <SelectItem value="7d">7 Gün Sonra</SelectItem>
              <SelectItem value="custom">Özel Tarih</SelectItem>
            </SelectContent>
          </Select>
          {expiryOption === 'custom' && (
            <Input
              type="datetime-local"
              value={customExpiry}
              onChange={(e) => setCustomExpiry(e.target.value)}
              className="bg-gray-800 border-amber-600 flex-1"
            />
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" onClick={onCancel} variant="outline" className="border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-black">
          İptal
        </Button>
        <Button type="submit" disabled={uploading} className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-bold">
          {uploading ? 'Yükleniyor...' : note ? 'Güncelle' : 'Kaydet'}
        </Button>
      </div>
    </form>
  );
}