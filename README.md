# Ziyaretçi Yönetim Sistemi

React + Vite tabanlı, GitHub'ı veri tabanı olarak kullanan tam kapsamlı ziyaretçi takip uygulaması. Railway üzerinde çalışır.

---

## Özellikler

- Ziyaretçi giriş / çıkış kaydı
- İçerideki ziyaretçileri anlık görüntüleme
- Çoklu seçim ile toplu çıkış (tek API çağrısıyla hızlı)
- Araç ve yolcu bilgisi takibi
- Ziyaret türü sınıflandırması (Sevkiyat, Çalışma, Görüşme, Servis)
- Ad, firma ve plakaya göre anlık arama
- Rol tabanlı yetkilendirme (Admin, VIP-1, VIP-2, VIP-3)
- Otomatik aylık yedekleme (GitHub'a yedek branch'e)
- Manuel yedek alma
- Log kaydı (tüm işlemler loglanır)
- Duyuru sistemi
- Mesajlaşma
- Sık ziyaretçi listesi
- Vardiya yapılandırması

---

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 18, Vite 6 |
| UI | Tailwind CSS v3, shadcn/ui, Radix UI |
| Animasyon | Framer Motion |
| Veri Depolama | GitHub API (JSON dosyaları, data branch) |
| Barındırma | Railway |
| İkonlar | Lucide React |

---

## Kurulum

### Gereksinimler

- Node.js >= 18
- GitHub Personal Access Token (repo okuma/yazma yetkisi)

### Yerel Geliştirme

```bash
npm install
npm run dev
```

### Ortam Değişkenleri

Railway veya `.env` dosyasına şunları ekleyin:

```
VITE_GITHUB_TOKEN=ghp_xxxxxxxxxxxx
VITE_GITHUB_REPO=kullanici/repo-adi
VITE_DATA_BRANCH=data
```

### Railway Deploy

1. Repoyu Railway'e bağlayın
2. Ortam değişkenlerini ayarlayın
3. Build komutu: `npm run build`
4. Start komutu: `npm run start`

---

## Veri Yapısı

Tüm veriler GitHub repository'sindeki `data` branch'inde JSON dosyaları olarak tutulur:

```
data/
├── visitors.json          # Ziyaretçi kayıtları
├── users.json             # Kullanıcılar
├── logs.json              # İşlem logları
├── announcements.json     # Duyurular
├── messages.json          # Mesajlar
├── shiftConfigurations.json
├── visitTypes.json
├── visitorAlerts.json
└── ...
yedekler/
└── YYYY-MM-Ay-otomatik.json   # Aylık otomatik yedekler
```

---

## Kullanıcı Rolleri

| Rol | Yetki |
|-----|-------|
| admin | Tüm kayıtlar üzerinde tam kontrol |
| vip-3 | Tüm kayıtlar üzerinde tam kontrol |
| vip-2 | Kendi kayıtları tam kontrol, diğerlerinde sadece çıkış |
| vip-1 | Kendi kayıtları tam kontrol, diğerlerinde sadece çıkış |

---

## Varsayılan Admin

- **E-posta:** erhanyaman1938@gmail.com
- **Şifre:** 
