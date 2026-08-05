import { describe, expect, it } from 'vitest';
import { DailySequenceOrderIdGenerator } from '../../src/domain/services/order-id-generator';

describe('DailySequenceOrderIdGenerator', () => {
  it('builds PEOS id with event, yyyymmdd date and zero padded sequence', () => {
    const generator = new DailySequenceOrderIdGenerator();
    const generated = generator.generate({
      eventCode: 'MTYOPEN',
      date: new Date(2026, 7, 5, 10, 15, 0),
      sequence: 7
    });

    expect(generated).toBe('PEOS-MTYOPEN-20260805-0007');
  });

  it('keeps sequence width stable for larger numbers', () => {
    const generator = new DailySequenceOrderIdGenerator();
    const generated = generator.generate({
      eventCode: 'RUN2026',
      date: new Date(2026, 0, 9, 10, 0, 0),
      sequence: 1289
    });

    expect(generated).toBe('PEOS-RUN2026-20260109-1289');
  });
});
