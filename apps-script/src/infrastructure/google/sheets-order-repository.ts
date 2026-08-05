import type { Order } from '../../domain/entities/order';
import type { OrderRepository } from '../../application/ports/order-repository';

const ORDER_HEADERS = [
  'orderId',
  'eventCode',
  'athleteFullName',
  'guardianFullName',
  'email',
  'packageCode',
  'createdAtIso',
  'sourceResponseId'
] as const;

export class SheetsOrderRepository implements OrderRepository {
  constructor(
    private readonly spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
    private readonly sheetName = 'Orders'
  ) {}

  nextSequenceForDay(eventCode: string, date: Date): number {
    const sheet = this.ensureSheet();
    const datePart = this.toDatePart(date);
    const prefix = `PEOS-${eventCode}-${datePart}-`;

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return 1;
    }

    const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    const maxSequence = values.reduce((max, row) => {
      const orderIdCell = row[0];
      if (typeof orderIdCell !== 'string' || !orderIdCell.startsWith(prefix)) {
        return max;
      }

      const sequence = Number(orderIdCell.slice(prefix.length));
      if (Number.isNaN(sequence)) {
        return max;
      }

      return Math.max(max, sequence);
    }, 0);

    return maxSequence + 1;
  }

  save(order: Order): void {
    const sheet = this.ensureSheet();
    sheet.appendRow([
      order.orderId,
      order.eventCode,
      order.athleteFullName,
      order.guardianFullName ?? '',
      order.email,
      order.packageCode,
      order.createdAtIso,
      order.sourceResponseId
    ]);
  }

  private ensureSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const existing = this.spreadsheet.getSheetByName(this.sheetName);
    if (existing) {
      this.ensureHeaders(existing);
      return existing;
    }

    const created = this.spreadsheet.insertSheet(this.sheetName);
    this.ensureHeaders(created);
    return created;
  }

  private ensureHeaders(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
    if (sheet.getLastRow() !== 0) {
      return;
    }

    sheet.getRange(1, 1, 1, ORDER_HEADERS.length).setValues([Array.from(ORDER_HEADERS)]);
  }

  private toDatePart(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
}
