'use client';

export const DATA_CHANGED_EVENT = 'kdsl:data-changed';
const CHANNEL_NAME = 'kdsl-data-events';
const STORAGE_KEY = 'kdsl:data-changed-at';

export function notifyDataChanged() {
  window.dispatchEvent(new Event(DATA_CHANGED_EVENT));

  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: DATA_CHANGED_EVENT, at: Date.now() });
    channel.close();
  }

  localStorage.setItem(STORAGE_KEY, String(Date.now()));
}

export function subscribeDataChanged(callback: () => void) {
  const onLocalEvent = () => callback();
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };

  window.addEventListener(DATA_CHANGED_EVENT, onLocalEvent);
  window.addEventListener('storage', onStorage);

  let channel: BroadcastChannel | null = null;
  if ('BroadcastChannel' in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => {
      if (event.data?.type === DATA_CHANGED_EVENT) callback();
    };
  }

  return () => {
    window.removeEventListener(DATA_CHANGED_EVENT, onLocalEvent);
    window.removeEventListener('storage', onStorage);
    channel?.close();
  };
}
