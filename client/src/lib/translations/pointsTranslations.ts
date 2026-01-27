// lib/translations/pointsTranslations.ts
import type { LanguageCode } from './uiTranslations';
import { getPointsPlural } from './pluralRules';

// Main function to get points text with proper pluralization
export function getPointsText(language: LanguageCode, count: number): string {
  return getPointsPlural(language, count);
}

// Function to get full points string (e.g., "5 points")
export function getPointsString(language: LanguageCode, count: number): string {
  const pointsText = getPointsPlural(language, count);
  return `${count} ${pointsText}`;
}

// For backward compatibility - keep points translation in main file but use pluralization
export const pointsBaseTranslations = {
  en: 'points',
  es: 'puntos',
  fr: 'points',
  de: 'Punkte',
  cs: 'bodů', // Default plural form
  pt: 'pontos',
  ja: 'ポイント',
  ar: 'نقاط'
} as const;