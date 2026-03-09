import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check dismissed flag
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    if (dismissed) return;

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
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setShowBanner(false);
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_install_dismissed', '1');
  };

  if (isInstalled || !showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 80 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm"
      >
        <div className="bg-gray-900 border-2 border-yellow-500 rounded-2xl shadow-2xl shadow-yellow-900/40 overflow-hidden">
          {/* Fire glow top border */}
          <div className="h-1 bg-gradient-to-r from-orange-600 via-yellow-400 to-orange-600" />

          <div className="p-4 flex items-center gap-4">
            <div className="flex-shrink-0">
              <img
                src="/icons/icon-192.png"
                alt="ERHAN"
                className="w-14 h-14 rounded-xl border-2 border-yellow-500 object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-yellow-400 text-base leading-tight">
                ERHAN Uygulamasını Yükle
              </p>
              <p className="text-gray-400 text-xs mt-0.5 leading-tight">
                Ana ekrana ekle, uygulama gibi kullan
              </p>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-bold text-xs px-4 py-1.5 rounded-lg transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Yükle
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex items-center gap-1 border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-400 text-xs px-3 py-1.5 rounded-lg transition-all"
                >
                  Daha sonra
                </button>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
