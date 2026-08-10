// ./lib/data.ts

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  popular?: boolean;
}

export const WORLD_CURRENCIES: CurrencyOption[] = [
  // Popular choices
  { code: 'EUR', name: 'Euro', symbol: '€', popular: true },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', popular: true },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', popular: true },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', popular: true },
  { code: 'GBP', name: 'British Pound', symbol: '£', popular: true },
  { code: 'USD', name: 'US Dollar', symbol: '$', popular: true },
  
  // Alphabetical world list
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'L' },
  { code: 'AMD', name: 'Armenian Dram', symbol: '֏' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼' },
  { code: 'BAM', name: 'Bosnia-Herzegovina Convertible Mark', symbol: 'KM' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'GEL', name: 'Georgian Lari', symbol: '₾' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'MDL', name: 'Moldovan Leu', symbol: 'L' },
  { code: 'MKD', name: 'Macedonian Denar', symbol: 'den' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'din.' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
];

export interface CountryOption {
  code: string;
  name: string;
  popular?: boolean;
}

export const WORLD_COUNTRIES: CountryOption[] = [
  // Top transit origins for Bulgaria
  { code: 'BG', name: 'Bulgaria', popular: true },
  { code: 'TR', name: 'Turkey', popular: true },
  { code: 'RO', name: 'Romania', popular: true },
  { code: 'DE', name: 'Germany', popular: true },
  { code: 'NL', name: 'Netherlands', popular: true },
  { code: 'AT', name: 'Austria', popular: true },
  { code: 'GR', name: 'Greece', popular: true },
  { code: 'GB', name: 'United Kingdom', popular: true },

  // Rest of World (Alphabetical)
  { code: 'AL', name: 'Albania' },
  { code: 'AM', name: 'Armenia' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'GE', name: 'Georgia' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IT', name: 'Italy' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'MD', name: 'Moldova' },
  { code: 'ME', name: 'Montenegro' },
  { code: 'MK', name: 'North Macedonia' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RS', name: 'Serbia' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'UA', name: 'Ukraine' },
];

export interface AutoDockBrand {
  brand: string;
  models: { name: string; gvwrKg: number }[];
}

export const AUTOMOTIVE_DATABASE: AutoDockBrand[] = [
  {
    brand: 'Audi',
    models: [
      { name: 'A3 Sportback', gvwrKg: 1800 },
      { name: 'A4 Avant', gvwrKg: 2100 },
      { name: 'A6 Avant', gvwrKg: 2450 },
      { name: 'Q5 40 TDI', gvwrKg: 2510 },
      { name: 'Q7 50 TDI (Heavy SUV)', gvwrKg: 2980 },
    ],
  },
  {
    brand: 'BMW',
    models: [
      { name: '3 Series Touring', gvwrKg: 2150 },
      { name: '5 Series Touring', gvwrKg: 2420 },
      { name: 'X3 xDrive30d', gvwrKg: 2500 },
      { name: 'X5 xDrive30d', gvwrKg: 2860 },
      { name: 'X7 xDrive40i', gvwrKg: 3220 },
    ],
  },
  {
    brand: 'Ford',
    models: [
      { name: 'Focus Estate', gvwrKg: 1900 },
      { name: 'Transit Custom (Van)', gvwrKg: 3200 },
      { name: 'Ranger Double Cab (Pickup)', gvwrKg: 3270 },
      { name: 'Transit Chassis Cab', gvwrKg: 3500 },
    ],
  },
  {
    brand: 'Mercedes-Benz',
    models: [
      { name: 'C-Class Estate', gvwrKg: 2100 },
      { name: 'E-Class Estate', gvwrKg: 2450 },
      { name: 'GLE SUV', gvwrKg: 3050 },
      { name: 'Sprinter 316 CDI (Van)', gvwrKg: 3500 },
      { name: 'Marco Polo (Motorhome)', gvwrKg: 3100 },
    ],
  },
  {
    brand: 'Volkswagen',
    models: [
      { name: 'Golf Variant', gvwrKg: 1850 },
      { name: 'Passat Variant', gvwrKg: 2150 },
      { name: 'Touareg 3.0 TDI', gvwrKg: 2850 },
      { name: 'Transporter T6.1', gvwrKg: 3000 },
      { name: 'Crafter Panel Van', gvwrKg: 3500 },
      { name: 'Grand California (Motorhome)', gvwrKg: 3500 },
    ],
  },
];

export const BULGARIA_BORDER_CHECKPOINTS = [
  'Kapitan Andreevo (TR)',
  'Lesovo (TR)',
  'Kalotina (RS)',
  'Vrska Cuka (RS)',
  'Ruse - Danube Bridge (RO)',
  'Vidin - Danube Bridge 2 (RO)',
  'Kulata (GR)',
  'Makaza (GR)',
  'Gyueshevo (MK)',
];

export const BULGARIA_DESTINATIONS = [
  'Sofia',
  'Plovdiv',
  'Varna',
  'Burgas',
  'Ruse',
  'Stara Zagora',
  'Pleven',
  'Sliven',
  'Dobrich',
  'Shumen',
  'Targovishte',
  'Pazardzhik',
  'Blagoevgrad',
  'Veliko Tarnovo',
  'Gavrovo',
  'Kardzhali',
];

/**
 * Basic European license plate syntax validation (bgtoll style)
 */
export function validateLicensePlateFormat(plate: string): { valid: boolean; reason?: string } {
  const cleaned = plate.trim().toUpperCase().replace(/[\s\-_]/g, '');
  if (cleaned.length < 3) {
    return { valid: false, reason: 'License plate must contain at least 3 characters.' };
  }
  if (cleaned.length > 12) {
    return { valid: false, reason: 'License plate is too long (maximum 12 characters).' };
  }
  // Standard alphanumeric check (Latin + Cyrillic supported)
  const regex = /^[A-Z0-9А-Я]+$/i;
  if (!regex.test(cleaned)) {
    return { valid: false, reason: 'Plate contains invalid special characters.' };
  }
  return { valid: true };
}