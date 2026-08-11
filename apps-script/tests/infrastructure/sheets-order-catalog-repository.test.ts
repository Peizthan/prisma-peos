import { describe, expect, it } from 'vitest';
import { SheetsOrderCatalogRepository } from '../../src/infrastructure/google/sheets-order-catalog-repository';

class FakeRange {
  constructor(
    private readonly sheet: FakeSheet,
    private readonly startRow: number,
    private readonly startCol: number,
    private readonly numRows: number,
    private readonly numCols: number
  ) {}

  getValues(): unknown[][] {
    const rows = this.sheet.rows.slice(this.startRow - 1, this.startRow - 1 + this.numRows);
    return rows.map((row) => row.slice(this.startCol - 1, this.startCol - 1 + this.numCols));
  }

  setValues(values: unknown[][]): void {
    const startIndex = this.startRow - 1;
    values.forEach((row, index) => {
      const rowIndex = startIndex + index;
      while (this.sheet.rows.length <= rowIndex) {
        this.sheet.rows.push([]);
      }
      this.sheet.rows[rowIndex] = row.slice(0, this.numCols);
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

const DEFAULT_PACKAGES = [
  ['PACKAGE', 'INDIVIDUAL', true, 'Individual'],
  ['PACKAGE', 'FAMILIAR_2', true, 'Familiar x 2'],
  ['PACKAGE', 'MULTIELEMENTO_2', true, 'Multielemento x 2'],
  ['PACKAGE', 'FAMILIAR_3', true, 'Familiar x 3'],
  ['PACKAGE', 'MULTIELEMENTO_3', true, 'Multielemento x 3']
] as const;

const DEFAULT_SERVICE_TYPES = [
  ['SERVICE_TYPE', 'PRESENTATION', true, 'Fotos de la presentación'],
  ['SERVICE_TYPE', 'PRESENTATION_AND_PORTRAITS', true, 'Fotos de la presentación + retratos']
] as const;

const DEFAULT_DELIVERIES = [
  ['DELIVERY', 'IMMEDIATE', true, 'Entrega Inmediata'],
  ['DELIVERY', 'PRIORITY', true, 'Entrega Prioritaria'],
  ['DELIVERY', 'STANDARD', true, 'Entrega Estándar']
] as const;

const DEFAULT_CONFIG_ROWS = [...DEFAULT_PACKAGES, ...DEFAULT_SERVICE_TYPES, ...DEFAULT_DELIVERIES] as const;

describe('SheetsOrderCatalogRepository', () => {
  it('creates the Config sheet and seeds all default package rows when the sheet does not exist', () => {
    const spreadsheet = new FakeSpreadsheet();
    const repository = new SheetsOrderCatalogRepository(spreadsheet as never);

    expect(repository.isAllowedPackage('INDIVIDUAL')).toBe(true);

    const sheet = spreadsheet.sheetFor('Config');
    expect(sheet.getLastRow()).toBe(11);
    expect(sheet.rows[0]).toEqual(['type', 'code', 'isActive', 'description']);
    expect(sheet.rows.slice(1)).toEqual(DEFAULT_CONFIG_ROWS.map((row) => [...row]));
  });

  it('adds all missing package rows when the Config sheet exists with headers but no package rows', () => {
    const spreadsheet = new FakeSpreadsheet();
    const sheet = spreadsheet.insertSheet('Config');
    sheet.rows = [['type', 'code', 'isActive', 'description']];

    const repository = new SheetsOrderCatalogRepository(spreadsheet as never);
    repository.isAllowedPackage('INDIVIDUAL');

    expect(sheet.getLastRow()).toBe(11);
    expect(sheet.rows.slice(1)).toEqual(DEFAULT_CONFIG_ROWS.map((row) => [...row]));
  });

  it('does not duplicate an existing package row and adds the missing defaults', () => {
    const spreadsheet = new FakeSpreadsheet();
    const sheet = spreadsheet.insertSheet('Config');
    sheet.rows = [
      ['type', 'code', 'isActive', 'description'],
      ['PACKAGE', 'INDIVIDUAL', true, 'Individual']
    ];

    const repository = new SheetsOrderCatalogRepository(spreadsheet as never);
    repository.isAllowedPackage('INDIVIDUAL');

    expect(sheet.rows.filter((row) => row[1] === 'INDIVIDUAL')).toHaveLength(1);
    expect(sheet.rows.slice(1)).toEqual([
      ['PACKAGE', 'INDIVIDUAL', true, 'Individual'],
      ['PACKAGE', 'FAMILIAR_2', true, 'Familiar x 2'],
      ['PACKAGE', 'MULTIELEMENTO_2', true, 'Multielemento x 2'],
      ['PACKAGE', 'FAMILIAR_3', true, 'Familiar x 3'],
      ['PACKAGE', 'MULTIELEMENTO_3', true, 'Multielemento x 3'],
      ['SERVICE_TYPE', 'PRESENTATION', true, 'Fotos de la presentación'],
      ['SERVICE_TYPE', 'PRESENTATION_AND_PORTRAITS', true, 'Fotos de la presentación + retratos'],
      ['DELIVERY', 'IMMEDIATE', true, 'Entrega Inmediata'],
      ['DELIVERY', 'PRIORITY', true, 'Entrega Prioritaria'],
      ['DELIVERY', 'STANDARD', true, 'Entrega Estándar']
    ]);
  });

  it('preserves an existing inactive package row and does not add a duplicate', () => {
    const spreadsheet = new FakeSpreadsheet();
    const sheet = spreadsheet.insertSheet('Config');
    sheet.rows = [
      ['type', 'code', 'isActive', 'description'],
      ['PACKAGE', 'FAMILIAR_2', false, 'Familiar x 2']
    ];

    const repository = new SheetsOrderCatalogRepository(spreadsheet as never);
    repository.isAllowedPackage('FAMILIAR_2');

    const familiarRows = sheet.rows.filter((row) => row[1] === 'FAMILIAR_2');
    expect(familiarRows).toHaveLength(1);
    expect(familiarRows[0]).toEqual(['PACKAGE', 'FAMILIAR_2', false, 'Familiar x 2']);
  });

  it('adds missing service and delivery defaults when all package rows already exist', () => {
    const spreadsheet = new FakeSpreadsheet();
    const sheet = spreadsheet.insertSheet('Config');
    sheet.rows = [
      ['type', 'code', 'isActive', 'description'],
      ...DEFAULT_PACKAGES.map((row) => [...row])
    ];

    const repository = new SheetsOrderCatalogRepository(spreadsheet as never);
    repository.isAllowedPackage('INDIVIDUAL');

    expect(sheet.getLastRow()).toBe(11);
    expect(sheet.rows.slice(1)).toEqual(DEFAULT_CONFIG_ROWS.map((row) => [...row]));
  });

  it('preserves a custom description on an existing package row', () => {
    const spreadsheet = new FakeSpreadsheet();
    const sheet = spreadsheet.insertSheet('Config');
    sheet.rows = [
      ['type', 'code', 'isActive', 'description'],
      ['PACKAGE', 'INDIVIDUAL', true, 'Custom Prisma description']
    ];

    const repository = new SheetsOrderCatalogRepository(spreadsheet as never);
    repository.isAllowedPackage('INDIVIDUAL');

    const row = sheet.rows.find((candidate) => candidate[1] === 'INDIVIDUAL');
    expect(row).toEqual(['PACKAGE', 'INDIVIDUAL', true, 'Custom Prisma description']);
  });
});
