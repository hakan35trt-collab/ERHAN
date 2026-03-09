import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

const GLOW_STYLE = `
@keyframes pwa-glow {
  0%, 100% { box-shadow: 0 0 10px 2px rgba(245,158,11,0.5), 0 0 24px 4px rgba(251,146,60,0.25); }
  50%       { box-shadow: 0 0 18px 4px rgba(245,158,11,0.8), 0 0 36px 8px rgba(251,146,60,0.4); }
}
.pwa-glow-card {
  animation: pwa-glow 2.5s ease-in-out infinite;
}
`;

export default function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setShowBanner(false);
    setInstallPrompt(null);
  };

  const handleDismiss = () => setShowBanner(false);

  if (isInstalled || !showBanner) return null;

  return (
    <>
      <style>{GLOW_STYLE}</style>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed z-[9999]"
          style={{ bottom: '16px', left: '12px', right: '12px', maxWidth: '400px', margin: '0 auto' }}
        >
          <div
            className="pwa-glow-card rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
              border: '2px solid rgba(245,158,11,0.7)',
            }}
          >
            {/* Top gradient bar */}
            <div style={{ height: '3px', background: 'linear-gradient(90deg, #f59e0b, #fb923c, #fbbf24, #f59e0b)' }} />

            <div className="p-4 flex items-center gap-3">
              <div className="flex-shrink-0 relative">
                <img
                  src="/icons/icon-192.png"
                  alt="ERHAN"
                  className="w-13 h-13 rounded-xl object-cover"
                  style={{ width: 52, height: 52, border: '2px solid rgba(245,158,11,0.6)' }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-black text-amber-400 text-sm leading-tight">ERHAN Uygulamasını Yükle</p>
                <p className="text-gray-500 text-xs mt-0.5">Ana ekrana ekle, uygulama gibi kullan</p>
                <div className="flex gap-2 mt-2.5">
                  <button
                    onClick={handleInstall}
                    className="flex items-center gap-1.5 font-bold text-xs px-4 py-1.5 rounded-lg transition-all active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                      color: '#000',
                    }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Yükle
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="border border-gray-700 text-gray-400 hover:text-gray-200 text-xs px-3 py-1.5 rounded-lg transition-all"
                  >
                    Sonra
                  </button>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="text-gray-600 hover:text-gray-300 p-1 flex-shrink-0 self-start"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
