// ./lib/data.ts

export interface Language {
  code: string;
  name: string;
  popular?: boolean;
}

export interface TranslationDictionary {
  [key: string]: {
    buyVignette: string;
    checkVignette: string;
    vehicleSetup: string;
    validityDuration: string;
    plateDetails: string;
    checkout: string;
    nextStep: string;
    back: string;
    selectMake: string;
    selectModel: string;
    vehicleMtm: string;
    attachTrailer: string;
    trailerMtm: string;
    weekendNote: string;
    phone: string;
    email: string;
  };
}

// Point 3: Most common languages on top, remainder sorted alphabetically
export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'EN', name: 'English', popular: true },
  { code: 'BG', name: 'Български', popular: true },
  { code: 'DE', name: 'Deutsch', popular: true },
  { code: 'TR', name: 'Türkçe', popular: true },
  { code: 'RO', name: 'Română', popular: true },
  { code: 'EL', name: 'Ελληνικά', popular: true },
  { code: 'CS', name: 'Čeština' },
  { code: 'DA', name: 'Dansk' },
  { code: 'ES', name: 'Español' },
  { code: 'FR', name: 'Français' },
  { code: 'HR', name: 'Hrvatski' },
  { code: 'IT', name: 'Italiano' },
  { code: 'HU', name: 'Magyar' },
  { code: 'NL', name: 'Nederlands' },
  { code: 'PL', name: 'Polski' },
  { code: 'SR', name: 'Српски' },
  { code: 'UK', name: 'Українська' },
];

export const TRANSLATIONS: TranslationDictionary = {
  EN: {
    buyVignette: 'Buy e-Vignette',
    checkVignette: 'Check e-Vignette',
    vehicleSetup: 'Vehicle Setup',
    validityDuration: 'Vignette Duration',
    plateDetails: 'Plate & Details',
    checkout: 'Checkout',
    nextStep: 'Next Step',
    back: 'Back',
    selectMake: 'Select Vehicle Make',
    selectModel: 'Select Model',
    vehicleMtm: 'Vehicle MTM (kg)',
    attachTrailer: 'Attaching a Trailer?',
    trailerMtm: 'Trailer MTM (kg)',
    weekendNote: 'Weekend vignette is valid from Friday 12:00 until Sunday 23:59.',
    phone: 'Phone Number',
    email: 'Email Address',
  },
  BG: {
    buyVignette: 'Купи електронна винетка',
    checkVignette: 'Провери винетка',
    vehicleSetup: 'Конфигурация на превозно средство',
    validityDuration: 'Срок на валидност',
    plateDetails: 'Регистрация и данни',
    checkout: 'Плащане',
    nextStep: 'Следваща стъпка',
    back: 'Назад',
    selectMake: 'Изберете марка',
    selectModel: 'Изберете модел',
    vehicleMtm: 'Технически допустима максимална маса (кг)',
    attachTrailer: 'Теглите ли ремарке?',
    trailerMtm: 'Маса на ремаркето (кг)',
    weekendNote: 'Уикенд винетката е валидна от петък 12:00 до неделя 23:59 ч.',
    phone: 'Телефонен номер',
    email: 'Имейл адрес',
  },
};

export const WORLD_COUNTRIES = [
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'SR', name: 'Serbia', flag: '🇷🇸' },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
];

export const POPULAR_VEHICLE_DATABASE = [
  { make: 'Volkswagen', model: 'Golf', estimatedGvwrKg: 1840 },
  { make: 'Volkswagen', model: 'Passat', estimatedGvwrKg: 2050 },
  { make: 'BMW', model: '3 Series', estimatedGvwrKg: 1980 },
  { make: 'BMW', model: '5 Series', estimatedGvwrKg: 2150 },
  { make: 'Audi', model: 'A4', estimatedGvwrKg: 1990 },
  { make: 'Audi', model: 'A6', estimatedGvwrKg: 2180 },
  { make: 'Mercedes-Benz', model: 'C-Class', estimatedGvwrKg: 2010 },
  { make: 'Mercedes-Benz', model: 'E-Class', estimatedGvwrKg: 2220 },
];

export function sanitizeLicensePlate(plate: string): string {
  return plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export function validateLicensePlateFormat(plate: string): { valid: boolean; reason?: string } {
  const clean = sanitizeLicensePlate(plate);
  if (!clean) return { valid: false, reason: 'License plate is required.' };
  if (clean.length < 4 || clean.length > 10) {
    return { valid: false, reason: 'License plate must be between 4 and 10 characters.' };
  }
  return { valid: true };
}