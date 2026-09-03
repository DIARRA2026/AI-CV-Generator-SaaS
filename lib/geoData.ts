/**
 * Base de données géographique mondiale & villes par pays pour MonCV.ai
 */

export interface CountryInfo {
  name: string;
  code: string;
  flag: string;
  dialCode: string;
  popular?: boolean;
}

export const POPULAR_COUNTRIES: CountryInfo[] = [
  { name: "Côte d'Ivoire", code: "CI", flag: "🇨🇮", dialCode: "+225", popular: true },
  { name: "Sénégal", code: "SN", flag: "🇸🇳", dialCode: "+221", popular: true },
  { name: "Burkina Faso", code: "BF", flag: "🇧🇫", dialCode: "+226", popular: true },
  { name: "Cameroun", code: "CM", flag: "🇨🇲", dialCode: "+237", popular: true },
  { name: "Mali", code: "ML", flag: "🇲🇱", dialCode: "+223", popular: true },
  { name: "Guinée", code: "GN", flag: "🇬🇳", dialCode: "+224", popular: true },
  { name: "Bénin", code: "BJ", flag: "🇧🇯", dialCode: "+229", popular: true },
  { name: "Togo", code: "TG", flag: "🇹🇬", dialCode: "+228", popular: true },
  { name: "Gabon", code: "GA", flag: "🇬🇦", dialCode: "+241", popular: true },
  { name: "Congo (RDC)", code: "CD", flag: "🇨🇩", dialCode: "+243", popular: true },
  { name: "Congo (Brazzaville)", code: "CG", flag: "🇨🇬", dialCode: "+242", popular: true },
  { name: "Niger", code: "NE", flag: "🇳🇪", dialCode: "+227", popular: true },
  { name: "Tchad", code: "TD", flag: "🇹🇩", dialCode: "+235", popular: true },
  { name: "France", code: "FR", flag: "🇫🇷", dialCode: "+33", popular: true },
  { name: "Canada", code: "CA", flag: "🇨🇦", dialCode: "+1", popular: true },
  { name: "Belgique", code: "BE", flag: "🇧🇪", dialCode: "+32", popular: true },
  { name: "Suisse", code: "CH", flag: "🇨🇭", dialCode: "+41", popular: true },
  { name: "Maroc", code: "MA", flag: "🇲🇦", dialCode: "+212", popular: true },
  { name: "Tunisie", code: "TN", flag: "🇹🇳", dialCode: "+216", popular: true },
  { name: "Algérie", code: "DZ", flag: "🇩🇿", dialCode: "+213", popular: true },
];

export const ALL_WORLD_COUNTRIES: CountryInfo[] = [
  ...POPULAR_COUNTRIES,
  { name: "Afrique du Sud", code: "ZA", flag: "🇿🇦", dialCode: "+27" },
  { name: "Allemagne", code: "DE", flag: "🇩🇪", dialCode: "+49" },
  { name: "Angola", code: "AO", flag: "🇦🇴", dialCode: "+244" },
  { name: "Arabie Saoudite", code: "SA", flag: "🇸🇦", dialCode: "+966" },
  { name: "Australie", code: "AU", flag: "🇦🇺", dialCode: "+61" },
  { name: "Autriche", code: "AT", flag: "🇦🇹", dialCode: "+43" },
  { name: "Brésil", code: "BR", flag: "🇧🇷", dialCode: "+55" },
  { name: "Burundi", code: "BI", flag: "🇧🇮", dialCode: "+257" },
  { name: "Cap-Vert", code: "CV", flag: "🇨🇻", dialCode: "+238" },
  { name: "Chine", code: "CN", flag: "🇨🇳", dialCode: "+86" },
  { name: "Comores", code: "KM", flag: "🇰🇲", dialCode: "+269" },
  { name: "Danemark", code: "DK", flag: "🇩🇰", dialCode: "+45" },
  { name: "Djibouti", code: "DJ", flag: "🇩🇯", dialCode: "+253" },
  { name: "Égypte", code: "EG", flag: "🇪🇬", dialCode: "+20" },
  { name: "Émirats Arabes Unis", code: "AE", flag: "🇦🇪", dialCode: "+971" },
  { name: "Espagne", code: "ES", flag: "🇪🇸", dialCode: "+34" },
  { name: "États-Unis", code: "US", flag: "🇺🇸", dialCode: "+1" },
  { name: "Éthiopie", code: "ET", flag: "🇪🇹", dialCode: "+251" },
  { name: "Finlande", code: "FI", flag: "🇫🇮", dialCode: "+358" },
  { name: "Gambie", code: "GM", flag: "🇬🇲", dialCode: "+220" },
  { name: "Ghana", code: "GH", flag: "🇬🇭", dialCode: "+233" },
  { name: "Guinée équatoriale", code: "GQ", flag: "🇬🇶", dialCode: "+240" },
  { name: "Guinée-Bissau", code: "GW", flag: "🇬🇼", dialCode: "+245" },
  { name: "Haïti", code: "HT", flag: "🇭🇹", dialCode: "+509" },
  { name: "Inde", code: "IN", flag: "🇮🇳", dialCode: "+91" },
  { name: "Irlande", code: "IE", flag: "🇮🇪", dialCode: "+353" },
  { name: "Italie", code: "IT", flag: "🇮🇹", dialCode: "+39" },
  { name: "Japon", code: "JP", flag: "🇯🇵", dialCode: "+81" },
  { name: "Kenya", code: "KE", flag: "🇰🇪", dialCode: "+254" },
  { name: "Liban", code: "LB", flag: "🇱🇧", dialCode: "+961" },
  { name: "Liberia", code: "LR", flag: "🇱🇷", dialCode: "+231" },
  { name: "Luxembourg", code: "LU", flag: "🇱🇺", dialCode: "+352" },
  { name: "Madagascar", code: "MG", flag: "🇲🇬", dialCode: "+261" },
  { name: "Maurice", code: "MU", flag: "🇲🇺", dialCode: "+230" },
  { name: "Mauritanie", code: "MR", flag: "🇲🇷", dialCode: "+222" },
  { name: "Monaco", code: "MC", flag: "🇲🇨", dialCode: "+377" },
  { name: "Mozambique", code: "MZ", flag: "🇲🇿", dialCode: "+258" },
  { name: "Nigéria", code: "NG", flag: "🇳🇬", dialCode: "+234" },
  { name: "Norvège", code: "NO", flag: "🇳🇴", dialCode: "+47" },
  { name: "Pays-Bas", code: "NL", flag: "🇳🇱", dialCode: "+31" },
  { name: "Portugal", code: "PT", flag: "🇵🇹", dialCode: "+351" },
  { name: "Qatar", code: "QA", flag: "🇶🇦", dialCode: "+974" },
  { name: "Centrafrique", code: "CF", flag: "🇨🇫", dialCode: "+236" },
  { name: "Royaume-Uni", code: "GB", flag: "🇬🇧", dialCode: "+44" },
  { name: "Russie", code: "RU", flag: "🇷🇺", dialCode: "+7" },
  { name: "Rwanda", code: "RW", flag: "🇷🇼", dialCode: "+250" },
  { name: "Sao Tomé-et-Principe", code: "ST", flag: "🇸🇹", dialCode: "+239" },
  { name: "Seychelles", code: "SC", flag: "🇸🇨", dialCode: "+248" },
  { name: "Sierra Leone", code: "SL", flag: "🇸🇱", dialCode: "+232" },
  { name: "Suède", code: "SE", flag: "🇸🇪", dialCode: "+46" },
  { name: "Tanzanie", code: "TZ", flag: "🇹🇿", dialCode: "+255" },
  { name: "Turquie", code: "TR", flag: "🇹🇷", dialCode: "+90" },
  { name: "Zambie", code: "ZM", flag: "🇿🇲", dialCode: "+260" },
  { name: "Zimbabwe", code: "ZW", flag: "🇿🇼", dialCode: "+263" },
];

// Dictionnaire des principales villes et communes par pays
export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  "Côte d'Ivoire": [
    "Abidjan", "Cocody", "Yopougon", "Plateau", "Marcory", "Koumassi",
    "Treichville", "Port-Bouët", "Abobo", "Adjamé", "Attécoubé", "Bingerville",
    "Grand-Bassam", "Bouaké", "Yamoussoukro", "San-Pédro", "Korhogo", "Daloa",
    "Man", "Gagnoa", "Divo", "Abengourou", "Soubré", "Agboville", "Dabou"
  ],
  "Sénégal": [
    "Dakar", "Plateau", "Almadies", "Pikine", "Guédiawaye", "Rufisque",
    "Thiès", "Touba", "Mbour", "Saint-Louis", "Ziguinchor", "Kaolack",
    "Kolda", "Tambacounda", "Louga", "Fatick", "Saly"
  ],
  "Burkina Faso": [
    "Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Ouahigouya", "Banfora",
    "Dédougou", "Kaya", "Tenkodogo", "Fada N'Gourma", "Dori", "Gaoua"
  ],
  "Cameroun": [
    "Douala", "Yaoundé", "Bafoussam", "Garoua", "Maroua", "Bamenda",
    "Ngaoundéré", "Kribi", "Limbe", "Buea", "Bertoua", "Ebolowa", "Dschang"
  ],
  "Mali": [
    "Bamako", "Sikasso", "Mopti", "Koutiala", "Kayes", "Ségou",
    "Gao", "Koulikoro", "Tombouctou", "San", "Kati"
  ],
  "Guinée": [
    "Conakry", "Kaloum", "Dixinn", "Ratoma", "Matam", "Matoto",
    "Nzérékoré", "Kankan", "Kindia", "Labé", "Mamou", "Boké", "Faranah"
  ],
  "Bénin": [
    "Cotonou", "Porto-Novo", "Abomey-Calavi", "Parakou", "Djougou",
    "Bohicon", "Ouidah", "Natitingou", "Kandi", "Lokossa"
  ],
  "Togo": [
    "Lomé", "Sokodé", "Kara", "Kpalimé", "Atakpamé", "Dapaong",
    "Tsévié", "Aného", "Notsé", "Bassar"
  ],
  "Gabon": [
    "Libreville", "Port-Gentil", "Franceville", "Oyem", "Moanda",
    "Mouila", "Lambaréné", "Tchibanga", "Makokou", "Koulamoutou"
  ],
  "Congo (RDC)": [
    "Kinshasa", "Gombe", "Lubumbashi", "Goma", "Bukavu", "Kisangani",
    "Kananga", "Mbuji-Mayi", "Matadi", "Kolwezi", "Likasi", "Kikwit"
  ],
  "Congo (Brazzaville)": [
    "Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi", "Ouesso",
    "Owando", "Madingou", "Gamboma", "Impfondo"
  ],
  "Niger": [
    "Niamey", "Maradi", "Zinder", "Tahoua", "Agadez",
    "Dosso", "Diffa", "Tillabéri", "Arlit"
  ],
  "Tchad": [
    "N'Djamena", "Moundou", "Sarh", "Abéché", "Kélo",
    "Am Timan", "Bongor", "Pala", "Mongo"
  ],
  "France": [
    "Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Lille",
    "Nantes", "Strasbourg", "Rennes", "Montpellier", "Nice", "Grenoble",
    "Rouen", "Toulon", "Angers", "Dijon"
  ],
  "Canada": [
    "Montréal", "Québec", "Toronto", "Ottawa", "Vancouver", "Calgary",
    "Edmonton", "Winnipeg", "Halifax", "Laval", "Gatineau", "Longueuil"
  ],
  "Belgique": [
    "Bruxelles", "Liège", "Anvers", "Gand", "Charleroi", "Namur",
    "Mons", "Bruges", "Louvain", "Tournai", "Verviers"
  ],
  "Suisse": [
    "Genève", "Lausanne", "Zurich", "Bâle", "Berne", "Fribourg",
    "Neuchâtel", "Sion", "Lugano", "Lucerne", "Yverdon-les-Bains"
  ],
  "Maroc": [
    "Casablanca", "Rabat", "Marrakech", "Tanger", "Fès", "Agadir",
    "Meknès", "Oujda", "Kénitra", "Tétouan", "Salé"
  ],
  "Tunisie": [
    "Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gabès",
    "Ariana", "La Marsa", "Monastir", "Nabeul"
  ],
  "Algérie": [
    "Alger", "Oran", "Constantine", "Annaba", "Blida", "Sétif",
    "Batna", "Tlemcen", "Béjaïa", "Tizi Ouzou"
  ],
  "États-Unis": [
    "New York", "Los Angeles", "Chicago", "Houston", "Miami",
    "Atlanta", "Washington D.C.", "San Francisco", "Dallas", "Boston", "Seattle"
  ],
  "Royaume-Uni": [
    "Londres", "Manchester", "Birmingham", "Édimbourg", "Glasgow",
    "Liverpool", "Bristol", "Leeds", "Newcastle"
  ],
  "Allemagne": [
    "Berlin", "Munich", "Francfort", "Hambourg", "Cologne",
    "Stuttgart", "Düsseldorf", "Leipzig", "Dresde"
  ],
  "Chine": [
    "Pékin", "Shanghai", "Canton", "Shenzhen", "Hong Kong",
    "Wuhan", "Chengdu", "Hangzhou"
  ],
  "Émirats Arabes Unis": [
    "Dubaï", "Abou Dabi", "Charjah", "Ajman", "Ras el Khaïmah"
  ],
  "Madagascar": [
    "Antananarivo", "Toamasina", "Antsirabe", "Mahajanga", "Fianarantsoa", "Toliara"
  ],
  "Mauritanie": [
    "Nouakchott", "Nouadhibou", "Kiffa", "Rosso", "Kaédi", "Zouérate"
  ],
  "Rwanda": [
    "Kigali", "Butare", "Gisenyi", "Ruhengeri", "Gitarama"
  ],
  "Ghana": [
    "Accra", "Kumasi", "Tamale", "Takoradi", "Tema", "Cape Coast"
  ],
  "Nigéria": [
    "Lagos", "Abuja", "Ibadan", "Kano", "Port Harcourt", "Benin City"
  ],
};

/**
 * Récupérer les villes associées à un pays (avec fallback de grandes villes par défaut)
 */
export function getCitiesForCountry(countryName: string): string[] {
  if (!countryName) return CITIES_BY_COUNTRY["Côte d'Ivoire"];
  
  // Correspondance directe
  if (CITIES_BY_COUNTRY[countryName]) {
    return CITIES_BY_COUNTRY[countryName];
  }

  // Recherche insensible à la casse
  const normalized = countryName.toLowerCase().trim();
  const match = Object.keys(CITIES_BY_COUNTRY).find(
    (k) => k.toLowerCase() === normalized
  );
  if (match) {
    return CITIES_BY_COUNTRY[match];
  }

  // Si pays sans liste spécifique, renvoyer une sélection générale
  return [];
}

/**
 * Récupérer l'indicatif téléphonique officiel d'un pays (+225, +221, +33, etc.)
 */
export function getDialCodeForCountry(countryName: string): string {
  if (!countryName) return "+225";
  const normalized = countryName.toLowerCase().trim();
  const found = ALL_WORLD_COUNTRIES.find(
    (c) => c.name.toLowerCase().trim() === normalized
  );
  return found?.dialCode || "+225";
}
