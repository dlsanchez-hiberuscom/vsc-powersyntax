import { PbSystemSymbolLocalizationOverlay } from '../../../../types';
import {
    EVENT_CAPABLE_OBJECT_TYPES,
    FOCUSABLE_OBJECT_TYPES,
    REDRAWABLE_OBJECT_TYPES,
    VISUAL_OBJECT_TYPES,
} from '../../../../manual/ownerTypes/visualOwnerTypes';

/**
 * Spanish localization for core object functions.
 * Reviewed: false - Initial migration from canonical source.
 */
export const objectFunctionsLocalization: PbSystemSymbolLocalizationOverlay[] = [
    // --- Common Grouped Functions (Matching Canonical Manual Groups) ---
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SetFocus', ownerTypes: FOCUSABLE_OBJECT_TYPES },
        text: { summary: 'Transfiere el foco de entrada al objeto visual.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Show', ownerTypes: VISUAL_OBJECT_TYPES },
        text: { summary: 'Hace que el objeto sea visible en la interfaz.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Hide', ownerTypes: VISUAL_OBJECT_TYPES },
        text: { summary: 'Oculta el objeto de la interfaz.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Move', ownerTypes: VISUAL_OBJECT_TYPES },
        text: { summary: 'Cambia la posición del objeto a las coordenadas indicadas.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Resize', ownerTypes: VISUAL_OBJECT_TYPES },
        text: { summary: 'Cambia las dimensiones del objeto.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SetRedraw', ownerTypes: REDRAWABLE_OBJECT_TYPES },
        text: { summary: 'Habilita o deshabilita el repintado automático del objeto.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'PostEvent', ownerTypes: EVENT_CAPABLE_OBJECT_TYPES },
        text: { summary: 'Añade un evento a la cola de mensajes para ejecución diferida.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'TriggerEvent', ownerTypes: EVENT_CAPABLE_OBJECT_TYPES },
        text: { summary: 'Ejecuta inmediatamente un evento en el objeto.' },
    },

    // --- Control-Specific Functions (Splitting to match Canonical Manual) ---

    // ClassName
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'ClassName', ownerTypes: ['listbox'] },
        text: { summary: 'Devuelve el nombre de la clase asignado al control ListBox.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'ClassName', ownerTypes: ['tab'] },
        text: { summary: 'Devuelve el nombre de la clase asignado al control Tab.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'ClassName', ownerTypes: ['listview'] },
        text: { summary: 'Devuelve el nombre de la clase asignado al control ListView.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'ClassName', ownerTypes: ['treeview'] },
        text: { summary: 'Devuelve el nombre de la clase asignado al control TreeView.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'ClassName', ownerTypes: ['window'] },
        text: { summary: 'Devuelve el nombre de la clase asignado a la ventana.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'ClassName', ownerTypes: ['singlelineedit', 'editmask', 'multilineedit'] },
        text: { summary: 'Devuelve el nombre de la clase del control de edición.' },
    },

    // TypeOf
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'TypeOf', ownerTypes: ['listbox'] },
        text: { summary: 'Devuelve el tipo enumerado del objeto ListBox.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'TypeOf', ownerTypes: ['tab'] },
        text: { summary: 'Devuelve el tipo enumerado del objeto Tab.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'TypeOf', ownerTypes: ['listview'] },
        text: { summary: 'Devuelve el tipo enumerado del objeto ListView.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'TypeOf', ownerTypes: ['treeview'] },
        text: { summary: 'Devuelve el tipo enumerado del objeto TreeView.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'TypeOf', ownerTypes: ['window'] },
        text: { summary: 'Devuelve el tipo enumerado de la ventana.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'TypeOf', ownerTypes: ['singlelineedit', 'editmask', 'multilineedit'] },
        text: { summary: 'Devuelve el tipo enumerado del control de edición.' },
    },

    // PointerX & PointerY
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'PointerX', ownerTypes: ['listbox'] },
        text: { summary: 'Devuelve la posición X del puntero relativa al ListBox.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'PointerX', ownerTypes: ['tab'] },
        text: { summary: 'Devuelve la posición X del puntero relativa al Tab.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'PointerX', ownerTypes: ['listview'] },
        text: { summary: 'Devuelve la posición X del puntero relativa al ListView.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'PointerX', ownerTypes: ['treeview'] },
        text: { summary: 'Devuelve la posición X del puntero relativa al TreeView.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'PointerX', ownerTypes: ['window'] },
        text: { summary: 'Devuelve la posición X del puntero relativa a la ventana.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'PointerX', ownerTypes: ['singlelineedit', 'editmask', 'multilineedit'] },
        text: { summary: 'Devuelve la posición X del puntero relativa al control de edición.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'PointerY', ownerTypes: ['listbox'] },
        text: { summary: 'Devuelve la posición Y del puntero relativa al ListBox.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'PointerY', ownerTypes: ['tab'] },
        text: { summary: 'Devuelve la posición Y del puntero relativa al Tab.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'PointerY', ownerTypes: ['listview'] },
        text: { summary: 'Devuelve la posición Y del puntero relativa al ListView.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'PointerY', ownerTypes: ['treeview'] },
        text: { summary: 'Devuelve la posición Y del puntero relativa al TreeView.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'PointerY', ownerTypes: ['window'] },
        text: { summary: 'Devuelve la posición Y del puntero relativa a la ventana.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'PointerY', ownerTypes: ['singlelineedit', 'editmask', 'multilineedit'] },
        text: { summary: 'Devuelve la posición Y del puntero relativa al control de edición.' },
    },

    // GetParent
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetParent', ownerTypes: ['listbox'] },
        text: { summary: 'Devuelve el objeto padre del ListBox.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetParent', ownerTypes: ['tab'] },
        text: { summary: 'Devuelve el objeto padre del Tab.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetParent', ownerTypes: ['listview'] },
        text: { summary: 'Devuelve el objeto padre del ListView.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetParent', ownerTypes: ['treeview'] },
        text: { summary: 'Devuelve el objeto padre del TreeView.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetParent', ownerTypes: ['singlelineedit', 'editmask', 'multilineedit'] },
        text: { summary: 'Devuelve el objeto padre del control de edición.' },
    },

    // GetContextService
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetContextService', ownerTypes: ['window'] },
        text: { summary: 'Crea una referencia a un servicio de contexto para la ventana.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetContextService', ownerTypes: ['tab'] },
        text: { summary: 'Crea una referencia a un servicio de contexto para el Tab.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetContextService', ownerTypes: ['listview'] },
        text: { summary: 'Crea una referencia a un servicio de contexto para el ListView.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetContextService', ownerTypes: ['treeview'] },
        text: { summary: 'Crea una referencia a un servicio de contexto para el TreeView.' },
    },

    // AddItem
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'AddItem', ownerTypes: ['listbox'] },
        text: { summary: 'Añade un elemento al final del ListBox.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'AddItem', ownerTypes: ['listview'] },
        text: { summary: 'Añade un elemento al ListView.' },
    },

    // DeleteItem & DeleteItems
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'DeleteItem', ownerTypes: ['listview'] },
        text: { summary: 'Elimina un elemento del ListView.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'DeleteItem', ownerTypes: ['treeview'] },
        text: { summary: 'Elimina un nodo del TreeView y todos sus descendientes.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'DeleteItems', ownerTypes: ['listview'] },
        text: { summary: 'Elimina todos los elementos del ListView.' },
    },

    // InsertItem
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'InsertItem', ownerTypes: ['listbox'] },
        text: { summary: 'Inserta un elemento en la posición especificada del ListBox.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'InsertItem', ownerTypes: ['listview'] },
        text: { summary: 'Inserta un elemento en la posición especificada del ListView.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'InsertItem', ownerTypes: ['treeview'] },
        text: { summary: 'Inserta un nodo en una posición y nivel específicos del árbol.' },
    },

    // Reset
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Reset', ownerTypes: ['listbox'] },
        text: { summary: 'Elimina todos los elementos del ListBox.' },
    },

    // TotalItems
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'TotalItems', ownerTypes: ['listbox'] },
        text: { summary: 'Devuelve el número total de elementos en el ListBox.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'TotalItems', ownerTypes: ['listview'] },
        text: { summary: 'Devuelve el número total de elementos en el ListView.' },
    },

    // SelectedIndex & SelectedItem
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SelectedIndex', ownerTypes: ['listbox'] },
        text: { summary: 'Devuelve el índice del primer elemento seleccionado en el ListBox.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SelectedIndex', ownerTypes: ['listview'] },
        text: { summary: 'Devuelve el índice del primer elemento seleccionado en el ListView.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SelectedItem', ownerTypes: ['listbox'] },
        text: { summary: 'Devuelve el texto del primer elemento seleccionado en el ListBox.' },
    },

    // SelectItem
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SelectItem', ownerTypes: ['listbox'] },
        text: { summary: 'Selecciona un elemento en el ListBox por texto o índice.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SelectItem', ownerTypes: ['treeview'] },
        text: { summary: 'Selecciona programáticamente un nodo del TreeView.' },
    },

    // GetItem & SetItem
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetItem', ownerTypes: ['listview'] },
        text: { summary: 'Recupera las propiedades de un elemento del ListView.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetItem', ownerTypes: ['treeview'] },
        text: { summary: 'Recupera la información asociada a un nodo del TreeView.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SetItem', ownerTypes: ['listview'] },
        text: { summary: 'Actualiza los valores de un elemento del ListView.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SetItem', ownerTypes: ['treeview'] },
        text: { summary: 'Actualiza la información asociada a un nodo del TreeView.' },
    },

    // TotalSelected
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'TotalSelected', ownerTypes: ['listbox'] },
        text: { summary: 'Devuelve cuántos elementos están seleccionados en el ListBox.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'TotalSelected', ownerTypes: ['listview'] },
        text: { summary: 'Devuelve cuántos elementos están seleccionados en el ListView.' },
    },

    // Print
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Print', ownerTypes: ['window'] },
        text: { summary: 'Imprime el contenido de la ventana.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Print', ownerTypes: ['tab'] },
        text: { summary: 'Imprime el contenido actual del control Tab.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Print', ownerTypes: ['listview'] },
        text: { summary: 'Imprime el contenido del control ListView.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Print', ownerTypes: ['treeview'] },
        text: { summary: 'Imprime el contenido del control TreeView.' },
    },

    // SetRedraw (ListBox special case)
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SetRedraw', ownerTypes: ['listbox'] },
        text: { summary: 'Suspende o reactiva el repintado automático del ListBox.' },
    },

    // --- Window Specific Functions ---
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetActiveSheet', ownerTypes: ['window'] },
        text: { summary: 'Devuelve la hoja MDI activa de la ventana.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'ArrangeSheets', ownerTypes: ['window'] },
        text: { summary: 'Reorganiza las hojas MDI abiertas en la ventana actual.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'ChangeMenu', ownerTypes: ['window'] },
        text: { summary: 'Sustituye el menú activo asociado a la ventana.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'CloseUserObject', ownerTypes: ['window'] },
        text: { summary: 'Cierra un user object abierto dinámicamente en la ventana.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetFirstSheet', ownerTypes: ['window'] },
        text: { summary: 'Devuelve la primera hoja abierta en la ventana MDI.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetNextSheet', ownerTypes: ['window'] },
        text: { summary: 'Devuelve la siguiente hoja abierta a partir de una hoja dada.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'OpenSheet', ownerTypes: ['window'] },
        text: { summary: 'Abre un user object como hoja de la ventana.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'OpenSheetWithParm', ownerTypes: ['window'] },
        text: { summary: 'Abre una hoja y expone un parámetro en el objeto Message.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'OpenUserObject', ownerTypes: ['window'] },
        text: { summary: 'Abre dinámicamente un user object asociado a la ventana.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'OpenUserObjectWithParm', ownerTypes: ['window'] },
        text: { summary: 'Abre un user object dinámico y pasa un parámetro inicial.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetToolbar', ownerTypes: ['window'] },
        text: { summary: 'Obtiene una referencia a una toolbar registrada en la ventana.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetToolbarPos', ownerTypes: ['window'] },
        text: { summary: 'Devuelve la posición actual de una toolbar de la ventana.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SetMicroHelp', ownerTypes: ['window'] },
        text: { summary: 'Actualiza el texto de microayuda mostrado por la ventana.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SetSheetID', ownerTypes: ['window'] },
        text: { summary: 'Asigna un identificador lógico a una hoja abierta.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SetToolbar', ownerTypes: ['window'] },
        text: { summary: 'Muestra u oculta una toolbar registrada en la ventana.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SetToolbarPos', ownerTypes: ['window'] },
        text: { summary: 'Reubica una toolbar de la ventana en la posición indicada.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SaveDockingState', ownerTypes: ['window'] },
        text: { summary: 'Persiste el layout acoplado actual de la ventana en un archivo.' },
    },

    // --- ListBox Specific ---
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'DirList', ownerTypes: ['listbox'] },
        text: { summary: 'Carga en el ListBox los archivos que cumplen un patrón.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'DirSelect', ownerTypes: ['listbox'] },
        text: { summary: 'Recupera la selección actual del ListBox en una variable.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SetState', ownerTypes: ['listbox'] },
        text: { summary: 'Cambia el estado seleccionado de un elemento multiselección.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SetTop', ownerTypes: ['listbox'] },
        text: { summary: 'Desplaza el ListBox para mostrar primero el elemento indicado.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'State', ownerTypes: ['listbox'] },
        text: { summary: 'Indica si un elemento concreto está seleccionado.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Text', ownerTypes: ['listbox'] },
        text: { summary: 'Devuelve el texto del elemento indicado por índice.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Top', ownerTypes: ['listbox'] },
        text: { summary: 'Devuelve el índice del elemento visible en la parte superior.' },
    },

    // --- Tab Specific ---
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SelectTab', ownerTypes: ['tab'] },
        text: { summary: 'Selecciona programáticamente una página del Tab.' },
    },

    // --- ListView Specific ---
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'TotalColumns', ownerTypes: ['listview'] },
        text: { summary: 'Devuelve el número total de columnas en el ListView.' },
    },

    // --- TreeView Specific ---
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'CollapseItem', ownerTypes: ['treeview'] },
        text: { summary: 'Repliega un nodo del árbol.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'ExpandAll', ownerTypes: ['treeview'] },
        text: { summary: 'Despliega todos los niveles del árbol a partir de un nodo.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'ExpandItem', ownerTypes: ['treeview'] },
        text: { summary: 'Despliega un nodo del árbol.' },
    },

    // --- Editable Text Controls (Shared Groups) ---
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Copy', ownerTypes: ['singlelineedit', 'editmask', 'multilineedit'] },
        text: { summary: 'Copia el texto seleccionado al portapapeles.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Cut', ownerTypes: ['singlelineedit', 'editmask', 'multilineedit'] },
        text: { summary: 'Corta el texto seleccionado al portapapeles.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Paste', ownerTypes: ['singlelineedit', 'editmask', 'multilineedit'] },
        text: { summary: 'Pega el contenido del portapapeles.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Undo', ownerTypes: ['singlelineedit', 'editmask', 'multilineedit'] },
        text: { summary: 'Deshace la última operación de edición.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Clear', ownerTypes: ['singlelineedit', 'editmask', 'multilineedit'] },
        text: { summary: 'Elimina el texto seleccionado.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SelectText', ownerTypes: ['singlelineedit', 'editmask', 'multilineedit'] },
        text: { summary: 'Selecciona una porción de texto.' },
        parameters: [
            { signatureLabel: 'SelectText(start, length)', parameterName: 'start', documentation: 'Posición inicial del texto a seleccionar.' },
            { signatureLabel: 'SelectText(start, length)', parameterName: 'length', documentation: 'Número de caracteres a seleccionar.' }
        ],
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SelectedText', ownerTypes: ['singlelineedit', 'editmask', 'multilineedit'] },
        text: { summary: 'Devuelve el texto seleccionado.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'TextLine', ownerTypes: ['editmask', 'multilineedit'] },
        text: { summary: 'Obtiene el texto de una línea específica.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'LineCount', ownerTypes: ['editmask', 'multilineedit'] },
        text: { summary: 'Devuelve el número total de líneas.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'LineLength', ownerTypes: ['editmask', 'multilineedit'] },
        text: { summary: 'Devuelve la longitud de una línea.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Scroll', ownerTypes: ['editmask', 'multilineedit'] },
        text: { summary: 'Desplaza el contenido vertical u horizontalmente.' },
        parameters: [
            { signatureLabel: 'Scroll(lines)', parameterName: 'lines', documentation: 'Número de líneas a desplazar; positivo hacia abajo, negativo hacia arriba.' }
        ],
    },
];