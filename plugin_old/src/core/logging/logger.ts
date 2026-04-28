import * as vscode from 'vscode';

export class Logger {
    private static _channel: vscode.OutputChannel;

    static get outputChannel(): vscode.OutputChannel {
        return Logger._channel;
    }

    static initialize(): void {
        if (!Logger._channel) {
            Logger._channel = vscode.window.createOutputChannel('PowerBuilder');
        }
    }

    static info(msg: string): void {
        Logger._channel?.appendLine(`[INFO]  ${msg}`);
    }

    static warn(msg: string): void {
        Logger._channel?.appendLine(`[WARN]  ${msg}`);
    }

    static error(msg: string, err?: unknown): void {
        const detail = err instanceof Error ? err.message : String(err ?? '');
        Logger._channel?.appendLine(`[ERROR] ${msg} ${detail}`);
    }
}
