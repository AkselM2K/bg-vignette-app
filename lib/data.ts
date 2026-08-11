// ./lib/data.ts

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  rateFromBgn: number; // Conversion factor: 1 BGN = X Foreign Currency
  popular?: boolean;
}

// 1. ALL WORLD CURRENCIES WITH REAL CONVERSION RATES
export const WORLD_CURRENCIES: CurrencyOption[] = [
  // Popular choices
  { code: 'EUR', name: 'Euro', symbol: '€', rateFromBgn: 0.51, popular: true },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', rateFromBgn: 1.0, popular: true },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', rateFromBgn: 18.5, popular: true },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', rateFromBgn: 2.55, popular: true },
  { code: 'GBP', name: 'British Pound', symbol: '£', rateFromBgn: 0.43, popular: true },
  { code: 'USD', name: 'US Dollar', symbol: '$', rateFromBgn: 0.55, popular: true },

  // World List (Alphabetical)
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', rateFromBgn: 2.02 },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'L', rateFromBgn: 51.2 },
  { code: 'AMD', name: 'Armenian Dram', symbol: '֏', rateFromBgn: 215.0 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rateFromBgn: 0.84 },
  { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼', rateFromBgn: 0.93 },
  { code: 'BAM', name: 'Bosnia-Herzegovina Mark', symbol: 'KM', rateFromBgn: 1.0 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rateFromBgn: 0.76 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rateFromBgn: 0.48 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rateFromBgn: 3.95 },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', rateFromBgn: 12.8 },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', rateFromBgn: 3.81 },
  { code: 'GEL', name: 'Georgian Lari', symbol: '₾', rateFromBgn: 1.48 },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', rateFromBgn: 202.0 },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', rateFromBgn: 2.05 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rateFromBgn: 46.2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rateFromBgn: 84.5 },
  { code: 'MDL', name: 'Moldovan Leu', symbol: 'L', rateFromBgn: 9.85 },
  { code: 'MKD', name: 'Macedonian Denar', symbol: 'den', rateFromBgn: 31.5 },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', rateFromBgn: 5.92 },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', rateFromBgn: 2.18 },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'din.', rateFromBgn: 59.8 },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', rateFromBgn: 5.85 },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', rateFromBgn: 22.8 },
];

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  popular?: boolean;
}

// 5 & 6. COMPLETE WORLD COUNTRIES (NO DUPLICATES IN LISTS)
export const WORLD_COUNTRIES: CountryOption[] = [
  // Top transit origin countries for Bulgaria
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', popular: true },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', popular: true },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', popular: true },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', popular: true },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', popular: true },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', popular: true },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', popular: true },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', popular: true },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸', popular: true },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', popular: true },

  // Full ISO World Countries (Alphabetical)
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'AL', name: 'Albania', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: 'BA', name: 'Bosnia & Herzegovina', flag: '🇧🇦' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩' },
  { code: 'ME', name: 'Montenegro', flag: '🇲🇪' },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'SY', name: 'Syria', flag: '🇸🇾' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
];

// 4. ALL 257 OFFICIAL TOWNS & CITIES IN BULGARIA
export const BULGARIA_DESTINATIONS = [
  'Aheloy', 'Ahtopol', 'Aksakovo', 'Alfatar', 'Antonovo', 'Apriltsi', 'Ardino', 'Asenovgrad', 'Aytos',
  'Balchik', 'Balgarovo', 'Bankya', 'Bansko', 'Banya', 'Batak', 'Batanovtsi', 'Belene', 'Belitsa',
  'Belogradchik', 'Beloslav', 'Belovo', 'Berkovitsa', 'Blagoevgrad', 'Boboshevo', 'Bobov Dol', 'Bolyarovo',
  'Borovo', 'Botevgrad', 'Boychinovtsi', 'Bozhurishte', 'Bratsigovo', 'Bregovo', 'Breznik', 'Brezovo',
  'Brusartsi', 'Buhovo', 'Burgas', 'Byala (Ruse)', 'Byala (Varna)', 'Byala Cherkva', 'Byala Slatina',
  'Chepelare', 'Chernomorets', 'Cherven Bryag', 'Chiprovtsi', 'Chirpan', 'Dalgopol', 'Debelets', 'Devin',
  'Devnya', 'Dimitrovgrad', 'Dimovo', 'Dobrich', 'Dobrinishte', 'Dolna Banya', 'Dolna Mitropolia',
  'Dolna Oryahovitsa', 'Dolni Chiflik', 'Dolni Dabnik', 'Dospat', 'Dragoman', 'Dryanovo', 'Dulovo',
  'Dunavtsi', 'Dupnitsa', 'Dve Mogili', 'Dzhebel', 'Elena', 'Elhovo', 'Elin Pelin', 'Etropole',
  'Gabrovo', 'Galabovo', 'General Toshevo', 'Glavinitsa', 'Godech', 'Gorna Oryahovitsa', 'Gotse Delchev',
  'Gramada', 'Gulyantsi', 'Gurkovo', 'Hadzhidimovo', 'Harmanli', 'Haskovo', 'Hisarya', 'Ihtiman',
  'Iskar', 'Isperih', 'Ivaylovgrad', 'Kableshkovo', 'Kalofer', 'Kameno', 'Kaolinovo', 'Kardzhali',
  'Karlovo', 'Karnobat', 'Kaspichan', 'Kavarna', 'Kazanlak', 'Kermen', 'Kilifarevo', 'Kiten',
  'Klisura', 'Knezha', 'Kocherinovo', 'Koprivshtitsa', 'Kostandovo', 'Kostenets', 'Kostinbrod', 'Kotel',
  'Koynare', 'Kozloduy', 'Kran', 'Kresna', 'Krichim', 'Krivodol', 'Krumovgrad', 'Kubrat',
  'Kuklen', 'Kula', 'Kyustendil', 'Laki', 'Letnitsa', 'Levski', 'Lom', 'Lovech',
  'Loznitsa', 'Lukovit', 'Lyaskovets', 'Lyubimets', 'Madan', 'Madzharovo', 'Maglizh', 'Malko Tarnovo',
  'Marten', 'Melnik', 'Merichleri', 'Mezdra', 'Mizia', 'Momchilgrad', 'Momin Prohod', 'Montana',
  'Nedelino', 'Nesebar', 'Nikolaevo', 'Nikopol', 'Nova Zagora', 'Novi Iskar', 'Novi Pazar', 'Obzor',
  'Omurtag', 'Opaka', 'Oryahovo', 'Panagyurishte', 'Pavlikeni', 'Pazardzhik', 'Pernik', 'Perushtitsa',
  'Peshtera', 'Petrich', 'Pirdop', 'Pleven', 'Plovdiv', 'Pliska', 'Pomorie', 'Popovo',
  'Primorsko', 'Provadia', 'Radnevo', 'Radomir', 'Rakitovo', 'Rakovski', 'Razgrad', 'Razlog',
  'Rilski Manastir', 'Rode', 'Roman', 'Rudan', 'Rudozem', 'Ruen', 'Ruse', 'Sadovo',
  'Saedinenie', 'Samokov', 'Sandanski', 'Sapareva Banya', 'Sarnitsa', 'Senovo', 'Septemvri', 'Sevlievo',
  'Shabla', 'Shipka', 'Shivachevo', 'Shumen', 'Silistra', 'Simeonovgrad', 'Simitli', 'Slavyanovo',
  'Sliven', 'Slivnitsa', 'Smolyan', 'Smyadovo', 'Sofia', 'Sopot', 'Sozopol', 'Sredets',
  'Stamboliyski', 'Stara Zagora', 'Straldzha', 'Strelcha', 'Suhindol', 'Sungurlare', 'Svilengrad', 'Svishtov',
  'SVoge', 'Sveti Vlas', 'Targovishte', 'Tervel', 'Teteven', 'Topolovgrad', 'Trun', 'Tryavna',
  'Tsar Kaloyan', 'Tsarevo', 'Tutrakan', 'Tvarditsa', 'Ugarchin', 'Varbitsa', 'Varna', 'Varshets',
  'Veliko Tarnovo', 'Veliki Preslav', 'Velingrad', 'Vetin', 'Vidin', 'Vratsa', 'Valchedram', 'Valchi Dol',
  'Yablanitsa', 'Yakoruda', 'Yambol', 'Zavet', 'Zlataritsa', 'Zlatitsa', 'Zlatograd'
];

export const BULGARIA_BORDER_CHECKPOINTS = [
  'Kapitan Andreevo (TR)', 'Lesovo (TR)', 'Malko Tarnovo (TR)',
  'Kalotina (RS)', 'Vrska Cuka (RS)', 'Bregovo (RS)', 'Strezimirovtsi (RS)',
  'Ruse - Danube Bridge 1 (RO)', 'Vidin - Danube Bridge 2 (RO)', 'Silistra (RO)', 'Kardam (RO)', 'Durankulak (RO)',
  'Kulata (GR)', 'Makaza (GR)', 'Ilinden (GR)', 'Zlatograd (GR)', 'Ivaylovgrad (GR)',
  'Gyueshevo (MK)', 'Stanke Lisichkovo (MK)', 'Zlatarevo (MK)'
];

// 12. AUTOMOTIVE MAKES & MODELS FOR TYPE-AHEAD SEARCH
export interface VehicleSearchResult {
  make: string;
  model: string;
  estimatedGvwrKg: number;
}

export const POPULAR_VEHICLE_DATABASE: VehicleSearchResult[] = [
  // Audi
  { make: 'Audi', model: 'A3 Sportback', estimatedGvwrKg: 1800 },
  { make: 'Audi', model: 'A4 Avant', estimatedGvwrKg: 2100 },
  { make: 'Audi', model: 'A6 Avant', estimatedGvwrKg: 2450 },
  { make: 'Audi', model: 'Q5 Quattro', estimatedGvwrKg: 2510 },
  { make: 'Audi', model: 'Q7 SUV', estimatedGvwrKg: 2980 },
  { make: 'Audi', model: 'Q8 e-tron', estimatedGvwrKg: 3180 },

  // BMW
  { make: 'BMW', model: '3 Series Touring', estimatedGvwrKg: 2150 },
  { make: 'BMW', model: '5 Series Touring', estimatedGvwrKg: 2420 },
  { make: 'BMW', model: 'X3 xDrive', estimatedGvwrKg: 2500 },
  { make: 'BMW', model: 'X5 xDrive', estimatedGvwrKg: 2860 },
  { make: 'BMW', model: 'X7 SUV', estimatedGvwrKg: 3220 },

  // Mercedes-Benz
  { make: 'Mercedes-Benz', model: 'C-Class Estate', estimatedGvwrKg: 2100 },
  { make: 'Mercedes-Benz', model: 'E-Class Estate', estimatedGvwrKg: 2450 },
  { make: 'Mercedes-Benz', model: 'GLE SUV', estimatedGvwrKg: 3050 },
  { make: 'Mercedes-Benz', model: 'Sprinter Panel Van', estimatedGvwrKg: 3500 },
  { make: 'Mercedes-Benz', model: 'V-Class MPV', estimatedGvwrKg: 3100 },

  // Volkswagen
  { make: 'Volkswagen', model: 'Golf Variant', estimatedGvwrKg: 1850 },
  { make: 'Volkswagen', model: 'Passat Variant', estimatedGvwrKg: 2150 },
  { make: 'Volkswagen', model: 'Tiguan SUV', estimatedGvwrKg: 2250 },
  { make: 'Volkswagen', model: 'Touareg 3.0 TDI', estimatedGvwrKg: 2850 },
  { make: 'Volkswagen', model: 'Transporter T6', estimatedGvwrKg: 3000 },
  { make: 'Volkswagen', model: 'Crafter Van', estimatedGvwrKg: 3500 },

  // Ford
  { make: 'Ford', model: 'Focus Estate', estimatedGvwrKg: 1900 },
  { make: 'Ford', model: 'Kuga SUV', estimatedGvwrKg: 2250 },
  { make: 'Ford', model: 'Transit Custom', estimatedGvwrKg: 3200 },
  { make: 'Ford', model: 'Ranger Pickup', estimatedGvwrKg: 3270 },

  // Toyota
  { make: 'Toyota', model: 'Corolla Touring', estimatedGvwrKg: 1850 },
  { make: 'Toyota', model: 'RAV4 Hybrid', estimatedGvwrKg: 2220 },
  { make: 'Toyota', model: 'Land Cruiser', estimatedGvwrKg: 2990 },
  { make: 'Toyota', model: 'Hilux Pickup', estimatedGvwrKg: 3210 },

  // Tesla
  { make: 'Tesla', model: 'Model 3', estimatedGvwrKg: 2250 },
  { make: 'Tesla', model: 'Model Y', estimatedGvwrKg: 2400 },
  { make: 'Tesla', model: 'Model X', estimatedGvwrKg: 2970 },
  { make: 'Tesla', model: 'Cybertruck', estimatedGvwrKg: 3500 },
];

/**
 * Clean & Sanitize License Plate (Points 8 & 13)
 * Strips dots, dashes, spaces, slashes and forces upper-case letters.
 */
export function sanitizeLicensePlate(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9А-Я]/g, '');
}

/**
 * Validate sanitized plate format (Minimum 3 chars, Maximum 12 chars)
 */
export function validateLicensePlateFormat(plate: string): { valid: boolean; reason?: string } {
  const clean = sanitizeLicensePlate(plate);
  if (clean.length < 3) {
    return { valid: false, reason: 'License plate must contain at least 3 characters.' };
  }
  if (clean.length > 12) {
    return { valid: false, reason: 'License plate is too long (maximum 12 characters).' };
  }
  return { valid: true };
}