import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { InstallGuideModal } from './InstallGuideModal';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already running in standalone mode (already installed), hide the install button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        // If user canceled prompt, do nothing
      }
    } else {
      // Show guided instructions for iOS Safari or manual install
      setShowGuideModal(true);
    }
  };

  if (variant === 'banner') {
    return (
      <>
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm no-print">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 shrink-0 text-emerald-200" />
            <span className="font-medium">
              Gunakan sebagai aplikasi di HP tanpa kuota browser bar!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClick}
              className="bg-white text-emerald-800 hover:bg-emerald-50 px-3 py-1 rounded-lg font-bold text-xs shadow-xs transition shrink-0 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isInstallable ? 'Install App' : 'Cara Install'}</span>
            </button>
          </div>
        </div>

        <InstallGuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
      </>
    );
  }

  return (
    <>
      <button
        id="btn-install-pwa"
        onClick={handleClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/90 transition-all shadow-2xs hover:shadow-xs shrink-0"
        title="Install Aplikasi di Layar Utama HP / Komputer"
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
        <span className="whitespace-nowrap">
          {isInstallable ? 'Install di HP' : isIOS ? 'Install (iOS)' : 'Install di HP'}
        </span>
      </button>

      <InstallGuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
    </>
  );
};
