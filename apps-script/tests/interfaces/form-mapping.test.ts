import { describe, expect, it } from 'vitest';
import { PeosError } from '../../src/application/errors/peos-error';
import { parseDelivery, parsePackage, parsePixiesetSelection, parseServiceType } from '../../src/interfaces/triggers/form-mapping';

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
