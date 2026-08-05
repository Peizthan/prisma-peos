import { RegisterOrderUseCase } from '../../application/use-cases/register-order';
import { toPeosError } from '../../application/errors/peos-error';
import { DocumentLockRunner } from '../../infrastructure/google/document-lock-runner';
import { SheetsOrderRepository } from '../../infrastructure/google/sheets-order-repository';
import { SheetsSystemLogger } from '../../infrastructure/google/sheets-system-logger';
import { mapFormSubmissionToRegisterOrderInput } from './form-mapping';

export function onFormSubmitHandler(e: GoogleAppsScript.Events.SheetsOnFormSubmit): void {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const logger = new SheetsSystemLogger(spreadsheet);
  const lockRunner = new DocumentLockRunner();
  const correlationId = buildCorrelationId(e);

  try {
    lockRunner.runWithLock('onFormSubmitHandler', () => {
      const input = mapFormSubmissionToRegisterOrderInput(e);
      const repository = new SheetsOrderRepository(spreadsheet);
      const useCase = new RegisterOrderUseCase(repository);

      const order = useCase.execute(input);
      writeOrderIdOnResponseSheet(e.range.getSheet(), e.range.getRow(), order.orderId);

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
        responseSheet: e.range.getSheet().getName(),
        responseRow: e.range.getRow()
      }
    });

    logger.error(peosError, correlationId);
    throw peosError;
  }
}

function buildCorrelationId(e: GoogleAppsScript.Events.SheetsOnFormSubmit): string {
  const row = e.range.getRow();
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
