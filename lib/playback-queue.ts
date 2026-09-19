import type { QueueEntry } from "./playback";

export function removeQueueEntry(queue: QueueEntry[], id: string) {
  return queue.filter((entry) => entry.id !== id);
}

export function moveQueueEntry(queue: QueueEntry[], id: string, toIndex: number) {
  const fromIndex = queue.findIndex((entry) => entry.id === id);
  if (fromIndex < 0 || toIndex < 0 || toIndex >= queue.length || fromIndex === toIndex) return queue;
  const next = [...queue];
  const entry = next[fromIndex];
  next.splice(fromIndex, 1);
  next.splice(toIndex, 0, entry);
  return next;
}
