import type { RegisterOrderInput } from '../../application/use-cases/register-order';
import { PeosError } from '../../application/errors/peos-error';
import {
  DELIVERY_DISPLAY_LABELS,
  PACKAGE_DISPLAY_LABELS,
  SERVICE_TYPE_DISPLAY_LABELS,
  type DeliveryCode,
  type OrderPackage,
  type ServiceTypeCode,
  type PixiesetSelection
} from '../../domain/entities/order';

const FORM_FIELDS = {
  athleteFullName: ['1. Nombre del atleta', 'Nombre del atleta', 'Nombre del alumno', 'Nombre del deportista'],
  guardianFullName: ['2. Nombre del responsable', 'Nombre del responsable', 'Nombre del tutor', 'Nombre del apoderado'],
  phoneWhatsapp: ['3. Teléfono / WhatsApp', 'Teléfono / WhatsApp', 'WhatsApp', 'Teléfono'],
  email: ['4. Correo electrónico', 'Correo electrónico', 'Dirección de correo electrónico', 'Email'],
  serviceType: ['5. ¿Qué tipo de servicio querés?', '¿Qué tipo de servicio querés?', 'Tipo de servicio'],
  packageLabel: ['6. El paquete es:', 'El paquete es:', 'Paquete'],
  delivery: [
    '7. ¿En que tiempo le gustaría la entrega?',
    '7. ¿En qué tiempo le gustaría la entrega?',
    '¿En que tiempo le gustaría la entrega?',
    '¿En qué tiempo le gustaría la entrega?',
    '¿En que tiempo te gustaría la entrega?',
    '¿En qué tiempo te gustaría la entrega?',
    'Tiempo de entrega'
  ],
  pixiesetSelection: [
    '8. ¿Te gustaría elegir tus fotos con Pixieset?',
    '¿Te gustaría elegir tus fotos con Pixieset?',
    'Pixieset'
  ],
  academyGroupClub: ['9. Academia / grupo / club ', '9. Academia / grupo / club', 'Academia / grupo / club', 'Academia', 'Grupo / club'],
  observations: ['10. Observaciones', 'Observaciones', 'Comentarios']
} as const;

const PACKAGE_CODE_BY_DISPLAY_LABEL = new Map<string, OrderPackage>(
  Object.entries(PACKAGE_DISPLAY_LABELS).map(([code, label]) => [label.trim().toLowerCase(), code as OrderPackage])
);

const SERVICE_TYPE_CODE_BY_DISPLAY_LABEL = new Map<string, ServiceTypeCode>(
  Object.entries(SERVICE_TYPE_DISPLAY_LABELS).map(([code, label]) => [label.trim().toLowerCase(), code as ServiceTypeCode])
);

const DELIVERY_CODE_BY_DISPLAY_LABEL = new Map<string, DeliveryCode>(
  Object.entries(DELIVERY_DISPLAY_LABELS).map(([code, label]) => [label.trim().toLowerCase(), code as DeliveryCode])
);

const PIXIESET_CODE_BY_DISPLAY_LABEL = new Map<string, PixiesetSelection>([
  ['sí', 'YES'],
  ['si', 'YES'],
  ['yes', 'YES'],
  ['no', 'NO']
]);

export function mapFormSubmissionToRegisterOrderInput(
  e: GoogleAppsScript.Events.SheetsOnFormSubmit
): RegisterOrderInput {
  const namedValues = e.namedValues;

  const athleteFullName = requiredField(namedValues, ...FORM_FIELDS.athleteFullName);
  const guardianFullName = requiredField(namedValues, ...FORM_FIELDS.guardianFullName);
  const phoneWhatsapp = requiredField(namedValues, ...FORM_FIELDS.phoneWhatsapp);
  const email = requiredField(namedValues, ...FORM_FIELDS.email);
  const serviceTypeLabel = requiredField(namedValues, ...FORM_FIELDS.serviceType);
  const packageLabel = requiredField(namedValues, ...FORM_FIELDS.packageLabel);
  const deliveryLabel = requiredField(namedValues, ...FORM_FIELDS.delivery);
  const pixiesetSelection = requiredField(namedValues, ...FORM_FIELDS.pixiesetSelection);
  const academyGroupClub = optionalField(namedValues, ...FORM_FIELDS.academyGroupClub);
  const observations = optionalField(namedValues, ...FORM_FIELDS.observations);

  return {
    athleteFullName: athleteFullName.trim(),
    guardianFullName: guardianFullName.trim(),
    phoneWhatsapp: phoneWhatsapp.trim(),
    email: email.trim().toLowerCase(),
    serviceTypeCode: parseServiceType(serviceTypeLabel),
    packageCode: parsePackage(packageLabel),
    deliveryCode: parseDelivery(deliveryLabel),
    pixiesetSelection: parsePixiesetSelection(pixiesetSelection),
    ...(academyGroupClub?.trim() ? { academyGroupClub: academyGroupClub.trim() } : {}),
    ...(observations?.trim() ? { observations: observations.trim() } : {}),
    sourceResponseId: buildResponseId(e)
  };
}

function requiredField(
  namedValues: GoogleAppsScript.Events.SheetsOnFormSubmit['namedValues'],
  ...searchTokens: string[]
): string {
  const firstAvailable = resolveFieldValue(namedValues, searchTokens);

  if (!firstAvailable || firstAvailable.trim().length === 0) {
    const missingKey = searchTokens[0] ?? 'unknown';
    throw new PeosError(`Missing required form field: ${missingKey}`, {
      code: 'VALIDATION_ERROR',
      operation: 'mapFormSubmissionToRegisterOrderInput',
      retryable: false,
      context: { field: missingKey, searchTokens }
    });
  }

  return firstAvailable;
}

function optionalField(
  namedValues: GoogleAppsScript.Events.SheetsOnFormSubmit['namedValues'],
  ...searchTokens: string[]
): string | undefined {
  return resolveFieldValue(namedValues, searchTokens, true);
}

function resolveFieldValue(
  namedValues: GoogleAppsScript.Events.SheetsOnFormSubmit['namedValues'],
  searchTokens: string[],
  allowEmpty = false
): string | undefined {
  for (const [key, values] of Object.entries(namedValues ?? {})) {
    const value = values?.[0];
    if (typeof value !== 'string') {
      continue;
    }

    if (!allowEmpty && value.trim().length === 0) {
      continue;
    }

    if (matchesSearchTokens(key, searchTokens)) {
      return value;
    }
  }

  return undefined;
}

function matchesSearchTokens(key: string, searchTokens: string[]): boolean {
  const normalizedKey = normalizeFieldName(key);
  if (!normalizedKey) {
    return false;
  }

  return searchTokens.some((token) => {
    const normalizedToken = normalizeFieldName(token);
    return normalizedToken.length > 0 && normalizedKey.includes(normalizedToken);
  });
}

function normalizeFieldName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parsePackage(label: string): OrderPackage {
  const trimmedLabel = label.trim();
  if (trimmedLabel.length === 0) {
    throw new PeosError('Package label is required', {
      code: 'VALIDATION_ERROR',
      operation: 'mapFormSubmissionToRegisterOrderInput',
      retryable: false,
      context: { packageLabel: label }
    });
  }

  const packageCode = PACKAGE_CODE_BY_DISPLAY_LABEL.get(trimmedLabel.toLowerCase());
  if (!packageCode) {
    throw new PeosError(`Unknown package label: ${label}`, {
      code: 'VALIDATION_ERROR',
      operation: 'mapFormSubmissionToRegisterOrderInput',
      retryable: false,
      context: { packageLabel: label }
    });
  }

  return packageCode;
}

export function parseServiceType(label: string): ServiceTypeCode {
  const trimmedLabel = label.trim();
  if (trimmedLabel.length === 0) {
    throw new PeosError('Service type label is required', {
      code: 'VALIDATION_ERROR',
      operation: 'mapFormSubmissionToRegisterOrderInput',
      retryable: false,
      context: { serviceTypeLabel: label }
    });
  }

  const serviceTypeCode = SERVICE_TYPE_CODE_BY_DISPLAY_LABEL.get(trimmedLabel.toLowerCase());
  if (!serviceTypeCode) {
    throw new PeosError(`Unknown service type label: ${label}`, {
      code: 'VALIDATION_ERROR',
      operation: 'mapFormSubmissionToRegisterOrderInput',
      retryable: false,
      context: { serviceTypeLabel: label }
    });
  }

  return serviceTypeCode;
}

export function parseDelivery(label: string): DeliveryCode {
  const trimmedLabel = label.trim();
  if (trimmedLabel.length === 0) {
    throw new PeosError('Delivery label is required', {
      code: 'VALIDATION_ERROR',
      operation: 'mapFormSubmissionToRegisterOrderInput',
      retryable: false,
      context: { deliveryLabel: label }
    });
  }

  const deliveryCode = DELIVERY_CODE_BY_DISPLAY_LABEL.get(trimmedLabel.toLowerCase());
  if (!deliveryCode) {
    throw new PeosError(`Unknown delivery label: ${label}`, {
      code: 'VALIDATION_ERROR',
      operation: 'mapFormSubmissionToRegisterOrderInput',
      retryable: false,
      context: { deliveryLabel: label }
    });
  }

  return deliveryCode;
}

export function parsePixiesetSelection(label: string): PixiesetSelection {
  const trimmedLabel = label.trim();
  if (trimmedLabel.length === 0) {
    throw new PeosError('Pixieset selection is required', {
      code: 'VALIDATION_ERROR',
      operation: 'mapFormSubmissionToRegisterOrderInput',
      retryable: false,
      context: { pixiesetSelection: label }
    });
  }

  const pixiesetSelection = PIXIESET_CODE_BY_DISPLAY_LABEL.get(trimmedLabel.toLowerCase());
  if (!pixiesetSelection) {
    throw new PeosError(`Unknown Pixieset selection: ${label}`, {
      code: 'VALIDATION_ERROR',
      operation: 'mapFormSubmissionToRegisterOrderInput',
      retryable: false,
      context: { pixiesetSelection: label }
    });
  }

  return pixiesetSelection;
}

function buildResponseId(e: GoogleAppsScript.Events.SheetsOnFormSubmit): string {
  const row = e.range?.getRow?.() ?? 0;
  if (row <= 0) {
    return `FORM-${Date.now()}`;
  }

  return `FORM-ROW-${row}`;
}
