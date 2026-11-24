import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { todayISO } from '../domain/dates';
import { InvalidTransition } from '../domain/requests';
import { createInitialState, reducer, STATE_VERSION, type Action, type State } from './reducer';

const STORAGE_KEY = 'majlisna.state.v1';
const CHANNEL = 'majlisna-sync';

type Dispatch = (a: Action) => boolean;

interface StoreValue {
  state: State;
  /** Returns false (and reports the reason) when the action was refused. */
  dispatch: Dispatch;
}

const StoreContext = createContext<StoreValue | null>(null);

type ErrorListener = (message: string) => void;
const errorListeners = new Set<ErrorListener>();
export function onStoreError(fn: ErrorListener): () => void {
  errorListeners.add(fn);
  return () => errorListeners.delete(fn);
}

function load(): State {
  const fresh = () => createInitialState(todayISO(), Date.now());
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw) as State;
    if (parsed?.version !== STATE_VERSION || !Array.isArray(parsed.requests)) return fresh();
    return parsed;
  } catch {
    return fresh();
  }
}

function save(s: State) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* private window or full storage: the demo still works in memory */
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);
  const ref = useRef(state);
  const channel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel(CHANNEL);
    channel.current = ch;
    ch.onmessage = (ev: MessageEvent<State>) => {
      if (ev.data?.version !== STATE_VERSION) return;
      ref.current = ev.data;
      setState(ev.data);
    };
    return () => ch.close();
  }, []);

  // Another tab without BroadcastChannel support still catches up through the storage event.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const next = JSON.parse(e.newValue) as State;
        if (next.version === STATE_VERSION) {
          ref.current = next;
          setState(next);
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const dispatch = useCallback<Dispatch>((action) => {
    try {
      const next = reducer(ref.current, action);
      if (next === ref.current) return true;
      ref.current = next;
      setState(next);
      save(next);
      channel.current?.postMessage(next);
      return true;
    } catch (e) {
      const message = e instanceof InvalidTransition ? e.message : 'Something went wrong. Try again.';
      errorListeners.forEach((fn) => fn(message));
      return false;
    }
  }, []);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(StoreContext);
  if (!v) throw new Error('useStore must be used inside <StoreProvider>');
  return v;
}
