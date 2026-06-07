/**
 * Marla typography tokens — Google Sans (EN) + IBM Plex Sans Thai (TH).
 *
 * Weight scale:
 * - Headings: 700–800 (font-bold / font-extrabold)
 * - Buttons: 600–700 (font-semibold / font-bold)
 * - Body: 400–500 (font-normal / font-medium)
 * - Labels: 500–600 (font-medium / font-semibold)
 */

/** Hero, section titles, order codes, success messages — 700–800 */
export const heroHeadline =
  "text-center text-3xl font-extrabold tracking-tighter text-foreground sm:text-4xl";

export const pageTitle = "text-3xl font-bold tracking-tight text-foreground";

export const pageTitleLarge = "text-4xl font-extrabold tracking-tight text-foreground";

export const cardTitle = "text-lg font-bold tracking-tight text-foreground";

export const sectionTitleLarge = "text-xl font-bold tracking-tight text-foreground";

export const orderCode = "font-extrabold tabular-nums tracking-wide text-foreground";

export const successMessage = "text-2xl font-bold tracking-tight text-foreground sm:text-3xl";

/** Body copy — 400–500 */
export const heroSubtext =
  "text-center text-base font-normal leading-relaxed text-muted-foreground sm:text-lg";

export const bodyText = "text-sm font-normal leading-relaxed text-foreground";

export const bodyTextMedium = "text-sm font-medium leading-relaxed text-foreground";

export const subtitle = "text-base font-medium leading-relaxed text-muted-foreground";

export const helperText = "text-xs font-normal leading-relaxed text-muted-foreground";

/** Labels, status, navigation — 500–600 */
export const sectionTitle = "text-sm font-semibold text-muted-foreground";

export const formLabel = "text-sm font-semibold leading-none text-foreground";

export const statusLabel = "text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground";

export const navLabel = "text-sm font-medium text-foreground";

export const stepEyebrow = "text-xs font-bold uppercase tracking-[0.18em] text-accent";

/** Buttons — 600–700 (prefer Button component; use for legacy classes) */
export const buttonText = "text-sm font-semibold";

export const buttonTextPrimary = "text-sm font-bold";
