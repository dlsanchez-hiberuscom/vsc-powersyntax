import * as path from 'path';

import type {
  PbAutoBuildCapabilitySnapshot,
  PbAutoBuildDetectionSource,
  PbAutoBuildDetectionStatus
} from './pbAutoBuildDetection';

const PBAUTOBUILD_ENV_VAR = 'PB_AUTOBUILD_PATH';

export interface PbAutoBuildCiHelperInput {
  workspaceRootPath: string;
  helperRootPath: string;
  buildFilePath: string;
  profileLabel: string;
  representedProjectPath?: string;
  capability?: PbAutoBuildCapabilitySnapshot;
  generatedAt?: string;
}

export interface PbAutoBuildCiHelperFile {
  relativePath: string;
  content: string;
}

export interface PbAutoBuildCiHelperManifest {
  schemaVersion: 1;
  generatedAt: string;
  helperWorkspaceRelativePath: string;
  build: {
    profileLabel: string;
    buildFileWorkspaceRelativePath: string;
    buildFileHelperRelativePath: string;
    representedProjectWorkspaceRelativePath?: string;
  };
  command: {
    executableEnvVar: typeof PBAUTOBUILD_ENV_VAR;
    args: [string, string];
    helperScripts: {
      powershell: string;
      cmd: string;
      bash: string;
    };
  };
  localValidation: {
    toolingStatus: PbAutoBuildDetectionStatus;
    toolingSource: PbAutoBuildDetectionSource;
    versionLabel?: string;
    detail: string;
  };
}

export interface PbAutoBuildCiHelperBundle {
  helperWorkspaceRelativePath: string;
  manifest: PbAutoBuildCiHelperManifest;
  files: readonly PbAutoBuildCiHelperFile[];
}

export function suggestPbAutoBuildCiHelperDirectoryName(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'pbautobuild-ci-helper';
}

export function buildPbAutoBuildCiHelperBundle(
  input: PbAutoBuildCiHelperInput
): PbAutoBuildCiHelperBundle {
  const helperWorkspaceRelativePath = ensureNonEmptyPosixPath(
    path.relative(input.workspaceRootPath, input.helperRootPath)
  );
  const buildFileWorkspaceRelativePath = ensureNonEmptyPosixPath(
    path.relative(input.workspaceRootPath, input.buildFilePath)
  );
  const buildFileHelperRelativeNative = ensureNonEmptyNativePath(
    path.relative(input.helperRootPath, input.buildFilePath),
    path.basename(input.buildFilePath)
  );
  const buildFileHelperRelativePath = toPosixPath(buildFileHelperRelativeNative);
  const buildFileHelperRelativeWindowsPath = toWindowsPath(buildFileHelperRelativeNative);
  const representedProjectWorkspaceRelativePath = input.representedProjectPath
    ? ensureNonEmptyPosixPath(path.relative(input.workspaceRootPath, input.representedProjectPath))
    : undefined;
  const generatedAt = input.generatedAt ?? new Date().toISOString();

  const manifest: PbAutoBuildCiHelperManifest = {
    schemaVersion: 1,
    generatedAt,
    helperWorkspaceRelativePath,
    build: {
      profileLabel: input.profileLabel,
      buildFileWorkspaceRelativePath,
      buildFileHelperRelativePath,
      ...(representedProjectWorkspaceRelativePath
        ? { representedProjectWorkspaceRelativePath }
        : {})
    },
    command: {
      executableEnvVar: PBAUTOBUILD_ENV_VAR,
      args: ['/f', buildFileWorkspaceRelativePath],
      helperScripts: {
        powershell: `${helperWorkspaceRelativePath}/run-pbautobuild.ps1`,
        cmd: `${helperWorkspaceRelativePath}/run-pbautobuild.cmd`,
        bash: `${helperWorkspaceRelativePath}/run-pbautobuild.sh`
      }
    },
    localValidation: {
      toolingStatus: input.capability?.status ?? 'missing',
      toolingSource: input.capability?.source ?? 'unresolved',
      ...(input.capability?.versionLabel ? { versionLabel: input.capability.versionLabel } : {}),
      detail: input.capability?.detail ?? 'Helper exportado sin validación local del ejecutable.'
    }
  };

  return {
    helperWorkspaceRelativePath,
    manifest,
    files: [
      {
        relativePath: 'manifest.json',
        content: `${JSON.stringify(manifest, null, 2)}\n`
      },
      {
        relativePath: 'README.md',
        content: buildReadme(manifest)
      },
      {
        relativePath: 'run-pbautobuild.ps1',
        content: buildPowerShellScript(buildFileHelperRelativeWindowsPath)
      },
      {
        relativePath: 'run-pbautobuild.cmd',
        content: buildCmdScript(buildFileHelperRelativeWindowsPath)
      },
      {
        relativePath: 'run-pbautobuild.sh',
        content: buildBashScript(buildFileHelperRelativePath)
      }
    ]
  };
}

function buildReadme(manifest: PbAutoBuildCiHelperManifest): string {
  const lines = [
    `# PBAutoBuild CI helper - ${manifest.build.profileLabel}`,
    '',
    'Este bundle es agnostico del proveedor CI/CD. La idea es versionarlo dentro del repositorio y llamarlo desde cualquier pipeline sin meter logica del plugin en el runner.',
    '',
    '## Datos del perfil',
    '',
    `- Build file: ${manifest.build.buildFileWorkspaceRelativePath}`,
    ...(manifest.build.representedProjectWorkspaceRelativePath
      ? [`- Proyecto representado: ${manifest.build.representedProjectWorkspaceRelativePath}`]
      : []),
    `- Helper exportado en: ${manifest.helperWorkspaceRelativePath}`,
    '',
    '## Requisitos del runner',
    '',
    `- Definir ${PBAUTOBUILD_ENV_VAR} con la ruta absoluta a pbautobuild250.exe.`,
    '- Ejecutar el script desde un checkout del repositorio para que las rutas relativas al build file sigan siendo validas.',
    '',
    '## Scripts exportados',
    '',
    `- PowerShell: ${manifest.command.helperScripts.powershell}`,
    `- CMD: ${manifest.command.helperScripts.cmd}`,
    `- Bash: ${manifest.command.helperScripts.bash}`,
    '',
    '## Ejemplos de uso',
    '',
    '```powershell',
    `$env:${PBAUTOBUILD_ENV_VAR} = 'C:/Appeon/PowerBuilder 2025/pbautobuild250.exe'`,
    `powershell -ExecutionPolicy Bypass -File ${manifest.command.helperScripts.powershell}`,
    '```',
    '',
    '```bash',
    `export ${PBAUTOBUILD_ENV_VAR}="/c/Program Files/Appeon/PowerBuilder 2025/pbautobuild250.exe"`,
    `bash ${manifest.command.helperScripts.bash}`,
    '```',
    '',
    '## Validacion local registrada',
    '',
    `- Tooling: ${manifest.localValidation.toolingStatus}`,
    `- Origen: ${manifest.localValidation.toolingSource}`,
    ...(manifest.localValidation.versionLabel
      ? [`- Version detectada: ${manifest.localValidation.versionLabel}`]
      : []),
    `- Detalle: ${manifest.localValidation.detail}`,
    ''
  ];

  return `${lines.join('\n')}\n`;
}

function buildPowerShellScript(buildFileHelperRelativeWindowsPath: string): string {
  return [
    'param(',
    `  [string]$PbAutoBuildPath = $env:${PBAUTOBUILD_ENV_VAR}`,
    ')',
    '',
    "$ErrorActionPreference = 'Stop'",
    '',
    'if ([string]::IsNullOrWhiteSpace($PbAutoBuildPath)) {',
    `  throw 'Define ${PBAUTOBUILD_ENV_VAR} o pasa la ruta a pbautobuild250.exe como parametro.'`,
    '}',
    '',
    'if (-not (Test-Path -LiteralPath $PbAutoBuildPath)) {',
    `  throw "${PBAUTOBUILD_ENV_VAR} no existe: $PbAutoBuildPath"`,
    '}',
    '',
    '$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path',
    `$buildFile = [System.IO.Path]::GetFullPath((Join-Path $scriptRoot '${escapePowerShellSingleQuoted(buildFileHelperRelativeWindowsPath)}'))`,
    '',
    '& $PbAutoBuildPath /f $buildFile',
    'exit $LASTEXITCODE',
    ''
  ].join('\n');
}

function buildCmdScript(buildFileHelperRelativeWindowsPath: string): string {
  return [
    '@echo off',
    'setlocal',
    '',
    `set "PBAUTOBUILD_PATH=%${PBAUTOBUILD_ENV_VAR}%"`,
    'if not "%~1"=="" set "PBAUTOBUILD_PATH=%~1"',
    '',
    'if "%PBAUTOBUILD_PATH%"=="" (',
    `  echo Define ${PBAUTOBUILD_ENV_VAR} o pasa la ruta a pbautobuild250.exe como primer argumento. 1>&2`,
    '  exit /b 1',
    ')',
    '',
    'if not exist "%PBAUTOBUILD_PATH%" (',
    '  echo PBAUTOBUILD_PATH no existe: %PBAUTOBUILD_PATH% 1>&2',
    '  exit /b 1',
    ')',
    '',
    'set "SCRIPT_DIR=%~dp0"',
    `set "BUILD_FILE=%SCRIPT_DIR%${buildFileHelperRelativeWindowsPath}"`,
    '"%PBAUTOBUILD_PATH%" /f "%BUILD_FILE%"',
    'exit /b %ERRORLEVEL%',
    ''
  ].join('\n');
}

function buildBashScript(buildFileHelperRelativePath: string): string {
  return [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    '',
    `pb_autobuild_path="\${${PBAUTOBUILD_ENV_VAR}:-}"`,
    'if [[ -z "${pb_autobuild_path}" && $# -ge 1 ]]; then',
    '  pb_autobuild_path="$1"',
    'fi',
    '',
    'if [[ -z "${pb_autobuild_path}" ]]; then',
    `  echo "Define ${PBAUTOBUILD_ENV_VAR} o pasa la ruta a pbautobuild250.exe como primer argumento." >&2`,
    '  exit 1',
    'fi',
    '',
    'if [[ ! -f "${pb_autobuild_path}" ]]; then',
    `  echo "${PBAUTOBUILD_ENV_VAR} no existe: \${pb_autobuild_path}" >&2`,
    '  exit 1',
    'fi',
    '',
    'script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"',
    `build_file="\${script_dir}/${buildFileHelperRelativePath}"`,
    '',
    '"${pb_autobuild_path}" /f "${build_file}"',
    ''
  ].join('\n');
}

function ensureNonEmptyNativePath(value: string, fallback: string): string {
  return value && value !== '.' ? value : fallback;
}

function ensureNonEmptyPosixPath(value: string): string {
  const normalized = toPosixPath(value);
  return normalized && normalized !== '.' ? normalized : '.';
}

function toPosixPath(value: string): string {
  return value.replace(/\\/g, '/');
}

function toWindowsPath(value: string): string {
  return value.replace(/\//g, '\\');
}

function escapePowerShellSingleQuoted(value: string): string {
  return value.replace(/'/g, "''");
}