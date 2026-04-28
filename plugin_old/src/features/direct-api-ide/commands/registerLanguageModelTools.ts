import * as vscode from 'vscode';
import { Logger } from '../../../core/logging/logger';
import { getPowerBuilderLanguageModelToolDescriptors } from '../../../powerbuilder/contracts/languageModelTools';

interface VsCodeLanguageModelRuntime {
    lm?: {
        registerTool?: (name: string, tool: {
            invoke(options: { input: unknown }, token: vscode.CancellationToken): Promise<unknown> | unknown;
            prepareInvocation?(options: { input: unknown }, token: vscode.CancellationToken): unknown;
        }) => vscode.Disposable;
    };
    LanguageModelToolResult?: new (content: unknown[]) => unknown;
    LanguageModelDataPart?: {
        json?(value: unknown, mime?: string): unknown;
    };
    LanguageModelTextPart?: new (value: string) => unknown;
}

export function registerPowerBuilderLanguageModelTools(): vscode.Disposable[] {
    const runtime = vscode as typeof vscode & VsCodeLanguageModelRuntime;
    const registerTool = runtime.lm?.registerTool;
    const toolResultConstructor = runtime.LanguageModelToolResult;

    if (!registerTool || !toolResultConstructor) {
        Logger.info('PowerBuilder: el host actual no expone Language Model Tools registrados.');
        return [];
    }

    const toolDescriptors = getPowerBuilderLanguageModelToolDescriptors();
    const disposables: vscode.Disposable[] = [];

    for (const descriptor of toolDescriptors) {
        try {
            const disposable = registerTool(descriptor.name, {
                prepareInvocation() {
                    return {
                        invocationMessage: descriptor.invocationMessage,
                    };
                },
                async invoke(options) {
                    const commandArgs = descriptor.acceptsArguments
                        ? options.input
                        : undefined;
                    const result = await vscode.commands.executeCommand(
                        descriptor.command,
                        commandArgs,
                    );
                    const payload = result ?? {
                        kind: 'unsupported',
                        reason: 'La tool no recibió ningún resultado estructurado del comando delegado.',
                    };
                    const contentPart = runtime.LanguageModelDataPart?.json
                        ? runtime.LanguageModelDataPart.json(payload, 'application/json')
                        : runtime.LanguageModelTextPart
                            ? new runtime.LanguageModelTextPart(JSON.stringify(payload, null, 2))
                            : JSON.stringify(payload, null, 2);

                    return new toolResultConstructor([contentPart]);
                },
            });

            disposables.push(disposable);
        } catch (error) {
            Logger.warn(
                `PowerBuilder: no se pudo registrar la LM tool ${descriptor.name}: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    if (disposables.length > 0) {
        Logger.info(`PowerBuilder: registradas ${disposables.length} LM tools sobre la surface estable.`);
    }

    return disposables;
}