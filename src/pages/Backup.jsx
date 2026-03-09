import React, { useState, useRef } from 'react';
import { Visitor } from '@/entities/Visitor';
import { FrequentVisitor } from '@/entities/FrequentVisitor';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, Shield, AlertTriangle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function BackupPage() {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const fileInputRef = useRef(null);

    React.useEffect(() => {
        User.me().then(setCurrentUser);
    }, []);

    const handleBackup = async () => {
        setLoading(true);
        try {
            const visitors = await Visitor.list(null, 10000); // Get all visitors
            const frequentVisitors = await FrequentVisitor.list(null, 10000); // Get all frequent visitors

            const backupData = {
                backup_date: new Date().toISOString(),
                visitors,
                frequentVisitors
            };

            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `erhan-ziyaretci-yedek-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Yedekleme sırasında hata:", error);
            alert("Yedekleme sırasında bir hata oluştu.");
        }
        setLoading(false);
    };

    const handleRestore = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!window.confirm("Bu işlem mevcut verilerin üzerine eklenecektir. Temiz bir geri yükleme için önce 'Tüm Verileri Sil' butonunu kullanmanız önerilir. Devam etmek istiyor musunuz?")) {
            return;
        }

        setUploading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const backupData = JSON.parse(e.target.result);

                if (backupData.visitors && Array.isArray(backupData.visitors) && backupData.visitors.length > 0) {
                    await Visitor.bulkCreate(backupData.visitors.map(({ id, created_date, updated_date, ...v }) => v));
                }

                if (backupData.frequentVisitors && Array.isArray(backupData.frequentVisitors) && backupData.frequentVisitors.length > 0) {
                    await FrequentVisitor.bulkCreate(backupData.frequentVisitors.map(({ id, created_date, updated_date, ...fv }) => fv));
                }

                alert("Yedek başarıyla geri yüklendi!");

            } catch (error) {
                console.error("Geri yükleme hatası:", error);
                alert("Geri yükleme sırasında bir hata oluştu. Lütfen yedek dosyasının formatını kontrol edin.");
            } finally {
                setUploading(false);
            }
        };
        reader.readAsText(file);
    };

    const deleteAllVisitors = async () => {
        if (!window.confirm("TÜM ZİYARETÇİ KAYITLARINI SİLMEK istediğinizden emin misiniz? Bu işlem geri alınamaz!")) {
            return;
        }

        if (!window.confirm("BU İŞLEM GERİ ALINAMAZ! Son kez soruyorum, tüm ziyaretçi verilerini silmek istediğinizden emin misiniz?")) {
            return;
        }

        setDeleting(true);
        try {
            const allVisitors = await Visitor.list();
            let deletedCount = 0;
            
            for (const visitor of allVisitors) {
                try {
                    await Visitor.delete(visitor.id);
                    deletedCount++;
                } catch (error) {
                    console.error(`Ziyaretçi ${visitor.id} silinemedi:`, error);
                }
            }
            
            alert(`${deletedCount} ziyaretçi kaydı başarıyla silindi.`);
        } catch (error) {
            console.error("Tüm ziyaretçiler silinirken bir hata oluştu:", error);
            alert("Veriler silinirken bir hata oluştu.");
        }
        setDeleting(false);
    };

    const hasAccess = () => {
        if (!currentUser) return false;
        const userDisplayRole = currentUser.role === 'admin' ? 'admin' : currentUser.vip_level;
        return ['admin', 'vip-3'].includes(userDisplayRole);
    }
    
    if (!hasAccess()) {
        return (
          <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <Card className="bg-gray-800 border-yellow-600 text-center">
              <CardContent className="p-8">
                <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2 text-yellow-400">Yetki Yok</h2>
                <p className="text-yellow-600">Bu sayfaya erişmek için Admin veya VIP-3 yetkisine ihtiyacınız var.</p>
              </CardContent>
            </Card>
          </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                    Yedekleme ve Geri Yükleme
                </h1>
                <p className="text-lg text-yellow-600 mt-2">
                    Verilerinizi yönetin ve güvende tutun.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600 border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-yellow-400">
                            <Download />
                            <span>Veri Yedeği Al</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-yellow-300 mb-4">
                            Tüm ziyaretçi ve sürekli ziyaretçi kayıtlarını içeren bir JSON dosyasını bilgisayarınıza indirin.
                        </p>
                        <Button onClick={handleBackup} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-bold">
                            {loading ? 'Yedekleniyor...' : 'Yedek Oluştur ve İndir'}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600 border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-yellow-400">
                            <Upload />
                            <span>Yedekten Geri Yükle</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-yellow-300 mb-4">
                            Daha önce aldığınız bir JSON yedeğini sisteme yükleyin.
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleRestore}
                            className="hidden"
                            accept=".json"
                        />
                        <Button onClick={() => fileInputRef.current.click()} disabled={uploading} className="w-full bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white font-bold">
                            {uploading ? 'Yükleniyor...' : 'Yedek Dosyası Seç'}
                        </Button>
                        <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg flex items-start space-x-2">
                            <AlertTriangle className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                            <p className="text-xs text-red-300">
                                <strong>Uyarı:</strong> Bu işlem, yedek dosyasındaki verileri mevcut kayıtlara ekler. Temiz bir başlangıç için, yüklemeden önce aşağıdaki 'Tüm Verileri Sil' seçeneğini kullanmanız önerilir.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dangerous Operations Section */}
            <div className="mt-8">
                <Card className="bg-gradient-to-br from-red-900 to-red-800 border-red-600 border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-red-400">
                            <Trash2 />
                            <span>Tehlikeli İşlemler</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-red-950 p-4 rounded-lg border border-red-500 mb-4">
                            <div className="flex items-start space-x-2">
                                <AlertTriangle className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="text-red-300 font-semibold mb-2">Tüm Verileri Sil</h3>
                                    <p className="text-red-200 text-sm mb-3">
                                        Bu işlem tüm ziyaretçi kayıtlarını kalıcı olarak siler. Bu işlem geri alınamaz!
                                    </p>
                                    <Button
                                        onClick={deleteAllVisitors}
                                        disabled={deleting}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        {deleting ? 'Siliniyor...' : 'Tüm Ziyaretçi Verilerini Sil'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}