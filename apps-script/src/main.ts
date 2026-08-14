import { onFormSubmitHandler } from './interfaces/triggers/on-form-submit';
import { SheetsOrderRepository } from './infrastructure/google/sheets-order-repository';
import { SheetsOrderCatalogRepository } from './infrastructure/google/sheets-order-catalog-repository';
import { SheetsSystemLogger } from './infrastructure/google/sheets-system-logger';
import { RegisterOrderUseCase } from './application/use-cases/register-order';
import { toPeosError } from './application/errors/peos-error';
import { parsePackage, parseServiceType, parseDelivery, parsePixiesetSelection } from './interfaces/triggers/form-mapping';

const TARGET_SPREADSHEET_ID = '1fJ37oX1R1FfnIZcBeewEBqLZFPZ49FRwcI-4b81XQ18';
const TARGET_SPREADSHEET_PROPERTY = 'PEOS_SPREADSHEET_ID';

function onFormSubmit(e: GoogleAppsScript.Events.SheetsOnFormSubmit): void {
  onFormSubmitHandler(e);
}

function getTargetSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
  const configuredId = PropertiesService.getScriptProperties().getProperty(TARGET_SPREADSHEET_PROPERTY);
  const spreadsheetId = configuredId && configuredId.trim().length > 0 ? configuredId : TARGET_SPREADSHEET_ID;
  return SpreadsheetApp.openById(spreadsheetId);
}

function installOnFormSubmitTrigger(): void {
  const spreadsheet = getTargetSpreadsheet();
  const existingTrigger = ScriptApp.getProjectTriggers().find(
    (trigger) =>
      trigger.getHandlerFunction() === 'onFormSubmit' &&
      trigger.getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT &&
      trigger.getTriggerSourceId() === spreadsheet.getId()
  );

  if (existingTrigger) {
    return;
  }

  ScriptApp.newTrigger('onFormSubmit').forSpreadsheet(spreadsheet).onFormSubmit().create();
}

function deleteOnFormSubmitTriggers(): void {
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === 'onFormSubmit')
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));
}

Object.assign(globalThis as unknown as Record<string, unknown>, {
  onFormSubmit,
  installOnFormSubmitTrigger,
  deleteOnFormSubmitTriggers,
  doPost
});

function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  const json = (result: object) =>
    ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);

  try {
    const body = JSON.parse(e.postData.contents) as {
      athleteFullName: string;
      guardianFullName: string;
      phoneWhatsapp: string;
      email: string;
      serviceType: string;
      packageName: string;
      delivery: string;
      pixieset: string;
      academyGroupClub?: string;
      observations?: string;
    };

    const spreadsheet = getTargetSpreadsheet();
    const logger = new SheetsSystemLogger(spreadsheet);
    const correlationId = `WEB-${Date.now()}`;

    const input = {
      athleteFullName: body.athleteFullName.trim(),
      guardianFullName: body.guardianFullName.trim(),
      phoneWhatsapp: body.phoneWhatsapp.trim(),
      email: body.email.trim().toLowerCase(),
      serviceTypeCode: parseServiceType(body.serviceType),
      packageCode: parsePackage(body.packageName),
      deliveryCode: parseDelivery(body.delivery),
      pixiesetSelection: parsePixiesetSelection(body.pixieset),
      ...(body.academyGroupClub?.trim() ? { academyGroupClub: body.academyGroupClub.trim() } : {}),
      ...(body.observations?.trim() ? { observations: body.observations.trim() } : {}),
      sourceResponseId: correlationId
    };

    const order = new RegisterOrderUseCase(
      new SheetsOrderRepository(spreadsheet),
      new SheetsOrderCatalogRepository(spreadsheet)
    ).execute(input);

    logger.info({
      code: 'ORDER_REGISTERED',
      operation: 'doPost',
      message: 'Order registered via web form',
      correlationId,
      context: { orderId: order.orderId, source: 'web' }
    });

    return json({ success: true, orderId: order.orderId });
  } catch (err) {
    const error = toPeosError(err, { code: 'UNEXPECTED_ERROR', operation: 'doPost', retryable: false });
    return json({ success: false, error: error.message });
  }
}
