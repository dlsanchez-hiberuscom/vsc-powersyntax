import * as vscode from 'vscode';

const CONFIGURATION_NAMESPACE = 'vscPowerSyntax';

function getPowerSyntaxConfiguration(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(CONFIGURATION_NAMESPACE);
}

export function getWorkspaceSettingValue<T>(setting: string): T | undefined {
  return getPowerSyntaxConfiguration().inspect<T>(setting)?.workspaceValue;
}

export async function updateWorkspaceSettingValue(setting: string, value: unknown): Promise<void> {
  await getPowerSyntaxConfiguration().update(setting, value, vscode.ConfigurationTarget.Workspace);
}

export async function restoreSmokeWorkspaceBaseline(): Promise<void> {
  await updateWorkspaceSettingValue('profile', 'legacy-orca');
  await updateWorkspaceSettingValue('formatting.enabled', true);
  await updateWorkspaceSettingValue('formatting.formatOnSave', false);
}