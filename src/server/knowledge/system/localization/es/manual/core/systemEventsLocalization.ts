import { PbSystemSymbolLocalizationOverlay } from '../../../../types';
/**
 * Spanish localization for core system events.
 * Reviewed: false - Initial migration from canonical source.
 */
export const systemEventsLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Clicked' },
        text: { summary: 'Se dispara cuando el usuario hace clic con el botón izquierdo sobre el control.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'DoubleClicked' },
        text: { summary: 'Se dispara cuando el usuario hace doble clic con el botón izquierdo sobre el control.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Constructor' },
        text: { summary: 'Se dispara inmediatamente después de que el objeto se crea en memoria, antes de mostrarse.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Destructor' },
        text: { summary: 'Se dispara justo antes de que el objeto sea destruido y liberado de la memoria.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'GetFocus', ownerTypes: ['checkbox', 'commandbutton', 'datepicker', 'dropdownlistbox', 'dropdownpicturelistbox', 'editmask', 'inkedit', 'listbox', 'listview', 'mdiclient', 'mdiframe', 'monthcalendar', 'multilineedit', 'picturebutton', 'picturelistbox', 'radiobutton', 'richtextedit', 'singlelineedit', 'tab', 'tabbedbar', 'treeview', 'webbrowser'] },
        text: { summary: 'Se dispara cuando el control recibe el foco de entrada.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'LoseFocus', ownerTypes: ['checkbox', 'commandbutton', 'datepicker', 'dropdownlistbox', 'dropdownpicturelistbox', 'editmask', 'inkedit', 'listbox', 'listview', 'mdiclient', 'mdiframe', 'monthcalendar', 'multilineedit', 'picturebutton', 'picturelistbox', 'radiobutton', 'richtextedit', 'singlelineedit', 'tab', 'tabbedbar', 'treeview', 'webbrowser'] },
        text: { summary: 'Se dispara cuando el control pierde el foco de entrada.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'RButtonDown', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando el usuario pulsa el botón derecho del mouse sobre el control.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Modified', ownerTypes: ['checkbox', 'datepicker', 'dropdownlistbox', 'dropdownpicturelistbox', 'editmask', 'listbox', 'listview', 'monthcalendar', 'multilineedit', 'picturelistbox', 'radiobutton', 'ribboncheckboxitem', 'ribboncomboboxitem', 'richtextedit', 'singlelineedit', 'treeview'] },
        text: { summary: 'Se dispara cuando el contenido del control ha cambiado y el usuario pierde el foco.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'SelectionChanged', ownerTypes: ['listbox', 'tab', 'treeview'] },
        text: { summary: 'Se dispara cuando el elemento seleccionado en la lista o control ha cambiado.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Open' },
        text: { summary: 'Se dispara cuando se abre la ventana o el objeto ejecutable.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Close' },
        text: { summary: 'Se dispara cuando se cierra la ventana o el objeto ejecutable.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Resize', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando el usuario o el sistema cambia el tamaño del objeto.' },
        parameters: [
            { signatureLabel: 'Resize(sizetype, newwidth, newheight)', parameterName: 'sizetype', documentation: 'UnsignedLong por valor. El tipo de cambio de tamaño (restaurado, minimizado, etc.).' },
            { signatureLabel: 'Resize(sizetype, newwidth, newheight)', parameterName: 'newwidth', documentation: 'Integer por valor. El nuevo ancho del área cliente en unidades PowerBuilder.' },
            { signatureLabel: 'Resize(sizetype, newwidth, newheight)', parameterName: 'newheight', documentation: 'Integer por valor. El nuevo alto del área cliente en unidades PowerBuilder.' },
        ],
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Activate', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando la ventana se convierte en la ventana activa del sistema.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Deactivate', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando la ventana deja de ser la ventana activa.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Timer' },
        text: { summary: 'Se dispara periódicamente según el intervalo establecido con la función Timer().' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'SelectionChanging', ownerTypes: ['tab', 'treeview'] },
        text: { summary: 'Se dispara justo antes de que cambie la selección, permitiendo cancelar el cambio.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'DragDrop', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando un objeto arrastrado se suelta sobre el control.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'DragEnter', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando un objeto arrastrado entra en los límites del control.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'DragLeave', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando un objeto arrastrado sale de los límites del control.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'DragWithin', ownerTypes: ['window'] },
        text: { summary: 'Se dispara mientras un objeto arrastrado se mueve dentro del control.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Help', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando el usuario pulsa la tecla F1 o solicita ayuda sobre el control.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Other', ownerTypes: ['window'] },
        text: { summary: 'Evento genérico que captura mensajes de Windows no manejados por otros eventos específicos.' },
        parameters: [
            { signatureLabel: 'Other(wparam, lparam)', parameterName: 'wparam', documentation: 'UnsignedLong por valor. El primer parámetro del mensaje de Windows.' },
            { signatureLabel: 'Other(wparam, lparam)', parameterName: 'lparam', documentation: 'Long por valor. El segundo parámetro del mensaje de Windows.' },
        ],
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'SystemError' },
        text: { summary: 'Evento global del objeto Application que se dispara ante errores fatales de ejecución.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'CloseQuery', ownerTypes: ['window'] },
        text: { summary: 'Se dispara antes de cerrar la ventana, permitiendo al programa vetar el cierre.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Hide', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando el objeto se oculta.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Show', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando el objeto se hace visible.' },
        parameters: [
            { signatureLabel: 'Show(show, status)', parameterName: 'show', documentation: 'Boolean por valor. Indica si la ventana se está mostrando (siempre true en este evento).' },
            { signatureLabel: 'Show(show, status)', parameterName: 'status', documentation: 'Long por valor. El estado de la ventana y su relación con el objeto padre.' },
        ],
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'MouseMove', ownerTypes: ['window'] },
        text: { summary: 'Se dispara mientras el puntero del mouse se desplaza sobre el control.' },
        parameters: [
            { signatureLabel: 'MouseMove(flags, xpos, ypos)', parameterName: 'flags', documentation: 'UnsignedLong por valor. Los botones del mouse y teclas modificadoras pulsados.' },
            { signatureLabel: 'MouseMove(flags, xpos, ypos)', parameterName: 'xpos', documentation: 'Integer por valor. La posición X del puntero en píxeles.' },
            { signatureLabel: 'MouseMove(flags, xpos, ypos)', parameterName: 'ypos', documentation: 'Integer por valor. La posición Y del puntero en píxeles.' },
        ],
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'MouseUp', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando el usuario suelta el botón izquierdo del mouse.' },
        parameters: [
            { signatureLabel: 'MouseUp(flags, xpos, ypos)', parameterName: 'flags', documentation: 'UnsignedLong por valor. Los botones del mouse y teclas modificadoras pulsados.' },
            { signatureLabel: 'MouseUp(flags, xpos, ypos)', parameterName: 'xpos', documentation: 'Integer por valor. La posición X del puntero en píxeles.' },
            { signatureLabel: 'MouseUp(flags, xpos, ypos)', parameterName: 'ypos', documentation: 'Integer por valor. La posición Y del puntero en píxeles.' },
        ],
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'MouseDown', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando el usuario pulsa el botón izquierdo del mouse.' },
        parameters: [
            { signatureLabel: 'MouseDown(flags, xpos, ypos)', parameterName: 'flags', documentation: 'UnsignedLong por valor. Los botones del mouse y teclas modificadoras pulsados.' },
            { signatureLabel: 'MouseDown(flags, xpos, ypos)', parameterName: 'xpos', documentation: 'Integer por valor. La posición X del puntero en píxeles.' },
            { signatureLabel: 'MouseDown(flags, xpos, ypos)', parameterName: 'ypos', documentation: 'Integer por valor. La posición Y del puntero en píxeles.' },
        ],
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Key', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando el usuario pulsa una tecla mientras el control tiene el foco.' },
    },
];