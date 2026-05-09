import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

export type SyntheticCorpusMode = 'smoke' | 'medium' | '10k';

export interface SyntheticCorpusProfile {
  mode: SyntheticCorpusMode;
  seed: number;
  fileCount: number;
  libraryCount: number;
}

export interface SyntheticCorpusMaterializationResult {
  rootDir: string;
  rootUri: string;
  workspaceUri: string;
  targetUri: string;
  metadataPath: string;
  files: string[];
  profile: SyntheticCorpusProfile;
}

export interface SyntheticCorpusMutationResult {
  metadataPath: string;
  mutatedFiles: string[];
  profile: SyntheticCorpusProfile;
  revision: number;
}

type SyntheticFileKind = 'userobject' | 'window' | 'menu' | 'datawindow' | 'application' | 'function' | 'pipeline';

interface SyntheticFileDescriptor {
  index: number;
  kind: SyntheticFileKind;
  extension: string;
  library: string;
  fileName: string;
}

const PROFILE_BY_MODE: Record<SyntheticCorpusMode, SyntheticCorpusProfile> = {
  smoke: {
    mode: 'smoke',
    seed: 41024,
    fileCount: 1024,
    libraryCount: 4,
  },
  medium: {
    mode: 'medium',
    seed: 44096,
    fileCount: 4096,
    libraryCount: 8,
  },
  '10k': {
    mode: '10k',
    seed: 50010,
    fileCount: 10_000,
    libraryCount: 20,
  },
};

function createLcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function toFileUri(filePath: string): string {
  return pathToFileURL(filePath).href;
}

function resolveProfile(mode: SyntheticCorpusMode): SyntheticCorpusProfile {
  return { ...PROFILE_BY_MODE[mode] };
}

function libraryName(index: number): string {
  return `lib_${String(index).padStart(2, '0')}.pbl`;
}

function fileKindForIndex(index: number): SyntheticFileKind {
  if (index % 48 === 0) {
    return 'pipeline';
  }
  if (index % 40 === 0) {
    return 'application';
  }
  if (index % 24 === 0) {
    return 'function';
  }
  if (index % 32 === 0) {
    return 'menu';
  }
  if (index % 16 === 0) {
    return 'datawindow';
  }
  if (index % 8 === 0) {
    return 'window';
  }
  return 'userobject';
}

function prefixForKind(kind: SyntheticFileKind): string {
  switch (kind) {
    case 'application':
      return 'a';
    case 'function':
      return 'gf';
    case 'pipeline':
      return 'p';
    case 'datawindow':
      return 'd';
    case 'window':
      return 'w';
    case 'menu':
      return 'm';
    case 'userobject':
    default:
      return 'u';
  }
}

function createFileRandom(profile: SyntheticCorpusProfile, revision: number, index: number): () => number {
  return createLcg(profile.seed + (revision * 4099) + index);
}

function describeSyntheticFile(profile: SyntheticCorpusProfile, index: number): SyntheticFileDescriptor {
  const kind = fileKindForIndex(index);
  const extension = extensionForKind(kind);
  const library = libraryName(index % profile.libraryCount);
  const fileName = `${prefixForKind(kind)}_syn_${index}.${extension}`;
  return {
    index,
    kind,
    extension,
    library,
    fileName,
  };
}

function createUserObjectSource(index: number, revision: number, random: () => number): string {
  const typeName = `u_syn_${index}`;
  const dependency = index > 0 ? `u_syn_${index - 1}` : 'nonvisualobject';
  const branch = Math.floor(random() * 1000);
  return [
    'forward',
    `global type ${typeName} from ${dependency}`,
    'end type',
    'end forward',
    '',
    `global type ${typeName} from ${dependency}`,
    `public function integer of_revision_${revision}(string as_mode);`,
    '  integer li_value',
    `  li_value = ${index + revision + branch}`,
    '  if as_mode = "sql" then',
    '    return li_value + Len("select count(*) from t_demo where id = :ai_id")',
    '  end if',
    '  return li_value',
    'end function',
    'end type',
  ].join('\n');
}

function createWindowSource(index: number, revision: number, random: () => number): string {
  const typeName = `w_syn_${index}`;
  const seed = Math.floor(random() * 1000);
  const dataWindowName = `d_syn_${Math.max(0, index - 1)}`;
  return [
    'forward',
    `global type ${typeName} from window`,
    'end type',
    'end forward',
    '',
    `global type ${typeName} from window`,
    'event open;call super::open;end event',
    `public function integer of_revision_${revision}();`,
    '  integer li_status',
    `  li_status = ${index + revision + seed}`,
    `  string ls_dw = "${dataWindowName}"`,
    '  if IsNull(ls_dw) then',
    '    return -1',
    '  end if',
    '  return li_status',
    'end function',
    'end type',
  ].join('\n');
}

function createApplicationSource(index: number, revision: number, random: () => number): string {
  const typeName = `a_syn_${index}`;
  const seed = Math.floor(random() * 1000);
  return [
    'forward',
    `global type ${typeName} from application`,
    'end type',
    'end forward',
    '',
    `global type ${typeName} from application`,
    `public function integer of_revision_${revision}();`,
    `  return ${index + revision + seed}`,
    'end function',
    `on ${typeName}.create`,
    `  integer li_boot = ${revision + seed}`,
    'end on',
    `on ${typeName}.destroy`,
    'end on',
    'end type',
  ].join('\n');
}

function createMenuSource(index: number, revision: number, random: () => number): string {
  const typeName = `m_syn_${index}`;
  const seed = Math.floor(random() * 1000);
  return [
    'forward',
    `global type ${typeName} from menu`,
    'end type',
    'end forward',
    '',
    `global type ${typeName} from menu`,
    `public function integer of_revision_${revision}();`,
    `  return ${index + revision + seed}`,
    'end function',
    'end type',
  ].join('\n');
}

function createFunctionSource(index: number, revision: number, random: () => number): string {
  const functionName = `gf_syn_${index}`;
  const seed = Math.floor(random() * 1000);
  return [
    `global function integer ${functionName} (string as_mode);`,
    'integer li_value',
    `li_value = ${index + revision + seed}`,
    'if as_mode = "sql" then',
    '  return li_value + Len("select count(*) from t_demo where id = :ai_id")',
    'end if',
    'return li_value',
    'end function',
  ].join('\n');
}

function createPipelineSource(index: number, revision: number, random: () => number): string {
  const typeName = `p_syn_${index}`;
  const seed = Math.floor(random() * 1000);
  return [
    'forward',
    `global type ${typeName} from pipeline`,
    'end type',
    'end forward',
    '',
    `global type ${typeName} from pipeline`,
    `public function integer of_revision_${revision}(long al_batch);`,
    `  return al_batch + ${index + revision + seed}`,
    'end function',
    'end type',
  ].join('\n');
}

function createDataWindowSource(index: number, random: () => number): string {
  const suffix = Math.floor(random() * 1000);
  return [
    'release 19;',
    'datawindow(units=0 timer_interval=0 color=1073741824 processing=1 HTMLDW=no)',
    `header(height=84 color="536870912" text="Synthetic ${index}")`,
    `summary(height=0 color="536870912")`,
    'footer(height=0 color="536870912")',
    `table(column=(type=char(32) update=yes key=yes name=id dbname="id_${suffix}"))`,
  ].join('\n');
}

function buildSyntheticSource(kind: SyntheticFileKind, index: number, revision: number, random: () => number): string {
  switch (kind) {
    case 'application':
      return createApplicationSource(index, revision, random);
    case 'function':
      return createFunctionSource(index, revision, random);
    case 'pipeline':
      return createPipelineSource(index, revision, random);
    case 'window':
      return createWindowSource(index, revision, random);
    case 'menu':
      return createMenuSource(index, revision, random);
    case 'datawindow':
      return createDataWindowSource(index, random);
    case 'userobject':
    default:
      return createUserObjectSource(index, revision, random);
  }
}

function extensionForKind(kind: SyntheticFileKind): string {
  switch (kind) {
    case 'application':
      return 'sra';
    case 'function':
      return 'srf';
    case 'pipeline':
      return 'srp';
    case 'window':
      return 'srw';
    case 'menu':
      return 'srm';
    case 'datawindow':
      return 'srd';
    case 'userobject':
    default:
      return 'sru';
  }
}

function buildExtensionSummary(files: readonly string[]): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const file of files) {
    const extension = path.extname(file).toLowerCase();
    summary[extension] = (summary[extension] ?? 0) + 1;
  }
  return summary;
}

async function writeSyntheticCorpusMetadata(
  metadataPath: string,
  profile: SyntheticCorpusProfile,
  revision: number,
  files: readonly string[],
  mutatedFiles = 0,
): Promise<void> {
  await fs.writeFile(metadataPath, JSON.stringify({
    mode: profile.mode,
    seed: profile.seed,
    fileCount: profile.fileCount,
    libraryCount: profile.libraryCount,
    revision,
    mutatedFiles,
    extensionSummary: buildExtensionSummary(files),
    generatedAt: new Date().toISOString(),
  }, null, 2), 'utf8');
}

function mutationIndexesForProfile(profile: SyntheticCorpusProfile): number[] {
  const indexes = new Set<number>();
  for (const anchor of [0, 1, 8, 16, 24, 32, 40]) {
    if (anchor < profile.fileCount) {
      indexes.add(anchor);
    }
  }

  const targetCount = Math.min(32, Math.max(indexes.size, Math.floor(profile.fileCount / 128)));
  const stride = Math.max(1, Math.floor(profile.fileCount / Math.max(1, targetCount)));
  for (let index = 0; indexes.size < targetCount && index < profile.fileCount; index += stride) {
    indexes.add(index);
  }

  return [...indexes].sort((left, right) => left - right);
}

export function getSyntheticCorpusProfile(mode: SyntheticCorpusMode): SyntheticCorpusProfile {
  return resolveProfile(mode);
}

export async function materializeSyntheticPowerBuilderCorpus(
  rootDir: string,
  mode: SyntheticCorpusMode,
  revision = 0,
): Promise<SyntheticCorpusMaterializationResult> {
  const profile = resolveProfile(mode);
  const files: string[] = [];
  const libraries = Array.from({ length: profile.libraryCount }, (_, index) => libraryName(index));
  const workspacePath = path.join(rootDir, 'app.pbw');
  const targetPath = path.join(rootDir, 'app.pbt');
  const metadataPath = path.join(rootDir, 'synthetic-corpus.metadata.json');

  await fs.rm(rootDir, { recursive: true, force: true });
  await fs.mkdir(rootDir, { recursive: true });
  await fs.writeFile(workspacePath, 'app.pbt\n', 'utf8');
  await fs.writeFile(targetPath, `${libraries.join('\n')}\n`, 'utf8');

  for (const library of libraries) {
    await fs.mkdir(path.join(rootDir, library), { recursive: true });
  }

  for (let index = 0; index < profile.fileCount; index++) {
    const descriptor = describeSyntheticFile(profile, index);
    const filePath = path.join(rootDir, descriptor.library, descriptor.fileName);
    const source = buildSyntheticSource(descriptor.kind, index, revision, createFileRandom(profile, revision, index));
    await fs.writeFile(filePath, source, 'utf8');
    files.push(filePath);
  }

  await writeSyntheticCorpusMetadata(metadataPath, profile, revision, files);

  return {
    rootDir,
    rootUri: toFileUri(rootDir),
    workspaceUri: toFileUri(workspacePath),
    targetUri: toFileUri(targetPath),
    metadataPath,
    files,
    profile,
  };
}

export async function mutateSyntheticPowerBuilderCorpus(
  rootDir: string,
  mode: SyntheticCorpusMode,
  revision: number,
): Promise<SyntheticCorpusMutationResult> {
  const profile = resolveProfile(mode);
  const metadataPath = path.join(rootDir, 'synthetic-corpus.metadata.json');
  const mutatedFiles: string[] = [];

  for (const index of mutationIndexesForProfile(profile)) {
    const descriptor = describeSyntheticFile(profile, index);
    const filePath = path.join(rootDir, descriptor.library, descriptor.fileName);
    const source = buildSyntheticSource(descriptor.kind, index, revision, createFileRandom(profile, revision, index));
    await fs.writeFile(filePath, source, 'utf8');
    mutatedFiles.push(filePath);
  }

  const files = Array.from({ length: profile.fileCount }, (_, index) => {
    const descriptor = describeSyntheticFile(profile, index);
    return path.join(rootDir, descriptor.library, descriptor.fileName);
  });
  await writeSyntheticCorpusMetadata(metadataPath, profile, revision, files, mutatedFiles.length);

  return {
    metadataPath,
    mutatedFiles,
    profile,
    revision,
  };
}