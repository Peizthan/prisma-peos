import type { PeosError } from '../../application/errors/peos-error';

type LogSeverity = 'INFO' | 'ERROR';

interface StructuredLogEntry {
  severity: LogSeverity;
  code: string;
  operation: string;
  message: string;
  correlationId: string;
  context: Record<string, unknown>;
  stackTrace?: string;
}

const LOG_HEADERS = [
  'timestampIso',
  'severity',
  'code',
  'operation',
  'message',
  'correlationId',
  'contextJson',
  'stackTrace'
] as const;

export class SheetsSystemLogger {
  constructor(
    private readonly spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
    private readonly sheetName = 'SystemLogs'
  ) {}

  info(params: {
    code: string;
    operation: string;
    message: string;
    correlationId: string;
    context?: Record<string, unknown>;
  }): void {
    this.log({
      severity: 'INFO',
      code: params.code,
      operation: params.operation,
      message: params.message,
      correlationId: params.correlationId,
      context: params.context ?? {}
    });
  }

  error(error: PeosError, correlationId: string): void {
    this.log({
      severity: 'ERROR',
      code: error.code,
      operation: error.operation,
      message: error.message,
      correlationId,
      context: {
        ...error.context,
        retryable: error.retryable
      },
      ...(error.stack ? { stackTrace: error.stack } : {})
    });
  }

  private log(entry: StructuredLogEntry): void {
    const sheet = this.ensureSheet();

    sheet.appendRow([
      new Date().toISOString(),
      entry.severity,
      entry.code,
      entry.operation,
      entry.message,
      entry.correlationId,
      JSON.stringify(entry.context),
      entry.stackTrace ?? ''
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

    sheet.getRange(1, 1, 1, LOG_HEADERS.length).setValues([Array.from(LOG_HEADERS)]);
  }
}
