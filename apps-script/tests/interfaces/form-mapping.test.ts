import { describe, expect, it } from 'vitest';
import { PeosError } from '../../src/application/errors/peos-error';
import {
  mapFormSubmissionToRegisterOrderInput,
  parseDelivery,
  parsePackage,
  parsePixiesetSelection,
  parseServiceType
} from '../../src/interfaces/triggers/form-mapping';

describe('parsePackage', () => {
  it.each([
    ['Individual', 'INDIVIDUAL'],
    ['Familiar x 2', 'FAMILIAR_2'],
    ['Multielemento x 2', 'MULTIELEMENTO_2'],
    ['Familiar x 3', 'FAMILIAR_3'],
    ['Multielemento x 3', 'MULTIELEMENTO_3']
  ])('maps %s to %s', (label, expected) => {
    expect(parsePackage(label)).toBe(expected);
  });

  it('rejects placeholders and arbitrary values', () => {
    expect(() => parsePackage('BASIC')).toThrowError(PeosError);
    expect(() => parsePackage('PLUS')).toThrowError(PeosError);
    expect(() => parsePackage('PREMIUM')).toThrowError(PeosError);
    expect(() => parsePackage('Paquete inventado')).toThrowError(PeosError);
    expect(() => parsePackage('')).toThrowError(PeosError);
  });
});

describe('parseServiceType', () => {
  it('maps the real Prisma service labels', () => {
    expect(parseServiceType('Fotos de la presentación')).toBe('PRESENTATION');
    expect(parseServiceType('Fotos de la presentación + retratos')).toBe('PRESENTATION_AND_PORTRAITS');
  });

  it('rejects invalid service types', () => {
    expect(() => parseServiceType('Servicio inventado')).toThrowError(PeosError);
    expect(() => parseServiceType('')).toThrowError(PeosError);
  });
});

describe('parseDelivery', () => {
  it('maps the real Prisma delivery labels', () => {
    expect(parseDelivery('Entrega Inmediata')).toBe('IMMEDIATE');
    expect(parseDelivery('Entrega Prioritaria')).toBe('PRIORITY');
    expect(parseDelivery('Entrega Estándar')).toBe('STANDARD');
  });

  it('rejects invalid delivery labels', () => {
    expect(() => parseDelivery('Entrega inventada')).toThrowError(PeosError);
    expect(() => parseDelivery('')).toThrowError(PeosError);
  });
});

describe('parsePixiesetSelection', () => {
  it('maps the real Pixieset labels', () => {
    expect(parsePixiesetSelection('Sí')).toBe('YES');
    expect(parsePixiesetSelection('No')).toBe('NO');
  });

  it('rejects invalid Pixieset values', () => {
    expect(() => parsePixiesetSelection('Quizás')).toThrowError(PeosError);
    expect(() => parsePixiesetSelection('')).toThrowError(PeosError);
  });
});

describe('mapFormSubmissionToRegisterOrderInput', () => {
  it('accepts the exact live-form field names from the production CSV', () => {
    const event = {
      namedValues: {
        '1. Nombre del atleta': ['Ariadna Test'],
        '2. Nombre del responsable': ['María Test'],
        '3. Teléfono / WhatsApp': ['+52 55 1111 3333'],
        '4. Correo electrónico': ['prueba3@correo.com'],
        '5. ¿Qué tipo de servicio querés?': ['Fotos de la presentación'],
        '6. El paquete es:': ['Individual'],
        '7. ¿En que tiempo le gustaría la entrega?': ['Entrega Inmediata'],
        '8. ¿Te gustaría elegir tus fotos con Pixieset?': ['Si']
      }
    } as unknown as GoogleAppsScript.Events.SheetsOnFormSubmit;

    expect(mapFormSubmissionToRegisterOrderInput(event)).toMatchObject({
      athleteFullName: 'Ariadna Test',
      guardianFullName: 'María Test',
      phoneWhatsapp: '+52 55 1111 3333',
      email: 'prueba3@correo.com',
      serviceTypeCode: 'PRESENTATION',
      packageCode: 'INDIVIDUAL',
      deliveryCode: 'IMMEDIATE',
      pixiesetSelection: 'YES'
    });
  });
});
