
import React, { useState, useEffect, useRef } from "react";
import { Points } from "@/entities/Points";
import { User } from "@/entities/User";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Image, Upload, Trash2, Save, Plus, X, ZoomIn, ZoomOut, RotateCcw, RotateCw, Maximize } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function PointsPage() {
  const [points, setPoints] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  const [newPoint, setNewPoint] = useState({ title: '', description: '', image_url: '' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      const pointsData = await Points.list('-created_date');
      setPoints(pointsData);
    } catch (error) {
      console.error("Veri yüklenemedi:", error);
    }
    setLoading(false);
  };

  const hasUploadPermission = () => {
    if (!currentUser) return false;
    const userDisplayRole = currentUser.role === 'admin' ? 'admin' : currentUser.vip_level;
    return ['admin', 'vip-3'].includes(userDisplayRole);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploading(true);
      try {
        const { file_url } = await UploadFile({ file });
        setNewPoint(prev => ({ ...prev, image_url: file_url }));
      } catch (error) {
        console.error("Resim yüklenemedi:", error);
        alert("Resim yüklenirken bir hata oluştu.");
      }
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!newPoint.title || !newPoint.image_url) {
      alert("Lütfen başlık ve resim alanlarını doldurun.");
      return;
    }
    setLoading(true);
    try {
      await Points.create({
        ...newPoint,
        created_by_name: `${currentUser.first_name} ${currentUser.last_name}`,
        created_by_id: currentUser.id
      });
      setIsFormOpen(false);
      setNewPoint({ title: '', description: '', image_url: '' });
      loadData();
    } catch (error) {
      console.error("Puantaj kaydedilemedi:", error);
    }
    setLoading(false);
  };
  
  const handleDelete = async (pointId) => {
    if(window.confirm("Bu puantajı silmek istediğinizden emin misiniz?")) {
      try {
        await Points.delete(pointId);
        loadData();
      } catch (error) {
        console.error("Puantaj silinemedi:", error);
      }
    }
  };

  const openImageViewer = (point) => {
    setSelectedImage(point);
    setZoom(1);
    setRotation(0); // Reset rotation before opening
    setIsImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setSelectedImage(null);
    setIsImageViewerOpen(false);
    setZoom(1);
    setRotation(0);
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  const rotateLeft = () => {
    setRotation(prev => prev - 90);
  };

  const rotateRight = () => {
    setRotation(prev => prev + 90);
  };

  const resetRotation = () => {
    setRotation(0);
  };

  const autoRotateForLandscape = () => {
    // Auto-rotate to landscape orientation (90 degrees) for better viewing
    setRotation(90);
  };

  const fitToScreen = () => {
    setZoom(1);
    setRotation(0);
  };

  if (loading && points.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            Puantaj Yönetimi
          </h1>
          <p className="text-lg text-yellow-600 mt-2">
            Puantaj cetvellerini ve ilgili görselleri yönetin.
          </p>
        </div>
        {hasUploadPermission() && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold hover:from-yellow-500 hover:to-yellow-300">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Puantaj Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-yellow-600">
              <DialogHeader>
                <DialogTitle className="text-yellow-400">Yeni Puantaj Kaydı</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-yellow-400">Başlık</Label>
                  <Input 
                    value={newPoint.title}
                    onChange={(e) => setNewPoint(prev => ({...prev, title: e.target.value}))}
                    className="bg-gray-800 border-yellow-600 text-yellow-400"
                    placeholder="Puantaj başlığı..."
                  />
                </div>
                <div>
                  <Label className="text-yellow-400">Açıklama</Label>
                  <Textarea
                    value={newPoint.description}
                    onChange={(e) => setNewPoint(prev => ({...prev, description: e.target.value}))}
                    className="bg-gray-800 border-yellow-600 text-yellow-400"
                    placeholder="İsteğe bağlı açıklama..."
                  />
                </div>
                <div>
                  <Label className="text-yellow-400">Resim</Label>
                  <div 
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-yellow-600 border-dashed rounded-md cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="space-y-1 text-center">
                      {newPoint.image_url ? (
                        <img src={newPoint.image_url} alt="Önizleme" className="mx-auto h-24 w-auto rounded-md"/>
                      ) : (
                        <Image className="mx-auto h-12 w-12 text-yellow-500" />
                      )}
                      <div className="flex text-sm text-yellow-600">
                        <p className="pl-1">
                          {uploading ? "Yükleniyor..." : "Resim yüklemek için tıklayın veya sürükleyip bırakın"}
                        </p>
                      </div>
                      <p className="text-xs text-yellow-700">PNG, JPG, GIF</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
                <Button onClick={handleSave} disabled={loading || uploading} className="w-full bg-yellow-600 hover:bg-yellow-700 text-black">
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {points.map(point => (
          <Card key={point.id} className="bg-gray-800 border-yellow-600 overflow-hidden group">
            <CardHeader className="p-0 relative">
              <img 
                src={point.image_url} 
                alt={point.title} 
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110 cursor-pointer" 
                onClick={() => openImageViewer(point)}
              />
              {hasUploadPermission() && (
                <Button 
                  onClick={() => handleDelete(point.id)}
                  size="icon" 
                  variant="destructive" 
                  className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="text-lg text-yellow-400 truncate">{point.title}</CardTitle>
              <p className="text-sm text-yellow-600 mt-1 truncate">{point.description}</p>
              <div className="text-xs text-gray-400 mt-2">
                <p>Oluşturan: {point.created_by_name}</p>
                <p>Tarih: {format(new Date(point.created_date), 'dd/MM/yyyy HH:mm')}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {points.length === 0 && !loading && (
        <div className="text-center py-20 text-yellow-600 col-span-full">
          <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Henüz puantaj kaydı bulunmuyor.</p>
        </div>
      )}

      {/* Enhanced Full Screen Image Viewer with Auto-Rotate */}
      <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
        <DialogContent className="bg-black border-none max-w-full max-h-full p-0 m-0 w-screen h-screen">
          <DialogHeader className="absolute top-4 left-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-yellow-400 text-lg font-bold">
                {selectedImage?.title}
              </DialogTitle>
              <div className="flex items-center space-x-2">
                <Button onClick={zoomOut} size="sm" variant="outline" className="border-yellow-600 text-yellow-400 bg-black/50 backdrop-blur-sm">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-yellow-400 text-sm bg-black/50 backdrop-blur-sm px-3 py-2 rounded font-mono">
                  {Math.round(zoom * 100)}%
                </span>
                <Button onClick={zoomIn} size="sm" variant="outline" className="border-yellow-600 text-yellow-400 bg-black/50 backdrop-blur-sm">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button onClick={resetZoom} size="sm" variant="outline" className="border-yellow-600 text-yellow-400 bg-black/50 backdrop-blur-sm">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-yellow-600/30"></div>
                <Button onClick={rotateLeft} size="sm" variant="outline" className="border-blue-600 text-blue-400 bg-black/50 backdrop-blur-sm">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button onClick={rotateRight} size="sm" variant="outline" className="border-blue-600 text-blue-400 bg-black/50 backdrop-blur-sm">
                  <RotateCw className="w-4 h-4" />
                </Button>
                <Button onClick={autoRotateForLandscape} size="sm" variant="outline" className="border-green-600 text-green-400 bg-black/50 backdrop-blur-sm">
                  <Maximize className="w-4 h-4" />
                </Button>
                <Button onClick={fitToScreen} size="sm" variant="outline" className="border-purple-600 text-purple-400 bg-black/50 backdrop-blur-sm">
                  <Maximize className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-red-600/30"></div>
                <Button onClick={closeImageViewer} size="sm" variant="outline" className="border-red-600 text-red-400 bg-black/50 backdrop-blur-sm">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex items-center justify-center w-full h-full overflow-hidden bg-black">
            {selectedImage && (
              <img
                src={selectedImage.image_url}
                alt={selectedImage.title}
                className="transition-all duration-300 object-contain"
                style={{ 
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  cursor: zoom > 1 ? 'grab' : 'default',
                  maxWidth: rotation % 180 === 0 ? '100vw' : '100vh',
                  maxHeight: rotation % 180 === 0 ? '100vh' : '100vw',
                  width: 'auto',
                  height: 'auto'
                }}
                draggable={false}
                onLoad={(e) => {
                  const { naturalWidth, naturalHeight } = e.target;
                  // If the image is taller than it is wide (likely a sideways puantaj), auto-rotate it.
                  if (naturalHeight > naturalWidth) {
                    setRotation(90);
                  }
                }}
              />
            )}
          </div>
          
          {selectedImage?.description && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm p-4 rounded-lg">
              <p className="text-yellow-300 text-center font-medium">{selectedImage.description}</p>
            </div>
          )}
          
          {/* Quick Action Tips */}
          <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-xs text-gray-300">
            <div className="space-y-1">
              <p>🔍 <strong>Yakınlaştır/Uzaklaştır:</strong> + - butonları</p>
              <p>🔄 <strong>Döndür:</strong> Sol/Sağ döndürme butonları</p>
              <p>📐 <strong>Otomatik Yan Çevir:</strong> Yeşil buton</p>
              <p>📏 <strong>Ekrana Sığdır:</strong> Mor buton</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
