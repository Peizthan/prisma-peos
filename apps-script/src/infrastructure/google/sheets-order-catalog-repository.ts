import { PeosError } from '../../application/errors/peos-error';
import type { OrderCatalogRepository } from '../../application/ports/order-catalog-repository';
import type { OrderPackage } from '../../domain/entities/order';

const CONFIG_HEADERS = ['type', 'code', 'isActive', 'description'] as const;
const DEFAULT_PACKAGE_DEFINITIONS = [
  ['PACKAGE', 'INDIVIDUAL', true, 'Individual'],
  ['PACKAGE', 'FAMILIAR_2', true, 'Familiar x 2'],
  ['PACKAGE', 'MULTIELEMENTO_2', true, 'Multielemento x 2'],
  ['PACKAGE', 'FAMILIAR_3', true, 'Familiar x 3'],
  ['PACKAGE', 'MULTIELEMENTO_3', true, 'Multielemento x 3']
] as const;
const DEFAULT_SERVICE_TYPE_DEFINITIONS = [
  ['SERVICE_TYPE', 'PRESENTATION', true, 'Fotos de la presentación'],
  ['SERVICE_TYPE', 'PRESENTATION_AND_PORTRAITS', true, 'Fotos de la presentación + retratos']
] as const;
const DEFAULT_DELIVERY_DEFINITIONS = [
  ['DELIVERY', 'IMMEDIATE', true, 'Entrega Inmediata'],
  ['DELIVERY', 'PRIORITY', true, 'Entrega Prioritaria'],
  ['DELIVERY', 'STANDARD', true, 'Entrega Estándar']
] as const;
const DEFAULT_CONFIG_ROWS = [...DEFAULT_PACKAGE_DEFINITIONS, ...DEFAULT_SERVICE_TYPE_DEFINITIONS, ...DEFAULT_DELIVERY_DEFINITIONS] as const;

type ConfigType = 'PACKAGE' | 'EVENT' | 'SERVICE_TYPE' | 'DELIVERY';

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

  isAllowedServiceType(serviceTypeCode: string): boolean {
    const activeServiceTypes = this.loadActiveEntriesByType('SERVICE_TYPE');
    return activeServiceTypes.some((entry) => entry.code === serviceTypeCode);
  }

  isAllowedDeliveryCode(deliveryCode: string): boolean {
    const activeDeliveries = this.loadActiveEntriesByType('DELIVERY');
    return activeDeliveries.some((entry) => entry.code === deliveryCode);
  }

  resolveActiveEventCode(): string {
    const activeEvents = this.loadActiveEntriesByType('EVENT');
    const firstEvent = activeEvents[0];
    if (!firstEvent) {
      return 'UNSPECIFIED';
    }
    return firstEvent.code;
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

  private ensureDefaultPackageRows(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
    const existingRows = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), CONFIG_HEADERS.length).getValues();
    const existingCodes = new Set<string>();

    existingRows.forEach((row) => {
      const entry = this.toEntry(row);
      if (!entry) {
        return;
      }
      existingCodes.add(`${entry.type}:${entry.code}`);
    });

    const missingRows = DEFAULT_CONFIG_ROWS.filter(([type, code]) => !existingCodes.has(`${type}:${code}`));
    if (missingRows.length === 0) {
      return;
    }

    const rowsToAppend = missingRows.map((row) => [...row]);
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, CONFIG_HEADERS.length).setValues(rowsToAppend);
  }

  private toEntry(row: unknown[]): CatalogEntry | undefined {
    const rawType = row[0];
    const rawCode = row[1];
    const rawIsActive = row[2];

    if (typeof rawType !== 'string' || typeof rawCode !== 'string') {
      return undefined;
    }

    const normalizedType = rawType.trim().toUpperCase();
    if (normalizedType !== 'PACKAGE' && normalizedType !== 'EVENT' && normalizedType !== 'SERVICE_TYPE' && normalizedType !== 'DELIVERY') {
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
      this.ensureDefaultPackageRows(existing);
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
    sheet.getRange(2, 1, DEFAULT_CONFIG_ROWS.length, CONFIG_HEADERS.length).setValues(
      DEFAULT_CONFIG_ROWS.map((row) => [...row])
    );
  }
}
