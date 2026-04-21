import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

const INSTALL_KEY = 'ads:install_ts';
const GRACE_PERIOD_MS = 72 * 60 * 60 * 1000; // 72 hours
const INTERSTITIAL_EVERY = 5;

const INTERSTITIAL_ID =
  process.env.NODE_ENV === 'production'
    ? (process.env.ADMOB_INTERSTITIAL_ID ?? TestIds.INTERSTITIAL)
    : TestIds.INTERSTITIAL;

export function useAds() {
  const [adsEnabled, setAdsEnabled] = useState(false);
  const deckSearchCount = useRef(0);
  const interstitial = useRef<InterstitialAd | null>(null);

  useEffect(() => {
    async function init() {
      let installTs = await AsyncStorage.getItem(INSTALL_KEY);
      if (!installTs) {
        installTs = String(Date.now());
        await AsyncStorage.setItem(INSTALL_KEY, installTs);
      }
      const elapsed = Date.now() - Number(installTs);
      setAdsEnabled(elapsed >= GRACE_PERIOD_MS);
    }
    init();
  }, []);

  useEffect(() => {
    if (!adsEnabled) return;
    const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_ID);
    interstitial.current = ad;
    ad.load();
    const unsub = ad.addAdEventListener(AdEventType.CLOSED, () => {
      ad.load();
    });
    return () => {
      unsub();
    };
  }, [adsEnabled]);

  const triggerInterstitial = () => {
    if (!adsEnabled) return;
    deckSearchCount.current += 1;
    if (deckSearchCount.current % INTERSTITIAL_EVERY === 0) {
      interstitial.current?.show().catch(() => {});
    }
  };

  return { showBanner: adsEnabled, triggerInterstitial };
}
