export class EventBus {
  private events: Map<string, Function[]> = new Map()

  on(event: string, handler: Function) {
    const handlers = this.events.get(event) || []
    handlers.push(handler)
    this.events.set(event, handlers)
  }

  off(event: string, handler: Function) {
    const handlers = this.events.get(event) || []
    this.events.set(
      event,
      handlers.filter((h) => h !== handler),
    )
  }

  emit(event: string, payload?: any) {
    const handlers = this.events.get(event) || []
    handlers.forEach((fn) => fn(payload))
  }
}

export function createBus() {
  return new EventBus()
}
