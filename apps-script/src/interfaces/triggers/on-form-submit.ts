import { RegisterOrderUseCase } from '../../application/use-cases/register-order';
import { SheetsOrderRepository } from '../../infrastructure/google/sheets-order-repository';
import { mapFormSubmissionToRegisterOrderInput } from './form-mapping';

export function onFormSubmitHandler(e: GoogleAppsScript.Events.SheetsOnFormSubmit): void {
  const input = mapFormSubmissionToRegisterOrderInput(e);
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const repository = new SheetsOrderRepository(spreadsheet);
  const useCase = new RegisterOrderUseCase(repository);

  const order = useCase.execute(input);
  writeOrderIdOnResponseSheet(e.range.getSheet(), e.range.getRow(), order.orderId);
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
