'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { InstallSheet } from './install-sheet';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type Platform = 'ios' | 'android' | 'other';

type InstallContextValue = {
  /** Sudah dibuka dari layar utama (mode aplikasi). */
  installed: boolean;
  platform: Platform;
  /** Perangkat seluler yang bisa diberi panduan pasang. */
  canGuide: boolean;
  /** Buka prompt bawaan (Android) bila ada, selain itu tampilkan panduan manual. */
  install: () => void;
};

const InstallContext = createContext<InstallContextValue>({
  installed: true,
  platform: 'other',
  canGuide: false,
  install: () => {},
});

export const useInstall = () => useContext(InstallContext);

const noopSubscribe = () => () => {};

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  // iPadOS 13+ mengaku sebagai Mac tetapi punya layar sentuh.
  const iPad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || iPad) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

function isStandalone() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

export function InstallProvider({ children }: { children: React.ReactNode }) {
  // Nilai klien saja; di server dianggap "sudah terpasang" agar tidak ada kedipan ajakan.
  const platform = useSyncExternalStore(noopSubscribe, detectPlatform, () => 'other' as Platform);
  const standalone = useSyncExternalStore(noopSubscribe, isStandalone, () => true);
  const [justInstalled, setJustInstalled] = useState(false);
  const installed = standalone || justInstalled;
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setJustInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(() => {
    if (deferred) {
      deferred.prompt().catch(() => setSheetOpen(true));
      deferred.userChoice.finally(() => setDeferred(null));
      return;
    }
    setSheetOpen(true);
  }, [deferred]);

  const value = useMemo<InstallContextValue>(
    () => ({ installed, platform, canGuide: !installed && platform !== 'other', install }),
    [installed, platform, install],
  );

  return (
    <InstallContext.Provider value={value}>
      {children}
      <InstallSheet open={sheetOpen} platform={platform} onClose={() => setSheetOpen(false)} />
    </InstallContext.Provider>
  );
}
