import { describe, expect, it } from 'vitest';
import { getSpreadsheetFromFormSubmitEvent } from '../../src/interfaces/triggers/on-form-submit';

describe('getSpreadsheetFromFormSubmitEvent', () => {
  it('uses the spreadsheet bound to the response sheet', () => {
    const expectedSpreadsheet = {
      getId: () => 'spreadsheet-123'
    } as unknown as GoogleAppsScript.Spreadsheet.Spreadsheet;

    const event = {
      range: {
        getSheet: () => ({
          getParent: () => expectedSpreadsheet
        })
      }
    } as unknown as GoogleAppsScript.Events.SheetsOnFormSubmit;

    expect(getSpreadsheetFromFormSubmitEvent(event).getId()).toBe('spreadsheet-123');
  });

  it('falls back to the active spreadsheet when range metadata is missing', () => {
    const expectedSpreadsheet = {
      getId: () => 'spreadsheet-456'
    } as unknown as GoogleAppsScript.Spreadsheet.Spreadsheet;

    Object.defineProperty(globalThis, 'SpreadsheetApp', {
      value: {
        getActiveSpreadsheet: () => expectedSpreadsheet
      },
      configurable: true
    });

    const event = {} as GoogleAppsScript.Events.SheetsOnFormSubmit;

    expect(getSpreadsheetFromFormSubmitEvent(event).getId()).toBe('spreadsheet-456');
  });

  it('does not crash when the event has no range metadata', () => {
    const expectedSpreadsheet = {
      getId: () => 'spreadsheet-789'
    } as unknown as GoogleAppsScript.Spreadsheet.Spreadsheet;

    Object.defineProperty(globalThis, 'SpreadsheetApp', {
      value: {
        getActiveSpreadsheet: () => expectedSpreadsheet
      },
      configurable: true
    });

    const event = {
      namedValues: {
        'Nombre del atleta': ['Ariadna Test'],
        'Nombre del responsable': ['María Test'],
        'Teléfono / WhatsApp': ['+52 55 1111 3333'],
        'Correo electrónico': ['prueba3@correo.com'],
        '¿Qué tipo de servicio querés?': ['Fotos de la presentación'],
        'El paquete es:': ['Individual'],
        '¿En qué tiempo te gustaría la entrega?': ['Entrega Inmediata'],
        '¿Te gustaría elegir tus fotos con Pixieset?': ['Sí']
      }
    } as unknown as GoogleAppsScript.Events.SheetsOnFormSubmit;

    expect(() => getSpreadsheetFromFormSubmitEvent(event)).not.toThrow();
  });
});
