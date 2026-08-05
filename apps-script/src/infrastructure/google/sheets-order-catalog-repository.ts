import { PeosError } from '../../application/errors/peos-error';
import type { OrderCatalogRepository } from '../../application/ports/order-catalog-repository';
import type { OrderPackage } from '../../domain/entities/order';

const CONFIG_HEADERS = ['type', 'code', 'isActive', 'description'] as const;

type ConfigType = 'PACKAGE' | 'EVENT';

interface CatalogEntry {
  type: ConfigType;
  code: string;
  isActive: boolean;
}

export class SheetsOrderCatalogRepository implements OrderCatalogRepository {
  constructor(
    private readonly spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
    private readonly sheetName = 'Config'
  ) {}

  hasActiveEventRestrictions(): boolean {
    const activeEvents = this.loadActiveEntriesByType('EVENT');
    return activeEvents.length > 0;
  }

  isAllowedEventCode(eventCode: string): boolean {
    const normalized = eventCode.trim().toUpperCase();
    const activeEvents = this.loadActiveEntriesByType('EVENT');
    return activeEvents.some((entry) => entry.code === normalized);
  }

  isAllowedPackage(packageCode: OrderPackage): boolean {
    const activePackages = this.loadActiveEntriesByType('PACKAGE');
    return activePackages.some((entry) => entry.code === packageCode);
  }

  private loadActiveEntriesByType(type: ConfigType): CatalogEntry[] {
    const sheet = this.ensureSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return [];
    }

    const values = sheet.getRange(2, 1, lastRow - 1, CONFIG_HEADERS.length).getValues();

    return values
      .map((row) => this.toEntry(row))
      .filter((entry): entry is CatalogEntry => entry !== undefined)
      .filter((entry) => entry.type === type && entry.isActive);
  }

  private toEntry(row: unknown[]): CatalogEntry | undefined {
    const rawType = row[0];
    const rawCode = row[1];
    const rawIsActive = row[2];

    if (typeof rawType !== 'string' || typeof rawCode !== 'string') {
      return undefined;
    }

    const normalizedType = rawType.trim().toUpperCase();
    if (normalizedType !== 'PACKAGE' && normalizedType !== 'EVENT') {
      return undefined;
    }

    const normalizedCode = rawCode.trim().toUpperCase();
    if (normalizedCode.length === 0) {
      return undefined;
    }

    return {
      type: normalizedType,
      code: normalizedCode,
      isActive: this.toBoolean(rawIsActive)
    };
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'si';
    }

    return false;
  }

  private ensureSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const existing = this.spreadsheet.getSheetByName(this.sheetName);
    if (existing) {
      this.ensureHeaders(existing);
      return existing;
    }

    const created = this.spreadsheet.insertSheet(this.sheetName);
    this.ensureHeaders(created);
    this.seedDefaults(created);
    return created;
  }

  private ensureHeaders(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, CONFIG_HEADERS.length).setValues([Array.from(CONFIG_HEADERS)]);
      return;
    }

    const currentHeaders = sheet.getRange(1, 1, 1, CONFIG_HEADERS.length).getValues()[0] ?? [];
    CONFIG_HEADERS.forEach((expectedHeader, index) => {
      const current = currentHeaders[index];
      const actualHeader = typeof current === 'string' ? current.trim() : '';

      if (actualHeader !== expectedHeader) {
        throw new PeosError('Config sheet header schema mismatch', {
          code: 'SHEET_SCHEMA_INVALID',
          operation: 'SheetsOrderCatalogRepository.ensureHeaders',
          retryable: false,
          context: {
            sheetName: this.sheetName,
            columnNumber: index + 1,
            expectedHeader,
            actualHeader
          }
        });
      }
    });
  }

  private seedDefaults(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
    sheet.getRange(2, 1, 3, CONFIG_HEADERS.length).setValues([
      ['PACKAGE', 'BASIC', true, 'Default package'],
      ['PACKAGE', 'PLUS', true, 'Default package'],
      ['PACKAGE', 'PREMIUM', true, 'Default package']
    ]);
  }
}
