/**
 * Guards de generación para prevenir commits stale tras cancelación.
 *
 * Cada tarea identificada por un ID tiene un counter de generación.
 * Cuando una tarea es cancelada se incrementa la generación;
 * compromisos pendientes comprueban si su generación sigue siendo la actual.
 */

export class GenerationGuard {
  private gen = 0;

  increment(): number {
    this.gen++;
    return this.gen;
  }

  current(): number {
    return this.gen;
  }

  isStale(generation: number): boolean {
    return generation < this.gen;
  }

  isCurrent(generation: number): boolean {
    return !this.isStale(generation);
  }
}

export class SchedulerGenerationRegistry {
  private readonly guards = new Map<string, GenerationGuard>();

  getGuard(id: string): GenerationGuard {
    let guard = this.guards.get(id);
    if (!guard) {
      guard = new GenerationGuard();
      this.guards.set(id, guard);
    }
    return guard;
  }

  cancelGeneration(id: string): number {
    return this.getGuard(id).increment();
  }

  clearGuard(id: string): void {
    this.guards.delete(id);
  }

  clear(): void {
    this.guards.clear();
  }
}
