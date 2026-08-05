import { onFormSubmitHandler } from './interfaces/triggers/on-form-submit';

function onFormSubmit(e: GoogleAppsScript.Events.SheetsOnFormSubmit): void {
  onFormSubmitHandler(e);
}

Object.assign(globalThis as unknown as Record<string, unknown>, {
  onFormSubmit
});
