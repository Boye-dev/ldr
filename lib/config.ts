export const COUPLE_CODE = "adeboye-faith";

export const PARTNERS = {
  A: { name: "Adeboye", timezone: "America/Toronto", flag: "🇨🇦" },
  B: { name: "Faith", timezone: "Africa/Lagos", flag: "🇳🇬" },
} as const;

export type PartnerKey = keyof typeof PARTNERS;

export function partnerName(key: PartnerKey) {
  return PARTNERS[key].name;
}

export function otherPartner(key: PartnerKey): PartnerKey {
  return key === "A" ? "B" : "A";
}
