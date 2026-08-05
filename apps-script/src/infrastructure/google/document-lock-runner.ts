import { PeosError } from '../../application/errors/peos-error';

const DEFAULT_LOCK_WAIT_MS = 15_000;

export class DocumentLockRunner {
  runWithLock<T>(operation: string, callback: () => T, timeoutMs = DEFAULT_LOCK_WAIT_MS): T {
    const lock = LockService.getDocumentLock();

    try {
      lock.waitLock(timeoutMs);
    } catch (error) {
      throw new PeosError('Could not acquire document lock in time', {
        code: 'LOCK_TIMEOUT',
        operation,
        retryable: true,
        context: { timeoutMs },
        cause: error
      });
    }

    try {
      return callback();
    } finally {
      lock.releaseLock();
    }
  }
}
