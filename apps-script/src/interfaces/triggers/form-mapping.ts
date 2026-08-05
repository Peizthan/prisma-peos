import type { RegisterOrderInput } from '../../application/use-cases/register-order';
import { PeosError } from '../../application/errors/peos-error';
import type { OrderPackage } from '../../domain/entities/order';

const FORM_FIELDS = {
  eventCode: 'Codigo del Evento',
  athleteFullName: 'Nombre del Atleta',
  guardianFullName: 'Nombre del Responsable',
  email: 'Correo Electronico',
  packageLabel: 'Paquete'
} as const;

export function mapFormSubmissionToRegisterOrderInput(
  e: GoogleAppsScript.Events.SheetsOnFormSubmit
): RegisterOrderInput {
  const namedValues = e.namedValues;

  const eventCode = requiredField(namedValues, FORM_FIELDS.eventCode);
  const athleteFullName = requiredField(namedValues, FORM_FIELDS.athleteFullName);
  const email = requiredField(namedValues, FORM_FIELDS.email);
  const packageLabel = requiredField(namedValues, FORM_FIELDS.packageLabel);
  const guardianFullName = optionalField(namedValues, FORM_FIELDS.guardianFullName);

  return {
    eventCode: eventCode.trim().toUpperCase(),
    athleteFullName: athleteFullName.trim(),
    email: email.trim().toLowerCase(),
    packageCode: parsePackage(packageLabel),
    sourceResponseId: buildResponseId(e),
    ...(guardianFullName?.trim() ? { guardianFullName: guardianFullName.trim() } : {})
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

function parsePackage(label: string): OrderPackage {
  const normalized = label.trim().toUpperCase();

  if (normalized.includes('BASIC')) {
    return 'BASIC';
  }

  if (normalized.includes('PREMIUM')) {
    return 'PREMIUM';
  }

  if (normalized.includes('PLUS')) {
    return 'PLUS';
  }

  throw new PeosError(`Unknown package label: ${label}`, {
    code: 'VALIDATION_ERROR',
    operation: 'mapFormSubmissionToRegisterOrderInput',
    retryable: false,
    context: { packageLabel: label }
  });
}

function buildResponseId(e: GoogleAppsScript.Events.SheetsOnFormSubmit): string {
  const row = e.range.getRow();
  return `FORM-ROW-${row}`;
}
