import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

const FIRE_STYLE = `
@keyframes fire-rotate {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes fire-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.7; }
}
.pwa-fire-border::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 16px;
  background: conic-gradient(
    from 0deg,
    #ff4500, #ff6a00, #ffae00, #ffd700,
    #ff6a00, #ff4500, #c0392b, #ff4500
  );
  animation: fire-rotate 2.2s linear infinite, fire-pulse 1.5s ease-in-out infinite;
  z-index: -1;
  filter: blur(2px);
}
.pwa-fire-border::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 14px;
  background: conic-gradient(
    from 0deg,
    #ff4500, #ffd700, #ff6a00,
    #ff0000, #ffd700, #ff4500
  );
  animation: fire-rotate 2.2s linear infinite reverse;
  z-index: -1;
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
      <style>{FIRE_STYLE}</style>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed z-[9999]"
          style={{
            bottom: '12px',
            left: '12px',
            right: '12px',
            maxWidth: '360px',
            margin: '0 auto',
          }}
        >
          <div
            className="pwa-fire-border relative rounded-2xl overflow-visible"
            style={{ isolation: 'isolate' }}
          >
            <div className="bg-gray-950 rounded-2xl overflow-hidden border border-orange-800/50">
              {/* Top fire gradient bar */}
              <div className="h-1 bg-gradient-to-r from-red-600 via-orange-400 via-yellow-400 to-red-600 animate-pulse" />

              <div className="p-4 flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <img
                    src="/icons/icon-192.png"
                    alt="ERHAN"
                    className="w-12 h-12 rounded-xl object-cover"
                    style={{ border: '2px solid #ff6a00' }}
                  />
                  {/* Glow under icon */}
                  <div className="absolute inset-0 rounded-xl" style={{ boxShadow: '0 0 12px 3px rgba(255,106,0,0.5)' }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-black text-amber-400 text-sm leading-tight">
                    🔥 ERHAN Uygulamasını Yükle
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">Ana ekrana ekle, uygulama gibi kullan</p>
                  <div className="flex gap-2 mt-2.5">
                    <button
                      onClick={handleInstall}
                      className="flex items-center gap-1 font-black text-xs px-4 py-1.5 rounded-lg transition-all active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, #ff6a00, #ffd700, #ff4500)',
                        color: '#000',
                        boxShadow: '0 2px 12px rgba(255,106,0,0.5)',
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
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
