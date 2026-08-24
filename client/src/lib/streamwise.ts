export type BillingCycle = "monthly" | "quarterly" | "yearly";

export function monthlyEquivalent(price: number, cycle: BillingCycle) {
  if (cycle === "quarterly") return price / 3;
  if (cycle === "yearly") return price / 12;
  return price;
}

export function annualEquivalent(price: number, cycle: BillingCycle) {
  if (cycle === "quarterly") return price * 4;
  if (cycle === "yearly") return price;
  return price * 12;
}

export function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function dateForInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export function parseProviderNames(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}
