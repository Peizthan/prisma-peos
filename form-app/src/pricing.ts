import type { FormData } from './types';

// All prices in Paraguayan guaraníes.
// Individual package: price depends on both service type and delivery.
// Multi-person packages (x2, x3): delivery does not change the price.
// Pixieset is always a flat add-on.

const INDIVIDUAL_PRICES: Record<string, Record<string, number>> = {
  'Fotos de la presentación': {
    'Entrega Estándar': 150_000,
    'Entrega Prioritaria': 180_000,
    'Entrega Inmediata': 220_000,
  },
  'Fotos de la presentación + retratos': {
    'Entrega Estándar': 180_000,
    'Entrega Prioritaria': 220_000,
    'Entrega Inmediata': 250_000,
  },
};

const MULTI_PRICES: Record<string, Record<string, number>> = {
  'Familiar x 2': {
    'Fotos de la presentación': 255_000,
    'Fotos de la presentación + retratos': 330_000,
  },
  'Multielemento x 2': {
    'Fotos de la presentación': 255_000,
    'Fotos de la presentación + retratos': 330_000,
  },
  'Familiar x 3': {
    'Fotos de la presentación': 275_000,
    'Fotos de la presentación + retratos': 355_000,
  },
  'Multielemento x 3': {
    'Fotos de la presentación': 275_000,
    'Fotos de la presentación + retratos': 355_000,
  },
};

const PIXIESET_ADDON = 40_000;

export interface PriceLineItem {
  label: string;
  amount: number;
}

export interface PriceBreakdown {
  lines: PriceLineItem[];
  total: number;
  isComplete: boolean;
}

export function computePrice(form: Partial<FormData>): PriceBreakdown {
  const lines: PriceLineItem[] = [];
  let base: number | null = null;

  if (form.packageName === 'Individual') {
    if (form.serviceType && form.delivery) {
      base = INDIVIDUAL_PRICES[form.serviceType]?.[form.delivery] ?? null;
      if (base !== null) {
        lines.push({ label: `${form.serviceType} — ${form.packageName} (${form.delivery})`, amount: base });
      }
    }
  } else if (form.packageName && form.serviceType) {
    base = MULTI_PRICES[form.packageName]?.[form.serviceType] ?? null;
    if (base !== null) {
      lines.push({ label: `${form.serviceType} — ${form.packageName}`, amount: base });
    }
  }

  if (base !== null && form.pixieset === 'Sí') {
    lines.push({ label: 'Pixieset (selección de fotos)', amount: PIXIESET_ADDON });
  }

  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  const isComplete = base !== null && (form.pixieset !== undefined && form.pixieset !== '');

  return { lines, total, isComplete };
}

export function formatGs(amount: number): string {
  return amount.toLocaleString('es-PY') + ' Gs.';
}
