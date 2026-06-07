export function money(value: number) {
  return `${value.toLocaleString("th-TH")} THB`;
}

export function baht(value: number) {
  return `${value.toLocaleString("th-TH")}฿`;
}

export function bahtSpaced(value: number, prefixPlus = false) {
  const formatted = value.toLocaleString("th-TH");
  return prefixPlus ? `+${formatted} ฿` : `${formatted} ฿`;
}

export function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}
