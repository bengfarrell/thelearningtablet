/**
 * Generic EventEmitter base class
 * Provides type-safe event emission and listening
 */

type EventCallback<T = any> = (data: T) => void;

export class EventEmitter<EventMap extends Record<string, any> = Record<string, any>> {
  private listeners: Map<keyof EventMap, Set<EventCallback>> = new Map();

  /**
   * Register an event listener
   */
  on<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove an event listener
   */
  off<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Register a one-time event listener
   */
  once<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void {
    const onceCallback = (data: EventMap[K]) => {
      callback(data);
      this.off(event, onceCallback as EventCallback<EventMap[K]>);
    };
    this.on(event, onceCallback as EventCallback<EventMap[K]>);
  }

  /**
   * Emit an event
   */
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Clear all event listeners
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * Clear listeners for a specific event
   */
  clearEvent<K extends keyof EventMap>(event: K): void {
    this.listeners.delete(event);
  }
}

