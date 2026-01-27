// lib/translations/pluralRules.ts
import type { LanguageCode } from './uiTranslations';

export interface PluralRules {
  singular: string;
  plural: string;
  specialForms?: {
    few?: string;    // 2-4, 3-10, etc.
    many?: string;   // 5+, etc.
    dual?: string;   // 2 (Arabic, some others)
  };
}

// Define plural rules for each language
export const pointPlurals: Record<LanguageCode, PluralRules> = {
  en: {
    singular: 'point',
    plural: 'points'
  },
  es: {
    singular: 'punto',
    plural: 'puntos'
  },
  fr: {
    singular: 'point',
    plural: 'points'
  },
  de: {
    singular: 'Punkt',
    plural: 'Punkte'
  },
  cs: {
    singular: 'bod',
    plural: 'bodů',
    specialForms: {
      few: 'body'  // 2-4
    }
  },
  pt: {
    singular: 'ponto',
    plural: 'pontos'
  },
  ja: {
    singular: 'ポイント',
    plural: 'ポイント'  // Japanese doesn't have plural forms
  },
  ar: {
    singular: 'نقطة',
    plural: 'نقاط',
    specialForms: {
      dual: 'نقطتان',  // 2
      few: 'نقاط'      // 3-10
      // Arabic has 6 forms, but we'll simplify for points
    }
  }
};

// Get the correct plural form for a given count
export function getPointsPlural(
  language: LanguageCode,
  count: number
): string {
  const rules = pointPlurals[language];
  
  // Special language rules
  switch (language) {
    case 'cs': // Czech
      if (count === 1) return rules.singular;
      if (count >= 2 && count <= 4) return rules.specialForms?.few || rules.plural;
      return rules.plural;
    
    case 'ar': // Arabic (simplified)
      if (count === 1) return rules.singular;
      if (count === 2) return rules.specialForms?.dual || rules.plural;
      if (count >= 3 && count <= 10) return rules.specialForms?.few || rules.plural;
      return rules.plural;
    
    // case 'pl': // Polish
    //   if (count === 1) return rules.singular;
    //   const lastDigit = count % 10;
    //   const lastTwoDigits = count % 100;
    //   if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits >= 20)) {
    //     return rules.specialForms?.few || rules.plural;
    //   }
    //   return rules.plural;
    
    // case 'ru': // Russian
    //   if (count === 1) return rules.singular;
    //   const ruLastDigit = count % 10;
    //   const ruLastTwoDigits = count % 100;
    //   if (ruLastDigit >= 2 && ruLastDigit <= 4 && (ruLastTwoDigits < 10 || ruLastTwoDigits >= 20)) {
    //     return rules.specialForms?.few || rules.plural;
    //   }
      return rules.plural;
    
    // Default: simple singular/plural
    default:
      return count === 1 ? rules.singular : rules.plural;
  }
}