export const WELCOME_COUPON_PREFIX = "MARLA-";

/** Uppercase letters and digits, excluding O/0/I/1. */
export const WELCOME_COUPON_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const WELCOME_COUPON_SUFFIX_LENGTH = 5;

export const WELCOME_COUPON_DISCOUNT_VALUE = 50;

export const WELCOME_COUPON_VALIDITY_MONTHS = 3;

/** UI-only placeholder — never persist or submit to the server. */
export const WELCOME_GIFT_PLACEHOLDER_CODE = "WELCOME-GIFT";

export function isWelcomeCouponCode(code: string): boolean {
  return code.trim().toUpperCase().startsWith(WELCOME_COUPON_PREFIX);
}

export function isWelcomeGiftPlaceholder(code: string): boolean {
  return code.trim().toUpperCase() === WELCOME_GIFT_PLACEHOLDER_CODE;
}

export function generateWelcomeCouponSuffix(length = WELCOME_COUPON_SUFFIX_LENGTH): string {
  let suffix = "";
  for (let index = 0; index < length; index += 1) {
    const charIndex = Math.floor(Math.random() * WELCOME_COUPON_CHARSET.length);
    suffix += WELCOME_COUPON_CHARSET[charIndex];
  }
  return suffix;
}

export function formatWelcomeCouponCode(suffix: string): string {
  return `${WELCOME_COUPON_PREFIX}${suffix}`;
}

export function welcomeCouponExpiresAt(from = new Date()): string {
  const expires = new Date(from);
  expires.setMonth(expires.getMonth() + WELCOME_COUPON_VALIDITY_MONTHS);
  return expires.toISOString();
}
