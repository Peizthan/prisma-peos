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
  athleteFullName: 'Nombre del atleta',
  guardianFullName: 'Nombre del responsable',
  phoneWhatsapp: 'Teléfono / WhatsApp',
  email: 'Correo electrónico',
  serviceType: '¿Qué tipo de servicio querés?',
  packageLabel: 'El paquete es:',
  delivery: '¿En qué tiempo te gustaría la entrega?',
  pixiesetSelection: '¿Te gustaría elegir tus fotos con Pixieset?',
  academyGroupClub: 'Academia / grupo / club',
  observations: 'Observaciones'
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

  const athleteFullName = requiredField(namedValues, FORM_FIELDS.athleteFullName);
  const guardianFullName = requiredField(namedValues, FORM_FIELDS.guardianFullName);
  const phoneWhatsapp = requiredField(namedValues, FORM_FIELDS.phoneWhatsapp);
  const email = requiredField(namedValues, FORM_FIELDS.email);
  const serviceTypeLabel = requiredField(namedValues, FORM_FIELDS.serviceType);
  const packageLabel = requiredField(namedValues, FORM_FIELDS.packageLabel);
  const deliveryLabel = requiredField(namedValues, FORM_FIELDS.delivery);
  const pixiesetSelection = requiredField(namedValues, FORM_FIELDS.pixiesetSelection);
  const academyGroupClub = optionalField(namedValues, FORM_FIELDS.academyGroupClub);
  const observations = optionalField(namedValues, FORM_FIELDS.observations);

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

function requiredField(namedValues: GoogleAppsScript.Events.SheetsOnFormSubmit['namedValues'], key: string): string {
  const values = namedValues[key];
  const firstValue = values?.[0];

  if (!firstValue || firstValue.trim().length === 0) {
    throw new PeosError(`Missing required form field: ${key}`, {
      code: 'VALIDATION_ERROR',
      operation: 'mapFormSubmissionToRegisterOrderInput',
      retryable: false,
      context: { field: key }
    });
  }

  return firstValue;
}

function optionalField(
  namedValues: GoogleAppsScript.Events.SheetsOnFormSubmit['namedValues'],
  key: string
): string | undefined {
  return namedValues[key]?.[0];
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
  const row = e.range.getRow();
  return `FORM-ROW-${row}`;
}
