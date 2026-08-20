/**
 * Spec key resolution and field validation helpers.
 *
 * - resolveSpecKey: maps an incoming arbitrary field name to the canonical
 *   key in the product's specifications object (case-insensitive + aliases).
 * - isSupplierOnlyField: rejects supplier-internal fields that must not be
 *   published to the customer-facing catalog.
 * - formatDate: locale-consistent date string for lastUpdated.
 */

// ── Supplier-only guard ───────────────────────────────────────────────────
// These fields are supplier-internal and must never reach the public catalog.

const SUPPLIER_ONLY_NORMALISED = new Set([
  "supplierid", "suppliername", "unitprice", "stockqty",
  "deliverydays", "moq", "paymentterms", "incoterms",
  "supplierstatus", "purchaseprice", "marginpercent", "leadtime",
]);

export function isSupplierOnlyField(key: string): boolean {
  return SUPPLIER_ONLY_NORMALISED.has(key.toLowerCase().replace(/[\s_-]/g, ""));
}

// ── Spec key resolver ─────────────────────────────────────────────────────
// Resolves an arbitrary incoming field name to the canonical spec key.
// Priority: exact match → normalised match → known alias → new capitalised key.

const SPEC_ALIASES: Record<string, string> = {
  ratio:            "Gear Ratio",
  gearratio:        "Gear Ratio",
  flowrate:         "Flow Rate",
  inputpower:       "Input Power",
  outputtorque:     "Output Torque",
  inputspeed:       "Input Speed",
  outputspeed:      "Output Speed",
  housingmaterial:  "Housing Material",
  valvetype:        "Valve Type",
  nominaldiameter:  "Nominal Diameter",
  pressurerating:   "Pressure Rating",
  maximumpressure:  "Maximum Pressure",
  airflow:          "Air Flow",
  tankcapacity:     "Tank Capacity",
  noiselevel:       "Noise Level",
  noiselvl:         "Noise Level",
  powerfactor:      "Power Factor",
};

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function resolveSpecKey(
  incomingKey: string,
  existingSpecKeys: string[]
): string {
  const normIncoming = normalise(incomingKey);

  // 1. Exact case-insensitive match against existing spec keys
  const exact = existingSpecKeys.find(
    (k) => k.toLowerCase() === incomingKey.toLowerCase()
  );
  if (exact) return exact;

  // 2. Normalised match (strips punctuation/spaces)
  const fuzzy = existingSpecKeys.find((k) => normalise(k) === normIncoming);
  if (fuzzy) return fuzzy;

  // 3. Known alias
  if (SPEC_ALIASES[normIncoming]) return SPEC_ALIASES[normIncoming];

  // 4. New spec key: capitalise first letter of the incoming name
  return incomingKey.charAt(0).toUpperCase() + incomingKey.slice(1);
}

// ── Date formatter ────────────────────────────────────────────────────────

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
