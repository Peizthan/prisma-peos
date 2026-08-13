import { RegisterOrderUseCase } from '../../application/use-cases/register-order';
import { toPeosError } from '../../application/errors/peos-error';
import { CriticalErrorEmailAlert } from '../../infrastructure/google/critical-error-email-alert';
import { DocumentLockRunner } from '../../infrastructure/google/document-lock-runner';
import { SheetsOrderCatalogRepository } from '../../infrastructure/google/sheets-order-catalog-repository';
import { SheetsOrderRepository } from '../../infrastructure/google/sheets-order-repository';
import { SheetsSystemLogger } from '../../infrastructure/google/sheets-system-logger';
import { mapFormSubmissionToRegisterOrderInput } from './form-mapping';

export function getSpreadsheetFromFormSubmitEvent(
  e: GoogleAppsScript.Events.SheetsOnFormSubmit
): GoogleAppsScript.Spreadsheet.Spreadsheet {
  const responseSheet = e.range?.getSheet?.();
  const parentSpreadsheet = responseSheet?.getParent?.();

  if (parentSpreadsheet) {
    return parentSpreadsheet;
  }

  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (activeSpreadsheet) {
    return activeSpreadsheet;
  }

  throw new Error('Form submit event has no parent spreadsheet and no active spreadsheet');
}

export function onFormSubmitHandler(e: GoogleAppsScript.Events.SheetsOnFormSubmit): void {
  const spreadsheet = getSpreadsheetFromFormSubmitEvent(e);
  const logger = new SheetsSystemLogger(spreadsheet);
  const alertService = new CriticalErrorEmailAlert(spreadsheet);
  const lockRunner = new DocumentLockRunner();
  const correlationId = buildCorrelationId(e);
  const responseSheet = e.range?.getSheet?.();
  const responseRow = e.range?.getRow();

  try {
    lockRunner.runWithLock('onFormSubmitHandler', () => {
      const input = mapFormSubmissionToRegisterOrderInput(e);
      const repository = new SheetsOrderRepository(spreadsheet);
      const catalogRepository = new SheetsOrderCatalogRepository(spreadsheet);
      const useCase = new RegisterOrderUseCase(repository, catalogRepository);

      const order = useCase.execute(input);
      if (responseSheet && typeof responseRow === 'number') {
        writeOrderIdOnResponseSheet(responseSheet, responseRow, order.orderId);
      }

      logger.info({
        code: 'ORDER_REGISTERED',
        operation: 'onFormSubmitHandler',
        message: 'Order registered successfully',
        correlationId,
        context: {
          orderId: order.orderId,
          eventCode: order.eventCode,
          sourceResponseId: order.sourceResponseId
        }
      });
    });
  } catch (error) {
    const peosError = toPeosError(error, {
      code: 'UNEXPECTED_ERROR',
      operation: 'onFormSubmitHandler',
      retryable: false,
      context: {
        correlationId,
        responseSheet: responseSheet?.getName() ?? 'UNKNOWN',
        responseRow: responseRow ?? 'UNKNOWN'
      }
    });

    logger.error(peosError, correlationId);

    try {
      const wasNotified = alertService.notifyIfCritical(peosError, correlationId);
      if (wasNotified) {
        logger.info({
          code: 'CRITICAL_ALERT_SENT',
          operation: 'onFormSubmitHandler',
          message: 'Critical error alert email sent',
          correlationId,
          context: {
            errorCode: peosError.code
          }
        });
      }
    } catch (alertError) {
      const alertFailure = toPeosError(alertError, {
        code: 'ALERT_FAILURE',
        operation: 'onFormSubmitHandler',
        retryable: false,
        context: {
          correlationId,
          originalErrorCode: peosError.code
        }
      });

      logger.error(alertFailure, correlationId);
    }

    throw peosError;
  }
}

function buildCorrelationId(e: GoogleAppsScript.Events.SheetsOnFormSubmit): string {
  const row = e.range?.getRow?.() ?? 0;
  const timestamp = Date.now();
  return `TRG-${row}-${timestamp}`;
}

function writeOrderIdOnResponseSheet(
  responseSheet: GoogleAppsScript.Spreadsheet.Sheet,
  row: number,
  orderId: string
): void {
  const headerRow =
    responseSheet.getRange(1, 1, 1, responseSheet.getMaxColumns()).getValues()[0] ?? [];
  let orderIdColumn = headerRow.findIndex((header) => header === 'Order ID');

  if (orderIdColumn === -1) {
    orderIdColumn = responseSheet.getLastColumn();
    responseSheet.getRange(1, orderIdColumn + 1).setValue('Order ID');
  }

  responseSheet.getRange(row, orderIdColumn + 1).setValue(orderId);
}
