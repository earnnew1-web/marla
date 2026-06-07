import { FILM_BRANDS, isFilmBrand, type FilmBrand } from "@/lib/film-catalog";

const BRAND_LOGO_FILES: Record<FilmBrand, string> = {
  Kodak: "kodak.png",
  Fujifilm: "fujifilm.png",
  Filmage: "filmage.png",
  Ilford: "ilford.png",
  Cinestill: "cinestill.png",
  Lomography: "lomography.png",
  Kentmere: "kentmere.png",
  Agfa: "agfa.png",
  Rollei: "rollei.png",
  Foma: "foma.png",
  Polaroid: "polaroid.png",
  Other: "other.png"
};

export function getFilmBrandLogoSrc(brand: string): string | undefined {
  if (!isFilmBrand(brand)) return undefined;
  return `/images/film-brands/${BRAND_LOGO_FILES[brand]}`;
}

export function getFilmBrandOptions(): FilmBrand[] {
  return [...FILM_BRANDS];
}
