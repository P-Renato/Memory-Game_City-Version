import { cityByLanguage } from "./db";
import type { cities } from "./types";
import type { Language } from "./utils/languageHelper";

type LanguageKey = keyof cities;

export type AudioCache = {
    [k in LanguageKey]?: {
        [item: string]: HTMLAudioElement;
    }
}

export const audioCache: AudioCache = {};

const availableAudios = [
  'airplane', 'bank', 'bicycle', 'bridge', 'bus', 'car', 'castle', 'house', 'hospital', 'fire-station', 'fountain', 
  'library','playground', 'police-station', 'restaurant', 'school', 'street', 'subway', 'taxi', 'train', 'traffic-light'
];

export function playAudio(cityKey: string, language: Language): void {
    const langKey = language as LanguageKey;
    
    if (!audioCache[langKey]) {
        console.warn(`Audio cache not loaded for language: ${language}`);
        return;
    }
    
    const audio = audioCache[langKey]![cityKey];
    if (audio) {
        const audioClone = audio.cloneNode() as HTMLAudioElement;
        audioClone.currentTime = 0;
        audioClone.volume = 0.7; 
        audioClone.play().catch(error => {
            console.warn('Audio play failed:', error);
        });
        console.log(`🔊 Playing audio: ${cityKey} in ${language}`);
    } else {
        console.warn(`Audio not found for: ${cityKey} in ${language}`);
    }
}

if (typeof window !== 'undefined') {
  (Object.keys(cityByLanguage) as LanguageKey[]).forEach((langKey) => {
    const langData = cityByLanguage[langKey];
    const langCode = langData.code;
    const items = langData.items;

    // console.log(`\n🔤 Processing language: ${langKey} (${langCode})`);
    // console.log("Items:", Object.keys(items));

    audioCache[langKey] = {};

  Object.keys(items).forEach((item) => {
      const normalized = item.replace(/\s+/g, '-');
      const filePath = `/${normalized}_${langCode}.mp3`;
      const inAvailable = availableAudios.includes(item);
      const inAvailableNormalized = availableAudios.includes(normalized);

      // console.log({
      //   item,
      //   normalized,
      //   inAvailable,
      //   inAvailableNormalized,
      //   filePath,
      // });

      if (inAvailable || inAvailableNormalized) {
        const audio = new Audio(filePath);
        audioCache[langKey]![item] = audio;
        // console.log(`✅ Cached: ${filePath}`);
      } else {
        console.warn(`⚠️ Not found in availableAudios: "${item}"`);
      }
    });
  });
}