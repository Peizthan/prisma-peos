import { describe, expect, it } from 'vitest';
import { PeosError } from '../../src/application/errors/peos-error';
import type { Order } from '../../src/domain/entities/order';
import { SheetsOrderRepository } from '../../src/infrastructure/google/sheets-order-repository';

class FakeRange {
  constructor(
    private readonly sheet: FakeSheet,
    private readonly startRow: number,
    private readonly startCol: number,
    private readonly numRows: number,
    private readonly numCols: number
  ) {}

  getValues(): unknown[][] {
    const results: unknown[][] = [];

    for (let rowIndex = 0; rowIndex < this.numRows; rowIndex += 1) {
      const sourceRow = this.sheet.rows[this.startRow - 1 + rowIndex] ?? [];
      const values: unknown[] = [];

      for (let colIndex = 0; colIndex < this.numCols; colIndex += 1) {
        const value = sourceRow[this.startCol - 1 + colIndex];
        values.push(value === undefined ? '' : value);
      }

      results.push(values);
    }

    return results;
  }

  setValues(values: unknown[][]): void {
    const startIndex = this.startRow - 1;

    values.forEach((row, index) => {
      const rowIndex = startIndex + index;
      while (this.sheet.rows.length <= rowIndex) {
        this.sheet.rows.push([]);
      }

      while (this.sheet.rows[rowIndex]!.length < this.startCol - 1) {
        this.sheet.rows[rowIndex]!.push('');
      }

      row.forEach((cell, cellIndex) => {
        this.sheet.rows[rowIndex]![this.startCol - 1 + cellIndex] = cell;
      });
    });
  }
}

class FakeSheet {
  rows: unknown[][] = [];

  getLastRow(): number {
    return this.rows.length;
  }

  getRange(startRow: number, startCol: number, numRows: number, numCols: number): FakeRange {
    return new FakeRange(this, startRow, startCol, numRows, numCols);
  }

  appendRow(values: unknown[]): void {
    this.rows.push([...values]);
  }
}

class FakeSpreadsheet {
  private readonly sheets = new Map<string, FakeSheet>();

  getSheetByName(name: string): FakeSheet | undefined {
    return this.sheets.get(name);
  }

  insertSheet(name: string): FakeSheet {
    const sheet = new FakeSheet();
    this.sheets.set(name, sheet);
    return sheet;
  }

  sheetFor(name: string): FakeSheet {
    const sheet = this.sheets.get(name);
    if (!sheet) {
      throw new Error(`Sheet ${name} not found`);
    }

    return sheet;
  }
}

const ORDER_HEADERS = [
  'orderId',
  'eventCode',
  'athleteFullName',
  'guardianFullName',
  'phoneWhatsapp',
  'email',
  'serviceTypeCode',
  'packageCode',
  'deliveryCode',
  'pixiesetSelection',
  'academyGroupClub',
  'observations',
  'price',
  'status',
  'createdAtIso',
  'sourceResponseId'
] as const;

const COMPLETE_ORDER: Order = {
  orderId: 'PEOS-MTY-OPEN-2026-20260805-0001',
  eventCode: 'MTY-OPEN-2026',
  athleteFullName: 'Athlete One',
  guardianFullName: 'Guardian One',
  phoneWhatsapp: '+541155556666',
  email: 'athlete@example.com',
  serviceTypeCode: 'PRESENTATION_AND_PORTRAITS',
  packageCode: 'MULTIELEMENTO_3',
  deliveryCode: 'PRIORITY',
  pixiesetSelection: 'YES',
  academyGroupClub: 'Club Prisma',
  observations: 'Sin flashes durante retratos',
  price: 145000,
  status: 'PENDING',
  createdAtIso: '2026-08-05T15:00:00.000Z',
  sourceResponseId: 'FORM-ROW-22'
};

describe('SheetsOrderRepository', () => {
  it('persists the complete current Order model values', () => {
    const spreadsheet = new FakeSpreadsheet();
    const repository = new SheetsOrderRepository(spreadsheet as never);

    repository.save(COMPLETE_ORDER);

    const sheet = spreadsheet.sheetFor('Orders');
    expect(sheet.rows[0]).toEqual([...ORDER_HEADERS]);
    expect(sheet.rows[1]).toEqual([
      'PEOS-MTY-OPEN-2026-20260805-0001',
      'MTY-OPEN-2026',
      'Athlete One',
      'Guardian One',
      '+541155556666',
      'athlete@example.com',
      'PRESENTATION_AND_PORTRAITS',
      'MULTIELEMENTO_3',
      'PRIORITY',
      'YES',
      'Club Prisma',
      'Sin flashes durante retratos',
      145000,
      'PENDING',
      '2026-08-05T15:00:00.000Z',
      'FORM-ROW-22'
    ]);
  });

  it('writes optional academyGroupClub, observations, and price as empty cells when missing', () => {
    const spreadsheet = new FakeSpreadsheet();
    const repository = new SheetsOrderRepository(spreadsheet as never);

    repository.save({
      ...COMPLETE_ORDER,
      orderId: 'PEOS-MTY-OPEN-2026-20260805-0002',
      academyGroupClub: undefined,
      observations: undefined,
      price: undefined
    });

    const sheet = spreadsheet.sheetFor('Orders');
    expect(sheet.rows[1]).toEqual([
      'PEOS-MTY-OPEN-2026-20260805-0002',
      'MTY-OPEN-2026',
      'Athlete One',
      'Guardian One',
      '+541155556666',
      'athlete@example.com',
      'PRESENTATION_AND_PORTRAITS',
      'MULTIELEMENTO_3',
      'PRIORITY',
      'YES',
      '',
      '',
      '',
      'PENDING',
      '2026-08-05T15:00:00.000Z',
      'FORM-ROW-22'
    ]);
  });

  it('keeps the canonical 16-column Orders header order', () => {
    const spreadsheet = new FakeSpreadsheet();
    const repository = new SheetsOrderRepository(spreadsheet as never);

    repository.nextSequenceForDay('MTY-OPEN-2026', new Date('2026-08-05T15:00:00.000Z'));

    const sheet = spreadsheet.sheetFor('Orders');
    expect(sheet.rows[0]).toEqual([
      'orderId',
      'eventCode',
      'athleteFullName',
      'guardianFullName',
      'phoneWhatsapp',
      'email',
      'serviceTypeCode',
      'packageCode',
      'deliveryCode',
      'pixiesetSelection',
      'academyGroupClub',
      'observations',
      'price',
      'status',
      'createdAtIso',
      'sourceResponseId'
    ]);
  });

  it('preserves schema validation behavior and throws on header mismatch', () => {
    const spreadsheet = new FakeSpreadsheet();
    const sheet = spreadsheet.insertSheet('Orders');
    sheet.rows = [
      [
        'orderId',
        'eventCode',
        'athleteFullName',
        'guardianFullName',
        'phoneWhatsapp',
        'email',
        'serviceTypeCode',
        'packageCode',
        'deliveryCode',
        'pixiesetSelection',
        'academyGroupClub',
        'observations',
        'amount',
        'status',
        'createdAtIso',
        'sourceResponseId'
      ]
    ];

    const repository = new SheetsOrderRepository(spreadsheet as never);

    expect(() => repository.save(COMPLETE_ORDER)).toThrowError(PeosError);
  });
});
