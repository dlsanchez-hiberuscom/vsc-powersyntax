/**
 * Primitivas de cancelación cooperativa.
 *
 * Proporciona un patrón simple de CancellationToken / CancellationSource
 * para permitir que operaciones de larga duración sean cancelables.
 *
 * @module runtime/cancellation
 */

/**
 * Un token que puede ser consultado para verificar si ha habido una cancelación.
 * los consumidores pueden consultar `isCancelled` o registrar un callback vía `onCancelled`.
 */
export interface CancellationToken {
  readonly isCancelled: boolean;
  onCancelled(callback: () => void): void;
}

/**
 * Una fuente que produce un CancellationToken y puede cancelarlo.
 */
export interface CancellationSource {
  readonly token: CancellationToken;
  cancel(): void;
  dispose(): void;
}

/**
 * Un token que nunca se cancela. Úsalo como valor por defecto cuando no
 * se necesite soporte de cancelación.
 */
export const CancellationToken_None: CancellationToken = {
  isCancelled: false,
  onCancelled(_callback: () => void): void {
    // Nunca se ejecuta: este token es permanente.
  }
};

/**
 * Crea una nueva CancellationSource con un token fresco.
 */
export function createCancellationSource(): CancellationSource {
  let cancelled = false;
  const callbacks: Array<() => void> = [];

  const token: CancellationToken = {
    get isCancelled(): boolean {
      return cancelled;
    },

    onCancelled(callback: () => void): void {
      if (cancelled) {
        callback();
        return;
      }
      callbacks.push(callback);
    }
  };

  return {
    token,

    cancel(): void {
      if (cancelled) {
        return;
      }
      cancelled = true;
      for (const cb of callbacks) {
        try {
          cb();
        } catch {
          // Ignorar errores en los callbacks para no romper la cadena de cancelación.
        }
      }
      callbacks.length = 0;
    },

    dispose(): void {
      callbacks.length = 0;
    }
  };
}
