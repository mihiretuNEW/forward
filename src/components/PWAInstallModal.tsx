import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '../usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already installed, hide or show a subtle installed status
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 3000);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={compact 
          ? "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold tracking-wide transition-all active:scale-95 touch-manipulation"
          : "flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(0,230,118,0.25)] hover:shadow-[0_0_25px_rgba(0,230,118,0.4)] transition-all active:scale-95 touch-manipulation"
        }
        title="Add to Dashboard / Install App"
      >
        {installSuccess ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Installed</span>
          </>
        ) : (
          <>
            <Download className={compact ? "w-3.5 h-3.5 animate-bounce" : "w-4 h-4"} />
            <span>{compact ? "Install" : "Add to Dashboard"}</span>
          </>
        )}
      </button>

      {/* Install Guidance Modal for iOS or manual setup */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#0c0c10] border border-[#22222a] p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-[#777] hover:text-white rounded-full bg-white/5 active:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center p-2.5 shadow-[0_0_15px_rgba(0,230,118,0.3)]">
                <Smartphone className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Install Mre trd</h3>
                <p className="text-xs text-[#888]">ወደ ስልክ ስክሪን ይጫኑ (Add to Dashboard)</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-[#bbb] bg-black/50 p-4 rounded-2xl border border-white/5">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                    <p>
                      Tap Safari's <span className="inline-flex items-center font-semibold text-white bg-white/10 px-1.5 py-0.5 rounded mx-1"><Share2 className="w-3 h-3 inline mr-1" /> Share</span> icon at the bottom of the screen.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                    <p>
                      Scroll down and tap <span className="inline-flex items-center font-semibold text-white bg-white/10 px-1.5 py-0.5 rounded mx-1"><PlusSquare className="w-3 h-3 inline mr-1" /> Add to Home Screen</span>.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                    <p>
                      Tap <strong className="text-emerald-400 font-bold">Add</strong> in the top right. Mre trd will appear on your dashboard!
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                    <p>
                      Tap the Chrome browser menu (three dots <strong className="text-white">⋮</strong> at top right).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                    <p>
                      Select <strong className="text-emerald-400 font-semibold">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                    <p>
                      Open Mre trd anytime directly like a native Android app without browser URL bars!
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-5 w-full rounded-xl bg-white/10 hover:bg-white/15 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const PWAInstallMenuItem: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/[0.04] transition-colors border-t border-white/5"
      >
        <div className="flex items-center gap-2.5">
          <Download className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">Install App (PWA)</span>
        </div>
        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
          Install
        </span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#0c0c10] border border-[#22222a] p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-[#777] hover:text-white rounded-full bg-white/5 active:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center p-2.5 shadow-[0_0_15px_rgba(0,230,118,0.3)]">
                <Smartphone className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Install Mre trd</h3>
                <p className="text-xs text-[#888]">ወደ ስልክ ስክሪን ይጫኑ (Add to Dashboard)</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-[#bbb] bg-black/50 p-4 rounded-2xl border border-white/5">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                    <p>
                      Tap Safari's <span className="inline-flex items-center font-semibold text-white bg-white/10 px-1.5 py-0.5 rounded mx-1"><Share2 className="w-3 h-3 inline mr-1" /> Share</span> icon at the bottom of the screen.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                    <p>
                      Scroll down and tap <span className="inline-flex items-center font-semibold text-white bg-white/10 px-1.5 py-0.5 rounded mx-1"><PlusSquare className="w-3 h-3 inline mr-1" /> Add to Home Screen</span>.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                    <p>
                      Tap <strong className="text-emerald-400 font-bold">Add</strong> in the top right.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                    <p>
                      Tap the Chrome browser menu (three dots <strong className="text-white">⋮</strong> at top right).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                    <p>
                      Select <strong className="text-emerald-400 font-semibold">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-5 w-full rounded-xl bg-white/10 hover:bg-white/15 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
