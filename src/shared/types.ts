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