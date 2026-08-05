export interface OrderIdGenerator {
  generate(input: { eventCode: string; date: Date; sequence: number }): string;
}

export class DailySequenceOrderIdGenerator implements OrderIdGenerator {
  generate(input: { eventCode: string; date: Date; sequence: number }): string {
    const datePart = this.toDatePart(input.date);
    const sequencePart = String(input.sequence).padStart(4, '0');
    return `PEOS-${input.eventCode}-${datePart}-${sequencePart}`;
  }

  private toDatePart(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
}
