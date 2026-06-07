export const FILM_BRANDS = [
  "Kodak",
  "Fujifilm",
  "Filmage",
  "Ilford",
  "Cinestill",
  "Lomography",
  "Kentmere",
  "Agfa",
  "Rollei",
  "Foma",
  "Polaroid",
  "Other"
] as const;

export type FilmBrand = (typeof FILM_BRANDS)[number];

export const FILMAGE_DISCOUNT = 20;

export const FILM_STOCKS_BY_BRAND: Record<Exclude<FilmBrand, "Other">, readonly string[]> = {
  Kodak: [
    "ColorPlus 200",
    "Gold 200",
    "Ultramax 400",
    "Portra 160",
    "Portra 400",
    "Portra 800",
    "Ektar 100",
    "Vision3 250D",
    "Vision3 500T",
    "Tri-X 400",
    "T-Max 100",
    "T-Max 400",
    "Other"
  ],
  Fujifilm: [
    "C200",
    "400",
    "Superia X-Tra 400",
    "Fujicolor 100",
    "Velvia 50",
    "Provia 100F",
    "Acros II",
    "Other"
  ],
  Ilford: [
    "HP5 Plus 400",
    "FP4 Plus 125",
    "Delta 100",
    "Delta 400",
    "Delta 3200",
    "Pan F Plus 50",
    "XP2 Super",
    "Other"
  ],
  Cinestill: ["50D", "400D", "800T", "XX", "BwXX", "Other"],
  Lomography: [
    "Color Negative 100",
    "Color Negative 400",
    "Color Negative 800",
    "LomoChrome Purple",
    "LomoChrome Metropolis",
    "Lady Grey 400",
    "Berlin Kino 400",
    "Earl Grey 100",
    "Other"
  ],
  Kentmere: ["Kentmere 100", "Kentmere 400", "Pan 100", "Pan 400", "Other"],
  Agfa: ["APX 100", "APX 400", "Vista 200", "Vista Plus 400", "Other"],
  Rollei: ["Retro 80S", "Retro 400S", "Infrared 400", "RPX 100", "RPX 400", "Other"],
  Foma: ["Fomapan 100", "Fomapan 200", "Fomapan 400", "Other"],
  Polaroid: ["i-Type", "600 Film", "Go Film", "Other"],
  Filmage: [
    "250D",
    "500T",
    "Hanabi Effect",
    "Sparkling Effect",
    "Sommarkz Effect",
    "Mirai Effect",
    "Christmas Effect",
    "Other"
  ]
};

export function isFilmBrand(value: string): value is FilmBrand {
  return (FILM_BRANDS as readonly string[]).includes(value);
}

export function getStocksForBrand(brand: FilmBrand): string[] {
  if (brand === "Other") return [];
  return [...FILM_STOCKS_BY_BRAND[brand]];
}

export function isFilmageBrand(brand: string): boolean {
  return brand === "Filmage";
}

export function getRollBrandLabel(roll: {
  brand: string;
  brandOther?: string;
}): string {
  if (roll.brand === "Other") {
    return roll.brandOther?.trim() || "Other";
  }
  return roll.brand;
}

export function getRollStockLabel(roll: {
  brand: string;
  stock: string;
  stockOther?: string;
}): string {
  if (roll.brand === "Other") {
    return roll.stockOther?.trim() || "";
  }
  if (roll.stock === "Other") {
    return roll.stockOther?.trim() || "Other";
  }
  return roll.stock;
}
