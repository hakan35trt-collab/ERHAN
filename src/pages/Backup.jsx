import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Visitor } from '@/entities/Visitor';
import { FrequentVisitor } from '@/entities/FrequentVisitor';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Download, Upload, Shield, AlertTriangle, Trash2,
  Cloud, CheckCircle, RefreshCw, History, RotateCcw,
  Calendar, Clock, HardDrive, ChevronDown, ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { createManualBackup, ghGet, ghPut, BACKUP_DIR } from '@/lib/githubStore';

const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'hakan35trt-collab/ERHAN';
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const DATA_BRANCH = import.meta.env.VITE_DATA_BRANCH || 'data';

const DATA_ENTITIES = [
  'visitors', 'logs', 'announcements', 'messages', 'notifications',
  'authorizationConfigs', 'frequentVisitors', 'staff', 'shiftConfigurations',
  'directoryConfigs', 'points', 'notes', 'noteReads', 'visitorAlerts',
  'visitTypes', 'badges', 'users',
];

const ENTITY_LABELS = {
  visitors: 'Ziyaretçiler', logs: 'Loglar', announcements: 'Duyurular',
  messages: 'Mesajlar', notifications: 'Bildirimler', authorizationConfigs: 'Yetki Konfigler',
  frequentVisitors: 'Sık Ziyaretçiler', staff: 'Personel', shiftConfigurations: 'Vardiya Ayarları',
  directoryConfigs: 'Rehber Ayarları', points: 'Puanlar', notes: 'Notlar',
  noteReads: 'Not Okunmaları', visitorAlerts: 'Ziyaretçi Uyarıları',
  visitTypes: 'Ziyaret Türleri', badges: 'Rozetler', users: 'Kullanıcılar',
};

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const [backupList, setBackupList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [expandedBackup, setExpandedBackup] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { User.me().then(setCurrentUser); }, []);
  useEffect(() => { loadBackupList(); }, []);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 6000);
  };

  const loadBackupList = useCallback(async () => {
    if (!GITHUB_TOKEN) return;
    setLoadingList(true);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${BACKUP_DIR}?ref=${DATA_BRANCH}&t=${Date.now()}`,
        { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' } }
      );
      if (res.status === 404) { setBackupList([]); return; }
      if (!res.ok) throw new Error('Liste alınamadı');
      const files = await res.json();
      const jsonFiles = files
        .filter(f => f.name.endsWith('.json'))
        .sort((a, b) => b.name.localeCompare(a.name));
      setBackupList(jsonFiles);
    } catch (e) {
      console.warn('Backup list error:', e);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const handleCloudBackup = async () => {
    setLoading(true);
    try {
      const fname = await createManualBackup();
      showMsg(`Yedek alındı: ${fname.split('/').pop()}`);
      await loadBackupList();
    } catch (e) {
      showMsg('Yedek alınamadı: ' + e.message, 'error');
    }
    setLoading(false);
  };

  const handleDownloadLocal = async () => {
    setLoading(true);
    try {
      const backupData = { backup_date: new Date().toISOString(), backup_type: 'local_download' };
      for (const name of DATA_ENTITIES) {
        try { const { content } = await ghGet(`data/${name}.json`); backupData[name] = content || []; }
        catch { backupData[name] = []; }
      }
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `erhan-yedek-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      showMsg('Yedek indirildi.');
    } catch (e) {
      showMsg('İndirme hatası: ' + e.message, 'error');
    }
    setLoading(false);
  };

  const handleRestoreFromGitHub = async (file) => {
    if (!window.confirm(`"${file.name}" yedeği geri yüklensin mi?\n\nMevcut veriler YERİNE bu yedekteki veriler yazılır.`)) return;
    setRestoringId(file.name);
    try {
      const { content: backupData } = await ghGet(`${BACKUP_DIR}/${file.name}`);
      if (!backupData) throw new Error('Yedek içeriği okunamadı');
      for (const name of DATA_ENTITIES) {
        if (backupData[name] && Array.isArray(backupData[name])) {
          await ghPut(`data/${name}.json`, backupData[name], null, `restore: ${file.name}`);
        }
      }
      showMsg(`"${file.name}" başarıyla geri yüklendi!`);
    } catch (e) {
      showMsg('Geri yükleme hatası: ' + e.message, 'error');
    }
    setRestoringId(null);
  };

  const handleDeleteBackup = async (file) => {
    if (!window.confirm(`"${file.name}" yedeği silinsin mi?`)) return;
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${BACKUP_DIR}/${file.name}?ref=${DATA_BRANCH}`,
        { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' } }
      );
      const data = await res.json();
      await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${BACKUP_DIR}/${file.name}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `yedek silindi: ${file.name}`, sha: data.sha, branch: DATA_BRANCH }),
        }
      );
      showMsg(`"${file.name}" silindi.`);
      await loadBackupList();
    } catch (e) {
      showMsg('Silme hatası: ' + e.message, 'error');
    }
  };

  const handleRestoreFromFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!window.confirm('Seçilen dosyadaki veriler geri yüklensin mi?')) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backupData = JSON.parse(e.target.result);
        for (const name of DATA_ENTITIES) {
          if (backupData[name] && Array.isArray(backupData[name])) {
            await ghPut(`data/${name}.json`, backupData[name], null, `restore: local file`);
          }
        }
        showMsg('Yedek başarıyla geri yüklendi!');
      } catch (err) {
        showMsg('Geri yükleme hatası: ' + err.message, 'error');
      }
      setUploading(false);
    };
    reader.readAsText(file);
  };

  const deleteAllVisitors = async () => {
    if (!window.confirm('TÜM ZİYARETÇİ KAYITLARINI SİLMEK istediğinizden emin misiniz?')) return;
    if (!window.confirm('SON KEZ: Bu işlem geri alınamaz!')) return;
    setDeleting(true);
    try {
      await ghPut('data/visitors.json', [], null, 'data: tüm ziyaretçiler silindi');
      showMsg('Tüm ziyaretçi kayıtları silindi.');
    } catch (e) {
      showMsg('Silme hatası: ' + e.message, 'error');
    }
    setDeleting(false);
  };

  const formatFileName = (name) => {
    // 2026-03-Mart-09-18-30.json → 09 Mart 2026, 18:30
    const m = name.replace('.json', '').match(/^(\d{4})-(\d{2})-(\w+)-(\d{2})-(\d{2})-(\d{2})(-\w+)?$/);
    if (!m) return name;
    const [, year, , month, day, hour, min, type] = m;
    return { date: `${day} ${month} ${year}`, time: `${hour}:${min}`, type: type === '-manuel' ? 'Manuel' : 'Otomatik' };
  };

  const hasAccess = () => {
    if (!currentUser) return false;
    return currentUser.role === 'admin' || currentUser.vip_level === 'vip-3';
  };

  if (!hasAccess()) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <Card className="bg-gray-800 border-yellow-600 text-center">
          <CardContent className="p-8">
            <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-yellow-400">Yetki Yok</h2>
            <p className="text-yellow-600">Bu sayfaya erişmek için Admin veya VIP-3 yetkisi gereklidir.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
          Yedekleme ve Geri Yükleme
        </h1>
        <p className="text-yellow-600 mt-1">Tüm veriler GitHub deposunda saklanır — deploy, server veya cihaz değişse de veri kaybolmaz.</p>
      </div>

      {msg.text && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium ${msg.type === 'error' ? 'bg-red-900/40 border-red-600 text-red-400' : 'bg-green-900/40 border-green-600 text-green-400'}`}>
          {msg.type === 'error' ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 flex-shrink-0" />}
          {msg.text}
        </div>
      )}

      {/* TOP ROW — take backup + restore from file */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GitHub backup */}
        <Card className="bg-gray-900 border-2 border-yellow-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-yellow-400 flex items-center gap-2 text-base">
              <Cloud className="w-5 h-5" /> GitHub'a Yedek Al
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-yellow-700 text-sm">Manuel yedek <code className="text-yellow-500">yedekler/</code> klasörüne kaydedilir. Otomatik yedek her ay alınır.</p>
            <Button onClick={handleCloudBackup} disabled={loading} className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-black font-bold">
              <Cloud className="w-4 h-4 mr-2" />
              {loading ? 'Yedekleniyor...' : 'Manuel Yedek Al'}
            </Button>
            <Button onClick={handleDownloadLocal} disabled={loading} variant="outline" className="w-full border-yellow-700 text-yellow-400 hover:bg-yellow-900/20 text-sm">
              <Download className="w-3.5 h-3.5 mr-2" /> JSON Olarak İndir (PC)
            </Button>
          </CardContent>
        </Card>

        {/* Restore from file */}
        <Card className="bg-gray-900 border-2 border-yellow-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-yellow-400 flex items-center gap-2 text-base">
              <Upload className="w-5 h-5" /> Dosyadan Geri Yükle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-yellow-700 text-sm">Bilgisayarınızdaki bir JSON yedek dosyasını seçin. Veriler GitHub'a yazılır.</p>
            <input type="file" ref={fileInputRef} onChange={handleRestoreFromFile} className="hidden" accept=".json" />
            <Button onClick={() => fileInputRef.current.click()} disabled={uploading} className="w-full bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white font-bold">
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Yükleniyor...' : 'Yedek Dosyası Seç'}
            </Button>
            <div className="flex items-start gap-2 bg-yellow-950/40 border border-yellow-800 rounded p-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-700 text-xs">Seçilen dosyadaki veriler mevcut verilerin YERİNE yazılır.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BACKUP LIST */}
      <Card className="bg-gray-900 border-2 border-yellow-600">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-yellow-400 flex items-center gap-2 text-base">
              <History className="w-5 h-5" /> Yedek Listesi (GitHub → yedekler/)
            </CardTitle>
            <Button onClick={loadBackupList} disabled={loadingList} variant="ghost" size="sm" className="text-yellow-600 hover:text-yellow-400">
              <RefreshCw className={`w-4 h-4 ${loadingList ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : backupList.length === 0 ? (
            <div className="text-center py-8 text-yellow-700">
              <HardDrive className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Henüz yedek yok. İlk yedeği almak için "Manuel Yedek Al" butonuna basın.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {backupList.map((file) => {
                const parsed = formatFileName(file.name);
                const isExpanded = expandedBackup === file.name;
                return (
                  <div key={file.name} className="bg-gray-800 border border-yellow-800 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 p-3">
                      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-yellow-900/50 flex items-center justify-center">
                        {parsed.type === 'Manuel' ? <Cloud className="w-4 h-4 text-yellow-400" /> : <Calendar className="w-4 h-4 text-yellow-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-300 text-sm font-medium">
                            {typeof parsed === 'object' ? `${parsed.date} — ${parsed.time}` : file.name}
                          </span>
                          {typeof parsed === 'object' && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${parsed.type === 'Manuel' ? 'bg-yellow-900 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>
                              {parsed.type}
                            </span>
                          )}
                        </div>
                        <p className="text-yellow-700 text-xs mt-0.5 truncate">{file.name}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleRestoreFromGitHub(file)}
                          disabled={restoringId === file.name}
                          className="bg-green-800 hover:bg-green-700 text-white text-xs px-2 py-1 h-7"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          {restoringId === file.name ? 'Yükleniyor...' : 'Geri Yükle'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setExpandedBackup(isExpanded ? null : file.name)}
                          variant="ghost"
                          className="text-yellow-700 hover:text-yellow-400 h-7 w-7 p-0"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDeleteBackup(file)}
                          variant="ghost"
                          className="text-red-700 hover:text-red-400 h-7 w-7 p-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-yellow-900 px-4 py-3">
                        <BackupDetails filename={file.name} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DANGER ZONE */}
      <Card className="bg-red-950/40 border-2 border-red-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-red-400 flex items-center gap-2 text-base">
            <Trash2 className="w-5 h-5" /> Tehlikeli İşlemler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-400 text-sm mb-3">Tüm ziyaretçi kayıtlarını siler. Bu işlem geri alınamaz!</p>
          <Button onClick={deleteAllVisitors} disabled={deleting} className="bg-red-700 hover:bg-red-600 text-white font-bold">
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? 'Siliniyor...' : 'Tüm Ziyaretçi Verilerini Sil'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function BackupDetails({ filename }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ghGet(`${BACKUP_DIR}/${filename}`).then(({ content }) => {
      setData(content);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filename]);

  if (loading) return <p className="text-yellow-700 text-xs">Yükleniyor...</p>;
  if (!data) return <p className="text-red-400 text-xs">İçerik okunamadı.</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {Object.entries(ENTITY_LABELS).map(([key, label]) => {
        const count = Array.isArray(data[key]) ? data[key].length : 0;
        if (count === 0) return null;
        return (
          <div key={key} className="bg-gray-700 rounded px-3 py-1.5 flex items-center justify-between">
            <span className="text-yellow-600 text-xs">{label}</span>
            <span className="text-yellow-400 font-bold text-xs">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
