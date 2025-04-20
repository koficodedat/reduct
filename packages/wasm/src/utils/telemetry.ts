/**
 * Telemetry utilities for WebAssembly
 */

/**
 * Telemetry event
 */
export interface TelemetryEvent {
  /**
   * Name of the event
   */
  name: string;
  
  /**
   * Timestamp of the event
   */
  timestamp: number;
  
  /**
   * Properties of the event
   */
  properties: Record<string, any>;
}

/**
 * Telemetry client for WebAssembly
 */
export class WasmTelemetry {
  private static instance: WasmTelemetry;
  private events: TelemetryEvent[] = [];
  private enabled = false;
  private listeners: Array<(event: TelemetryEvent) => void> = [];
  
  /**
   * Get the singleton instance of the telemetry client
   * @returns The telemetry client instance
   */
  public static getInstance(): WasmTelemetry {
    if (!WasmTelemetry.instance) {
      WasmTelemetry.instance = new WasmTelemetry();
    }
    return WasmTelemetry.instance;
  }
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}
  
  /**
   * Enable telemetry
   */
  public enable(): void {
    this.enabled = true;
  }
  
  /**
   * Disable telemetry
   */
  public disable(): void {
    this.enabled = false;
  }
  
  /**
   * Check if telemetry is enabled
   * @returns True if telemetry is enabled, false otherwise
   */
  public isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * Track an event
   * @param name Name of the event
   * @param properties Properties of the event
   */
  public trackEvent(name: string, properties: Record<string, any> = {}): void {
    if (!this.enabled) return;
    
    const event: TelemetryEvent = {
      name,
      timestamp: Date.now(),
      properties,
    };
    
    this.events.push(event);
    
    // Notify listeners
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in telemetry listener: ${error}`);
      }
    }
  }
  
  /**
   * Add a listener for telemetry events
   * @param listener The listener function
   */
  public addListener(listener: (event: TelemetryEvent) => void): void {
    this.listeners.push(listener);
  }
  
  /**
   * Remove a listener for telemetry events
   * @param listener The listener function to remove
   * @returns True if the listener was removed, false otherwise
   */
  public removeListener(listener: (event: TelemetryEvent) => void): boolean {
    const index = this.listeners.indexOf(listener);
    if (index >= 0) {
      this.listeners.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * Get all telemetry events
   * @returns The telemetry events
   */
  public getEvents(): TelemetryEvent[] {
    return [...this.events];
  }
  
  /**
   * Clear all telemetry events
   */
  public clear(): void {
    this.events = [];
  }
  
  /**
   * Get events by name
   * @param name Name of the events to get
   * @returns The events with the given name
   */
  public getEventsByName(name: string): TelemetryEvent[] {
    return this.events.filter(event => event.name === name);
  }
  
  /**
   * Get events by property value
   * @param property Name of the property
   * @param value Value of the property
   * @returns The events with the given property value
   */
  public getEventsByProperty(property: string, value: any): TelemetryEvent[] {
    return this.events.filter(event => event.properties[property] === value);
  }
  
  /**
   * Get events in a time range
   * @param startTime Start time (ms)
   * @param endTime End time (ms)
   * @returns The events in the given time range
   */
  public getEventsInTimeRange(startTime: number, endTime: number): TelemetryEvent[] {
    return this.events.filter(event => event.timestamp >= startTime && event.timestamp <= endTime);
  }
}
