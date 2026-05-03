export * from './json';
export * from './http';
export * from './rest';
export * from './oauth';
export * from './pdf';
export * from './filesystem';
export * from './compression';
export * from './crypto';
export * from './dotnet';

import { PbSystemSymbolEntry } from '../../types';
import {
	PB_MANUAL_CORE_INTEGRATION_COMPRESSION_TYPES,
} from './compression';
import {
	PB_MANUAL_CORE_INTEGRATION_CRYPTO_TYPES,
} from './crypto';
import {
	PB_MANUAL_CORE_INTEGRATION_DOTNET_TYPES,
} from './dotnet';
import {
	PB_MANUAL_CORE_INTEGRATION_FILESYSTEM_TYPES,
} from './filesystem';
import {
	PB_MANUAL_CORE_INTEGRATION_HTTP_TYPES,
} from './http';
import {
	PB_MANUAL_CORE_INTEGRATION_JSON_TYPES,
} from './json';
import {
	PB_MANUAL_CORE_INTEGRATION_OAUTH_TYPES,
} from './oauth';
import {
	PB_MANUAL_CORE_INTEGRATION_PDF_TYPES,
} from './pdf';
import {
	PB_MANUAL_CORE_INTEGRATION_REST_TYPES,
} from './rest';

export const PB_MANUAL_CORE_INTEGRATION_SYSTEM_OBJECT_DATATYPE_CATEGORIES: readonly string[] = [
	'JSON / HTTP / OAuth / REST',
	'PDF',
	'Filesystem',
	'Crypto / compression',
	'.NET interop',
];

export const PB_MANUAL_CORE_INTEGRATION_SYSTEM_OBJECT_DATATYPES: readonly PbSystemSymbolEntry[] = [
	...PB_MANUAL_CORE_INTEGRATION_JSON_TYPES,
	...PB_MANUAL_CORE_INTEGRATION_HTTP_TYPES,
	...PB_MANUAL_CORE_INTEGRATION_REST_TYPES,
	...PB_MANUAL_CORE_INTEGRATION_OAUTH_TYPES,
	...PB_MANUAL_CORE_INTEGRATION_PDF_TYPES,
	...PB_MANUAL_CORE_INTEGRATION_FILESYSTEM_TYPES,
	...PB_MANUAL_CORE_INTEGRATION_COMPRESSION_TYPES,
	...PB_MANUAL_CORE_INTEGRATION_CRYPTO_TYPES,
	...PB_MANUAL_CORE_INTEGRATION_DOTNET_TYPES,
];