import { onFormSubmitHandler } from './interfaces/triggers/on-form-submit';

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
  deleteOnFormSubmitTriggers
});
