import type { Connection } from 'vscode-languageserver/node';

import { tryHandleBuildCommand, type BuildCommandHandlerContext } from './buildCommandHandlers';
import { tryHandleReportCommand, type ReportCommandHandlerContext } from './reportCommandHandlers';
import { tryHandleRuntimeCommand, type RuntimeCommandHandlerContext } from './runtimeCommandHandlers';

export interface ServerCommandHandlerRegistrationContext {
  connection: Connection;
  build: BuildCommandHandlerContext;
  report: ReportCommandHandlerContext;
  runtime: RuntimeCommandHandlerContext;
}

export function registerServerCommandHandler(context: ServerCommandHandlerRegistrationContext): void {
  const { connection, build, report, runtime } = context;

  connection.onExecuteCommand(async (params) => {
    const buildCommand = await tryHandleBuildCommand(params, build);
    if (buildCommand.handled) {
      return buildCommand.result ?? null;
    }

    const reportCommand = await tryHandleReportCommand(params, report);
    if (reportCommand.handled) {
      return reportCommand.result ?? null;
    }

    const runtimeCommand = await tryHandleRuntimeCommand(params, runtime);
    if (runtimeCommand.handled) {
      return runtimeCommand.result ?? null;
    }

    return null;
  });
}