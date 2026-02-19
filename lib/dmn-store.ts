/**
 * In-memory store for received DMNs. Used to display on the view page.
 * Does not affect URL generation.
 */
const MAX_DMNS = 100;
const store: Record<string, unknown>[] = [];

export function addDmn(data: Record<string, unknown>): void {
  store.unshift({ ...data, _receivedAt: new Date().toISOString() });
  if (store.length > MAX_DMNS) store.length = MAX_DMNS;
}

export function getRecentDmns(): Record<string, unknown>[] {
  return [...store];
}
