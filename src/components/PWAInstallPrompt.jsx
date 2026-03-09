import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

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

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (isInstalled || !showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-1.5rem)] max-w-xs"
      >
        <div className="bg-gray-900 border border-yellow-600 rounded-xl shadow-xl overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-orange-600 via-yellow-400 to-orange-600" />
          <div className="p-3 flex items-center gap-3">
            <img
              src="/icons/icon-192.png"
              alt="ERHAN"
              className="w-10 h-10 rounded-lg border border-yellow-600 object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-yellow-400 text-sm leading-tight">ERHAN Uygulamasını Yükle</p>
              <p className="text-gray-500 text-xs mt-0.5">Ana ekrana ekle, uygulama gibi kullan</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-bold text-xs px-3 py-1 rounded-md transition-all"
                >
                  <Download className="w-3 h-3" />
                  Yükle
                </button>
                <button
                  onClick={handleDismiss}
                  className="border border-gray-600 text-gray-400 hover:text-gray-200 text-xs px-2 py-1 rounded-md transition-all"
                >
                  Sonra
                </button>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-gray-600 hover:text-gray-300 p-1 flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
