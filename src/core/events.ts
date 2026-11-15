import type { DataLogId, ModuleId, SampleId } from './gameState';

export class EventBus<E extends Record<string, unknown>> {
  private handlers = new Map<keyof E, Set<(payload: never) => void>>();

  on<K extends keyof E>(key: K, fn: (payload: E[K]) => void): () => void {
    let set = this.handlers.get(key);
    if (!set) this.handlers.set(key, (set = new Set()));
    set.add(fn as (payload: never) => void);
    return () => set!.delete(fn as (payload: never) => void);
  }

  emit<K extends keyof E>(key: K, payload: E[K]): void {
    this.handlers.get(key)?.forEach((fn) => (fn as (p: E[K]) => void)(payload));
  }
}

export type GameEvents = {
  moduleInstalled: ModuleId;
  sampleAdded: SampleId;
  dataLogged: DataLogId;
  flagSet: string;
  cardUnlocked: string;
};
