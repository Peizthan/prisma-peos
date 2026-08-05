import type { PeosError, PeosErrorCode } from '../../application/errors/peos-error';

const CRITICAL_ERROR_CODES: ReadonlySet<PeosErrorCode> = new Set([
  'LOCK_TIMEOUT',
  'SHEET_SCHEMA_INVALID',
  'UNEXPECTED_ERROR'
]);

const ALERT_EMAILS_PROPERTY = 'PEOS_ALERT_EMAILS';
const CONFIG_HEADERS = ['type', 'code', 'isActive', 'description'] as const;

export class CriticalErrorEmailAlert {
  constructor(
    private readonly spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
    private readonly configSheetName = 'Config'
  ) {}

  notifyIfCritical(error: PeosError, correlationId: string): boolean {
    if (!CRITICAL_ERROR_CODES.has(error.code)) {
      return false;
    }

    const recipients = this.resolveRecipients();
    if (recipients.length === 0) {
      return false;
    }

    const subject = `[PEOS][CRITICAL] ${error.code} - ${error.operation}`;
    const body = this.buildBody(error, correlationId);

    MailApp.sendEmail({
      to: recipients.join(','),
      subject,
      body
    });

    return true;
  }

  private resolveRecipients(): string[] {
    const propertyRecipients = this.loadRecipientsFromProperties();
    if (propertyRecipients.length > 0) {
      return propertyRecipients;
    }

    return this.loadRecipientsFromConfigSheet();
  }

  private loadRecipientsFromProperties(): string[] {
    const raw = PropertiesService.getScriptProperties().getProperty(ALERT_EMAILS_PROPERTY);
    if (!raw) {
      return [];
    }

    return raw
      .split(/[;,]/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
  }

  private loadRecipientsFromConfigSheet(): string[] {
    const sheet = this.spreadsheet.getSheetByName(this.configSheetName);
    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }

    const headers = sheet.getRange(1, 1, 1, CONFIG_HEADERS.length).getValues()[0] ?? [];
    const isCompatibleHeader = CONFIG_HEADERS.every((expectedHeader, index) => {
      const value = headers[index];
      return typeof value === 'string' && value.trim() === expectedHeader;
    });

    if (!isCompatibleHeader) {
      return [];
    }

    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, CONFIG_HEADERS.length).getValues();

    return values
      .map((row) => {
        const type = row[0];
        const code = row[1];
        const isActive = row[2];

        if (typeof type !== 'string' || type.trim().toUpperCase() !== 'ALERT_EMAIL') {
          return undefined;
        }

        if (typeof code !== 'string' || code.trim().length === 0) {
          return undefined;
        }

        if (!this.toBoolean(isActive)) {
          return undefined;
        }

        return code.trim();
      })
      .filter((email): email is string => email !== undefined);
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

  private buildBody(error: PeosError, correlationId: string): string {
    const lines = [
      'PEOS critical operational error detected.',
      '',
      `timestampIso: ${new Date().toISOString()}`,
      `correlationId: ${correlationId}`,
      `code: ${error.code}`,
      `operation: ${error.operation}`,
      `retryable: ${String(error.retryable)}`,
      `message: ${error.message}`,
      `spreadsheetUrl: ${this.spreadsheet.getUrl()}`,
      '',
      `context: ${JSON.stringify(error.context)}`
    ];

    return lines.join('\n');
  }
}
