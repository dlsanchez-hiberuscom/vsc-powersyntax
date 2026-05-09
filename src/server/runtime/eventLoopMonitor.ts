import { monitorEventLoopDelay, performance } from 'node:perf_hooks';

export interface RuntimeEventLoopSnapshot {
  enabled: boolean;
  resolutionMs: number;
  samples?: number;
  utilization?: number;
  activeMs?: number;
  idleMs?: number;
  meanMs?: number;
  maxMs?: number;
  p95Ms?: number;
  p99Ms?: number;
}

function nanosecondsToMs(value: number): number {
  return value / 1_000_000;
}

export class RuntimeEventLoopMonitor {
  private readonly histogram;
  private enabled = false;
  private lastUtilization = performance.eventLoopUtilization();

  constructor(private readonly resolutionMs = 20) {
    this.histogram = monitorEventLoopDelay({ resolution: resolutionMs });
  }

  start(): void {
    if (this.enabled) {
      return;
    }

    this.lastUtilization = performance.eventLoopUtilization();
    this.histogram.enable();
    this.enabled = true;
  }

  stop(): void {
    if (!this.enabled) {
      return;
    }

    this.histogram.disable();
    this.histogram.reset();
    this.enabled = false;
  }

  snapshot(): RuntimeEventLoopSnapshot {
    if (!this.enabled) {
      return {
        enabled: false,
        resolutionMs: this.resolutionMs,
      };
    }

    const delta = performance.eventLoopUtilization(this.lastUtilization);
    this.lastUtilization = performance.eventLoopUtilization();

    const snapshot: RuntimeEventLoopSnapshot = {
      enabled: true,
      resolutionMs: this.resolutionMs,
      ...(typeof this.histogram.count === 'number' ? { samples: this.histogram.count } : {}),
      ...(typeof delta.utilization === 'number' ? { utilization: delta.utilization } : {}),
      ...(typeof delta.active === 'number' ? { activeMs: delta.active } : {}),
      ...(typeof delta.idle === 'number' ? { idleMs: delta.idle } : {}),
      ...(this.histogram.count > 0 ? {
        meanMs: nanosecondsToMs(this.histogram.mean),
        maxMs: nanosecondsToMs(this.histogram.max),
        p95Ms: nanosecondsToMs(this.histogram.percentile(95)),
        p99Ms: nanosecondsToMs(this.histogram.percentile(99)),
      } : {}),
    };

    this.histogram.reset();
    return snapshot;
  }
}