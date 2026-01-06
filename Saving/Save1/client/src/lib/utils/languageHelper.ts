import { cityByLanguage } from "../db";

export type Language = keyof typeof cityByLanguage;

export const AVAILABLE_LANGUAGES: Language[] = Object.keys(cityByLanguage) as Language[];

export const LANGUAGE_DISPLAY_NAMES: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  cs: 'Čeština',
  de: 'Deutsch',
  ja: '日本語',
  ar: 'العربية',
};

// Type guard to check if a string is a valid Language
export const isValidLanguage = (lang: string): lang is Language => {
  return AVAILABLE_LANGUAGES.includes(lang as Language);
};

export const DEFAULT_LANGUAGE: Language = AVAILABLE_LANGUAGES[0] || 'en';

// Get language display name
export const getLanguageDisplayName = (lang: Language): string => {
  return LANGUAGE_DISPLAY_NAMES[lang] || lang.toUpperCase();
};

export const LANGUAGE_FLAGS: Record<Language, string> = {
  en: '🇬🇧', 
  es: '🇪🇸', 
  fr: '🇫🇷', 
  pt: '🇧🇷', 
  cs: '🇨🇿', 
  de: '🇩🇪', 
  ja: '🇯🇵', 
  ar: '🇸🇦', 
};

// Get language with flag for display
export const getLanguageWithFlag = (lang: Language): string => {
  return `${LANGUAGE_FLAGS[lang]} ${getLanguageDisplayName(lang)}`;
};

// Get flag only
export const getLanguageFlag = (lang: Language): string => {
  return LANGUAGE_FLAGS[lang];
};