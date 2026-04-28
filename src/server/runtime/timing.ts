/**
 * Utilidades de cronometraje para medir la duración de las operaciones.
 *
 * Proporciona envoltorios ligeros sobre `performance.now()` para
 * la medición y el registro consistentes de los costes de las operaciones.
 *
 * @module runtime/timing
 */

export interface TimingResult<T> {
  result: T;
  elapsedMs: number;
}

/**
 * Mide el tiempo de ejecución de una función síncrona.
 * Devuelve tanto el resultado como el tiempo transcurrido en milisegundos.
 */
export function measureMs<T>(fn: () => T): TimingResult<T> {
  const start = performance.now();
  const result = fn();
  const elapsedMs = performance.now() - start;
  return { result, elapsedMs };
}

/**
 * Mide el tiempo de ejecución de una función asíncrona.
 * Devuelve tanto el resultado como el tiempo transcurrido en milisegundos.
 */
export async function measureMsAsync<T>(fn: () => Promise<T>): Promise<TimingResult<T>> {
  const start = performance.now();
  const result = await fn();
  const elapsedMs = performance.now() - start;
  return { result, elapsedMs };
}

/**
 * Formatea un resultado de cronometraje como una cadena de registro estructurada.
 */
export function formatTiming(label: string, elapsedMs: number): string {
  return `[TIEMPO] ${label}: ${elapsedMs.toFixed(2)}ms`;
}

/**
 * Rastrea las primeras invocaciones para medir el "tiempo hasta el primer X".
 */
export class FirstInvocationTracker {
  private readonly seen = new Set<string>();

  /**
   * Devuelve true y marca la etiqueta como vista si es la primera llamada.
   * Devuelve false en las llamadas posteriores con la misma etiqueta.
   */
  isFirst(label: string): boolean {
    if (this.seen.has(label)) {
      return false;
    }
    this.seen.add(label);
    return true;
  }

  reset(): void {
    this.seen.clear();
  }
}
