// lib/data.ts

export interface Currency {
  code: string;
  symbol: string;
  rateFromBgn: number;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface VehicleSearchResult {
  make: string;
  model: string;
  estimatedGvwrKg: number;
}

// Point 6: Vignette Pricing in Euros
export const VIGNETTE_PRICES_EUR = {
  '1d': 9.99,
  'weekend': 11.99,
  '1w': 14.99,
  '1m': 24.99,
  '3m': 41.99,
  '1y': 69.99,
};

// Point 3: Priority languages at top, rest alphabetically underneath
export const POPULAR_LANGUAGES: Language[] = [
  { code: 'EN', name: 'English', nativeName: 'English' },
  { code: 'BG', name: 'Bulgarian', nativeName: 'Български' },
  { code: 'DE', name: 'German', nativeName: 'Deutsch' },
  { code: 'TR', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'RO', name: 'Romanian', nativeName: 'Română' },
  { code: 'GR', name: 'Greek', nativeName: 'Ελληνικά' },
];

export const SECONDARY_LANGUAGES: Language[] = [
  { code: 'CS', name: 'Czech', nativeName: 'Čeština' },
  { code: 'FR', name: 'French', nativeName: 'Français' },
  { code: 'HU', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'IT', name: 'Italian', nativeName: 'Italiano' },
  { code: 'NL', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'PL', name: 'Polish', nativeName: 'Polski' },
  { code: 'SK', name: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'UA', name: 'Ukrainian', nativeName: 'Українська' },
].sort((a, b) => a.name.localeCompare(b.name));

export const SUPPORTED_LANGUAGES = [...POPULAR_LANGUAGES, ...SECONDARY_LANGUAGES];

// Currencies
export const WORLD_CURRENCIES: Currency[] = [
  { code: 'EUR', symbol: '€', rateFromBgn: 0.5113 },
  { code: 'BGN', symbol: 'лв', rateFromBgn: 1.0 },
  { code: 'USD', symbol: '$', rateFromBgn: 0.55 },
  { code: 'GBP', symbol: '£', rateFromBgn: 0.43 },
  { code: 'TRY', symbol: '₺', rateFromBgn: 18.2 },
  { code: 'RON', symbol: 'lei', rateFromBgn: 2.54 },
];

// Countries
export const WORLD_COUNTRIES: Country[] = [
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'SRB', name: 'Serbia', flag: '🇷🇸' },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰' },
].sort((a, b) => a.name.localeCompare(b.name));

// Point 5: Clean Vehicle Database (Presets removed)
export const POPULAR_VEHICLE_DATABASE: VehicleSearchResult[] = [
  { make: 'Audi', model: 'A4', estimatedGvwrKg: 1950 },
  { make: 'Audi', model: 'A6', estimatedGvwrKg: 2150 },
  { make: 'BMW', model: '3 Series', estimatedGvwrKg: 1980 },
  { make: 'BMW', model: '5 Series', estimatedGvwrKg: 2190 },
  { make: 'BMW', model: 'X5', estimatedGvwrKg: 2800 },
  { make: 'Mercedes-Benz', model: 'C-Class', estimatedGvwrKg: 2010 },
  { make: 'Mercedes-Benz', model: 'E-Class', estimatedGvwrKg: 2250 },
  { make: 'Mercedes-Benz', model: 'GLE', estimatedGvwrKg: 2950 },
  { make: 'Volkswagen', model: 'Golf', estimatedGvwrKg: 1840 },
  { make: 'Volkswagen', model: 'Passat', estimatedGvwrKg: 2050 },
  { make: 'Volkswagen', model: 'Tiguan', estimatedGvwrKg: 2230 },
  { make: 'Ford', model: 'Focus', estimatedGvwrKg: 1820 },
  { make: 'Ford', model: 'Transit', estimatedGvwrKg: 3300 },
  { make: 'Toyota', model: 'Corolla', estimatedGvwrKg: 1780 },
  { make: 'Toyota', model: 'RAV4', estimatedGvwrKg: 2180 },
];

export function sanitizeLicensePlate(plate: string): string {
  return plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function validateLicensePlateFormat(plate: string): { valid: boolean; reason?: string } {
  const clean = sanitizeLicensePlate(plate);
  if (!clean || clean.length < 4 || clean.length > 10) {
    return { valid: false, reason: 'License plate must be between 4 and 10 characters.' };
  }
  return { valid: true };
}

// Simple translation dictionary for Bulgaria Vignette Online (Point 2)
export const DICTIONARY: Record<string, Record<string, string>> = {
  EN: {
    headerTitle: "Bulgaria Vignette Online",
    subtitle: "Official Instant Bulgarian Vignette",
    step1: "Vehicle Setup",
    step2: "Validity Duration",
    step3: "Plate & Details",
    step4: "Checkout",
    vehicleMake: "Vehicle Make / Brand",
    vehicleModel: "Model Name",
    vehicleMtm: "Vehicle MTM Weight (kg)",
    hasTrailer: "Attaching a Trailer?",
    trailerCountry: "Trailer Registration Country",
    validityCheck: "Validity Check",
    buyNow: "Buy Vignette Now",
  },
  BG: {
    headerTitle: "България Винетка Онлайн",
    subtitle: "Официална Инстантна Българска Винетка",
    step1: "Конфигурация на Превозно Средство",
    step2: "Срок на Валидност",
    step3: "Регистрация и Данни",
    step4: "Плащане",
    vehicleMake: "Марка на Автомобила",
    vehicleModel: "Модел",
    vehicleMtm: "Максимално Допустима Маса (кг)",
    hasTrailer: "Прикачено Ремарке?",
    trailerCountry: "Държава на Регистрация на Ремаркето",
    validityCheck: "Проверка на Валидност",
    buyNow: "Купи Винетка Сега",
  }
};