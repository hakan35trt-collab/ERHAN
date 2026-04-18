import React, { useState, useEffect } from 'react';
import { githubAuth, updateGithubToken, getActiveTokenInfo } from '@/lib/githubStore';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import { Crown, Mail, Lock, User, Eye, EyeOff, ShieldAlert, Key, Save } from 'lucide-react';

export default function Login({ onGoToAuthorization }) {
  const { loginUser } = useAuth();
  const [mode, setMode] = useState('checking'); // checking | setup | login | notfound
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Token yönetimi — 401 hatası alınınca giriş sayfasında gösterilir
  const [showTokenPanel, setShowTokenPanel] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [tokenSaving, setTokenSaving] = useState(false);
  // PIN koruması — sadece yönetici token değiştirebilir
  const [pinInput, setPinInput] = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [pinError, setPinError] = useState('');

  const TOKEN_PIN_KEY = 'token_protect_pin';
  const DEFAULT_PIN = '1938';

  const handleVerifyPin = () => {
    const savedPin = localStorage.getItem(TOKEN_PIN_KEY) || DEFAULT_PIN;
    if (pinInput === savedPin) {
      setPinVerified(true);
      setPinError('');
    } else {
      setPinError('Yönetici kodu yanlış.');
    }
  };

  // Setup fields
  const [setupData, setSetupData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password2: '',
  });

  useEffect(() => {
    // seedDefaultAdmin() runs in main.jsx so there's always at least one user
    setMode('login');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const found = await githubAuth.findByEmailAsync(email);
      if (!found) {
        setMode('notfound');
        setLoading(false);
        return;
      }

      const user = await githubAuth.login(email, password);
      if (!user) {
        setError('Şifre yanlış. Lütfen tekrar deneyin.');
        setLoading(false);
        return;
      }

      loginUser(user);
    } catch (err) {
      console.error('Giriş hatası:', err);
      const msg = err.message || String(err);
      if (msg.includes('401')) {
        setShowTokenPanel(true);
        setPinVerified(false);
        setPinInput('');
        setPinError('');
        setError('GitHub token geçersiz veya süresi dolmuş. Yönetici kodu ile token güncelleyebilirsiniz.');
      } else {
        setError('Hata: ' + msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToken = () => {
    if (!tokenInput.trim() || tokenInput.trim().length < 20) {
      setError('Geçerli bir token giriniz (en az 20 karakter).');
      return;
    }
    setTokenSaving(true);
    const ok = updateGithubToken(tokenInput.trim());
    setTokenSaving(false);
    if (ok) {
      setShowTokenPanel(false);
      setTokenInput('');
      setError('Token kaydedildi. Şimdi giriş yapabilirsiniz.');
    } else {
      setError('Token kaydedilemedi, formatı kontrol edin.');
    }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    setError('');

    if (!setupData.first_name || !setupData.last_name) {
      setError('Ad ve soyad zorunludur.');
      return;
    }
    if (!setupData.email) {
      setError('E-posta zorunludur.');
      return;
    }
    if (!setupData.password || setupData.password.length < 4) {
      setError('Şifre en az 4 karakter olmalıdır.');
      return;
    }
    if (setupData.password !== setupData.password2) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);
    const admin = localAuth.setupAdmin({
      first_name: setupData.first_name.toUpperCase(),
      last_name: setupData.last_name.toUpperCase(),
      email: setupData.email.toLowerCase(),
      password: setupData.password,
    });

    if (!admin) {
      setError('Kurulum başarısız. Sayfayı yenileyin.');
      setLoading(false);
      return;
    }

    loginUser(admin);
    setLoading(false);
  };

  if (mode === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-3 mb-3">
            <Crown className="w-12 h-12 text-yellow-400" />
            <span className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              ERHAN
            </span>
          </div>
          <p className="text-yellow-600 text-sm">Ziyaretçi Yönetim Sistemi</p>
        </div>

        {/* ─── FIRST TIME SETUP ─── */}
        {mode === 'setup' && (
          <div className="bg-gray-900 border-2 border-yellow-600 rounded-xl p-8 shadow-2xl">
            <div className="flex items-center space-x-2 mb-6">
              <Crown className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold text-yellow-400">İlk Kurulum</h2>
            </div>
            <p className="text-yellow-600 text-sm mb-6">
              Sisteme ilk kez girildi. Admin hesabınızı oluşturun.
            </p>
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-yellow-400 text-sm font-medium block mb-1">Ad</label>
                  <input
                    type="text"
                    value={setupData.first_name}
                    onChange={e => setSetupData(p => ({ ...p, first_name: e.target.value }))}
                    placeholder="ERHAN"
                    className="w-full bg-gray-800 border border-yellow-600 text-yellow-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-yellow-400 text-sm font-medium block mb-1">Soyad</label>
                  <input
                    type="text"
                    value={setupData.last_name}
                    onChange={e => setSetupData(p => ({ ...p, last_name: e.target.value }))}
                    placeholder="SOYADINIZ"
                    className="w-full bg-gray-800 border border-yellow-600 text-yellow-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-600"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-yellow-400 text-sm font-medium block mb-1">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-yellow-600" />
                  <input
                    type="email"
                    value={setupData.email}
                    onChange={e => setSetupData(p => ({ ...p, email: e.target.value }))}
                    placeholder="admin@firma.com"
                    className="w-full bg-gray-800 border border-yellow-600 text-yellow-400 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-600"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-yellow-400 text-sm font-medium block mb-1">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-yellow-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={setupData.password}
                    onChange={e => setSetupData(p => ({ ...p, password: e.target.value }))}
                    placeholder="En az 4 karakter"
                    className="w-full bg-gray-800 border border-yellow-600 text-yellow-400 rounded-lg pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-600"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-2.5 text-yellow-600 hover:text-yellow-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-yellow-400 text-sm font-medium block mb-1">Şifre Tekrar</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-yellow-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={setupData.password2}
                    onChange={e => setSetupData(p => ({ ...p, password2: e.target.value }))}
                    placeholder="Şifreyi tekrar girin"
                    className="w-full bg-gray-800 border border-yellow-600 text-yellow-400 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-600"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-600 text-red-400 text-sm px-4 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-bold py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Oluşturuluyor...' : 'Admin Hesabı Oluştur'}
              </button>
            </form>
          </div>
        )}

        {/* ─── NORMAL LOGIN ─── */}
        {mode === 'login' && (
          <div className="bg-gray-900 border-2 border-yellow-600 rounded-xl p-8 shadow-2xl">
            <div className="flex items-center space-x-2 mb-6">
              <User className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold text-yellow-400">Giriş Yap</h2>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-yellow-400 text-sm font-medium block mb-1">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-yellow-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ornek@firma.com"
                    className="w-full bg-gray-800 border border-yellow-600 text-yellow-400 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-600"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="text-yellow-400 text-sm font-medium block mb-1">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-yellow-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Şifreniz"
                    className="w-full bg-gray-800 border border-yellow-600 text-yellow-400 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-600"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-2.5 text-yellow-600 hover:text-yellow-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className={`border text-sm px-4 py-2 rounded-lg ${error.startsWith('Token kaydedildi') ? 'bg-green-900/50 border-green-600 text-green-400' : 'bg-red-900/50 border-red-600 text-red-400'}`}>
                  {error}
                </div>
              )}

              {/* Token paneli — PIN doğrulaması ile korumalı */}
              {showTokenPanel && (
                <div className="bg-gray-800/80 border border-amber-600/60 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-400 text-sm font-semibold">
                      {pinVerified ? 'GitHub Token Güncelle' : 'Yönetici Doğrulaması'}
                    </span>
                  </div>

                  {!pinVerified ? (
                    /* PIN giriş ekranı */
                    <div className="space-y-2">
                      <p className="text-amber-700 text-xs">Bu işlem yalnızca yöneticiye aittir. Yönetici kodunu girin.</p>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-amber-600" />
                        <input
                          type="password"
                          value={pinInput}
                          onChange={e => { setPinInput(e.target.value); setPinError(''); }}
                          placeholder="Yönetici kodu"
                          className="w-full bg-gray-900 border border-amber-600 text-amber-400 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-600"
                          onKeyDown={e => e.key === 'Enter' && handleVerifyPin()}
                          autoFocus
                        />
                      </div>
                      {pinError && <p className="text-red-400 text-xs">{pinError}</p>}
                      <button
                        type="button"
                        onClick={handleVerifyPin}
                        disabled={!pinInput}
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold py-2 rounded-lg text-sm disabled:opacity-50"
                      >
                        Doğrula
                      </button>
                    </div>
                  ) : (
                    /* Token giriş ekranı — PIN doğrulandıktan sonra */
                    <div className="space-y-2">
                      <p className="text-amber-700 text-xs">
                        GitHub Settings &gt; Developer settings &gt; Personal access tokens &gt; <strong>repo</strong> yetkisi ile oluşturun.
                      </p>
                      <div className="relative">
                        <Key className="absolute left-3 top-2.5 w-4 h-4 text-amber-600" />
                        <input
                          type={showToken ? 'text' : 'password'}
                          value={tokenInput}
                          onChange={e => setTokenInput(e.target.value)}
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                          className="w-full bg-gray-900 border border-amber-600 text-amber-400 rounded-lg pl-10 pr-10 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-600"
                          onKeyDown={e => e.key === 'Enter' && handleSaveToken()}
                          autoFocus
                        />
                        <button type="button" onClick={() => setShowToken(p => !p)} className="absolute right-3 top-2.5 text-amber-600 hover:text-amber-400">
                          {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveToken}
                        disabled={tokenSaving || !tokenInput.trim()}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-2 rounded-lg text-sm disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 inline mr-2" />
                        {tokenSaving ? 'Kaydediliyor...' : 'Token Kaydet — Tüm Uygulamaya Uygula'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-bold py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </button>

              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={() => setMode('notfound')}
                  className="text-yellow-600 hover:text-yellow-400 text-xs underline"
                >
                  Hesabım yok / Yetki almak istiyorum
                </button>
                <button
                  type="button"
                  onClick={() => { setShowTokenPanel(p => !p); setError(''); setPinVerified(false); setPinInput(''); setPinError(''); }}
                  className="text-amber-700 hover:text-amber-500 text-xs underline"
                >
                  {showTokenPanel ? 'Token panelini kapat' : 'Token güncelle'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── NOT FOUND / NO ACCOUNT ─── */}
        {mode === 'notfound' && (
          <div className="bg-gray-900 border-2 border-yellow-600 rounded-xl p-8 shadow-2xl text-center">
            <ShieldAlert className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-yellow-400 mb-2">Hesabınız Bulunamadı</h2>
            <p className="text-yellow-600 text-sm mb-6">
              Bu e-posta ile kayıtlı bir hesap yok.<br />
              VIP Yetki Alma sayfasından yöneticiye talepte bulunabilirsiniz.
            </p>
            <button
              onClick={onGoToAuthorization}
              className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-bold py-3 rounded-lg transition-all duration-200 mb-3"
            >
              <Crown className="w-5 h-5 inline mr-2" />
              VIP Yetki Alma Sayfasına Git
            </button>
            <button
              onClick={() => setMode('login')}
              className="w-full border border-yellow-600 text-yellow-400 hover:bg-yellow-900/30 py-2.5 rounded-lg text-sm transition-all duration-200"
            >
              Geri Dön
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
