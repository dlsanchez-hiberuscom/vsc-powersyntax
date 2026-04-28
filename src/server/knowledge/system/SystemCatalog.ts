import { PbSystemSymbolEntry } from './types';
import { PB_MANUAL_CORE_GLOBAL_FUNCTIONS } from './manual/globalFunctions';
import { PB_MANUAL_CORE_OBJECT_FUNCTIONS } from './manual/objectFunctions';
import { PB_MANUAL_CORE_DATAWINDOW_FUNCTIONS } from './manual/dataWindowFunctions';
import { PB_MANUAL_CORE_SYSTEM_EVENTS } from './manual/systemEvents';
import { PB_MANUAL_CORE_DATAWINDOW_EVENTS } from './manual/dataWindowEvents';
import { PB_MANUAL_CORE_STATEMENTS } from './manual/statements';

/**
 * SystemCatalog consolida y expone el conocimiento estático del lenguaje PowerBuilder.
 * Indexa las funciones globales, funciones de objeto, eventos y keywords
 * cargadas desde los datasets manuales extraídos de los documentos oficiales.
 */
export class SystemCatalog {
  // Mapa de clave de búsqueda en minúsculas -> array de entidades
  // Es un array porque puede haber sobrecarga (ej. MessageBox)
  private readonly symbolsByLookupKey = new Map<string, PbSystemSymbolEntry[]>();

  constructor() {
    this.buildIndex();
  }

  private buildIndex() {
    const allSymbols = [
      ...PB_MANUAL_CORE_GLOBAL_FUNCTIONS,
      ...PB_MANUAL_CORE_OBJECT_FUNCTIONS,
      ...PB_MANUAL_CORE_DATAWINDOW_FUNCTIONS,
      ...PB_MANUAL_CORE_SYSTEM_EVENTS,
      ...PB_MANUAL_CORE_DATAWINDOW_EVENTS,
      ...PB_MANUAL_CORE_STATEMENTS
    ];

    for (const symbol of allSymbols) {
      for (const key of symbol.lookupKeys) {
        let bucket = this.symbolsByLookupKey.get(key);
        if (!bucket) {
          bucket = [];
          this.symbolsByLookupKey.set(key, bucket);
        }
        bucket.push(symbol);
      }
    }
  }

  /**
   * Busca símbolos del sistema por nombre exacto (case-insensitive).
   * Devuelve un array con todas las sobrecargas, o vacío si no se encuentra.
   */
  findSystemSymbol(name: string): PbSystemSymbolEntry[] {
    return this.symbolsByLookupKey.get(name.toLowerCase()) || [];
  }
}
