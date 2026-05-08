import * as nls from 'vscode-nls';

// Note: In the server, we might want to initialize this differently 
// if we want to support dynamic locale switching per request, 
// but for standard diagnostics, we follow the UI locale.
export const localize = nls.config({ messageFormat: nls.MessageFormat.file })();
