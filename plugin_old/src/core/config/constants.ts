export const PB_LANGUAGE_ID = 'powerbuilder';
export const PB_FILE_EXTENSIONS = ['.sru', '.srw', '.srm', '.sra', '.srs', '.srf', '.srd', '.srp', '.srj', '.srq'];
export const PB_DATAWINDOW_FILE_EXTENSION = '.srd';
export const PB_IDE_SAFE_FILE_EXTENSIONS = PB_FILE_EXTENSIONS.filter(
	extension => extension !== PB_DATAWINDOW_FILE_EXTENSION,
);
export const PB_SELECTOR: { language: string; scheme: string } = { language: PB_LANGUAGE_ID, scheme: 'file' };
