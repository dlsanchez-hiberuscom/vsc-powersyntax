export const EXTENSION_DISPLAY_NAME = 'VSC PowerSyntax';

export const LANGUAGE_ID = 'powerbuilder';

export const SERVER_ID = 'vscPowerSyntax';
export const SERVER_NAME = 'VSC PowerSyntax Language Server';

export const DIAGNOSTIC_SOURCE = 'vsc-powersyntax';

export type ServerTraceLevel = 'off' | 'messages' | 'verbose';

export interface VscPowerSyntaxDiagnosticsSettings {
  enable: boolean;
}

export interface VscPowerSyntaxTraceSettings {
  server: ServerTraceLevel;
}

export interface VscPowerSyntaxSettings {
  diagnostics: VscPowerSyntaxDiagnosticsSettings;
  trace: VscPowerSyntaxTraceSettings;
}

export const DEFAULT_SETTINGS: VscPowerSyntaxSettings = {
  diagnostics: {
    enable: true
  },
  trace: {
    server: 'off'
  }
};

// ---------------------------------------------------------------------------
// Notificación de progreso (servidor → cliente) para la barra de estado.
// ---------------------------------------------------------------------------

/** Identificador de la notificación LSP custom de progreso. */
export const PROGRESS_NOTIFICATION = 'vscPowerSyntax/progress';

/**
 * Fases del ciclo de vida de la indexación reportadas a la UI.
 *
 * - `discovering`: discovery del workspace en curso.
 * - `indexing`: indexación de archivos en curso.
 * - `partial`: indexación interrumpida (cancelada o parcial).
 * - `ready`: indexación completada con éxito.
 * - `idle`: sin trabajo activo (ocultar UI).
 */
export type ProgressPhase =
  | 'discovering'
  | 'indexing'
  | 'partial'
  | 'degraded'
  | 'ready'
  | 'idle';

export type ProgressPass = 'structural' | 'enriched';

export interface ProgressNotification {
  phase: ProgressPhase;
  current?: number;
  total?: number;
  message?: string;
  pass?: ProgressPass;
  degraded?: boolean;
  skipped?: number;
  failed?: number;
  budgetMs?: number;
}