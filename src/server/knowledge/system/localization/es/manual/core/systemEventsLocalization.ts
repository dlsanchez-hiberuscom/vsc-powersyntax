import { PbSystemSymbolLocalizationOverlay } from '../../../../types';
/**
 * Spanish localization for core system events.
 * Reviewed: false - Initial migration from canonical source.
 */
export const systemEventsLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Clicked' },
        text: { summary: 'Se dispara cuando el usuario hace clic con el botón izquierdo sobre el control.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'DoubleClicked' },
        text: { summary: 'Se dispara cuando el usuario hace doble clic con el botón izquierdo sobre el control.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Constructor' },
        text: { summary: 'Se dispara inmediatamente después de que el objeto se crea en memoria, antes de mostrarse.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Destructor' },
        text: { summary: 'Se dispara justo antes de que el objeto sea destruido y liberado de la memoria.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'GetFocus', ownerTypes: ['checkbox', 'commandbutton', 'datepicker', 'dropdownlistbox', 'dropdownpicturelistbox', 'editmask', 'inkedit', 'listbox', 'listview', 'mdiclient', 'mdiframe', 'monthcalendar', 'multilineedit', 'picturebutton', 'picturelistbox', 'radiobutton', 'richtextedit', 'singlelineedit', 'tab', 'tabbedbar', 'treeview', 'webbrowser'] },
        text: { summary: 'Se dispara cuando el control recibe el foco de entrada.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'LoseFocus', ownerTypes: ['checkbox', 'commandbutton', 'datepicker', 'dropdownlistbox', 'dropdownpicturelistbox', 'editmask', 'inkedit', 'listbox', 'listview', 'mdiclient', 'mdiframe', 'monthcalendar', 'multilineedit', 'picturebutton', 'picturelistbox', 'radiobutton', 'richtextedit', 'singlelineedit', 'tab', 'tabbedbar', 'treeview', 'webbrowser'] },
        text: { summary: 'Se dispara cuando el control pierde el foco de entrada.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'RButtonDown', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando el usuario pulsa el botón derecho del mouse sobre el control.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Modified', ownerTypes: ['checkbox', 'datepicker', 'dropdownlistbox', 'dropdownpicturelistbox', 'editmask', 'listbox', 'listview', 'monthcalendar', 'multilineedit', 'picturelistbox', 'radiobutton', 'ribboncheckboxitem', 'ribboncomboboxitem', 'richtextedit', 'singlelineedit', 'treeview'] },
        text: { summary: 'Se dispara cuando el contenido del control ha cambiado y el usuario pierde el foco.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'SelectionChanged', ownerTypes: ['listbox', 'tab', 'treeview'] },
        text: { summary: 'Se dispara cuando el elemento seleccionado en la lista o control ha cambiado.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Open' },
        text: { summary: 'Se dispara cuando se abre la ventana o el objeto ejecutable.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Close' },
        text: { summary: 'Se dispara cuando se cierra la ventana o el objeto ejecutable.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Resize', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando el usuario o el sistema cambia el tamaño del objeto.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Activate', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando la ventana se convierte en la ventana activa del sistema.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Deactivate', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando la ventana deja de ser la ventana activa.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Timer' },
        text: { summary: 'Se dispara periódicamente según el intervalo establecido con la función Timer().' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'SelectionChanging', ownerTypes: ['tab', 'treeview'] },
        text: { summary: 'Se dispara justo antes de que cambie la selección, permitiendo cancelar el cambio.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'DragDrop', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando un objeto arrastrado se suelta sobre el control.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'DragEnter', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando un objeto arrastrado entra en los límites del control.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'DragLeave', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando un objeto arrastrado sale de los límites del control.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'DragWithin', ownerTypes: ['window'] },
        text: { summary: 'Se dispara mientras un objeto arrastrado se mueve dentro del control.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Help', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando el usuario pulsa la tecla F1 o solicita ayuda sobre el control.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Other', ownerTypes: ['window'] },
        text: { summary: 'Evento genérico que captura mensajes de Windows no manejados por otros eventos específicos.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'SystemError' },
        text: { summary: 'Evento global del objeto Application que se dispara ante errores fatales de ejecución.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'CloseQuery', ownerTypes: ['window'] },
        text: { summary: 'Se dispara antes de cerrar la ventana, permitiendo al programa vetar el cierre.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Hide', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando el objeto se oculta.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Show', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando el objeto se hace visible.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'MouseMove', ownerTypes: ['window'] },
        text: { summary: 'Se dispara mientras el puntero del mouse se desplaza sobre el control.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'MouseUp', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando el usuario suelta el botón izquierdo del mouse.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'MouseDown', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando el usuario pulsa el botón izquierdo del mouse.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'Key', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando el usuario pulsa una tecla mientras el control tiene el foco.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'MenuChanged', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando la ribbon bar de una ventana MDI o MDIHelp se inicializa o se reconstruye.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'SystemKey', ownerTypes: ['window'] },
        text: { summary: 'Se dispara cuando el usuario pulsa Alt o Alt junto con otra tecla fuera de un DataWindow o RichTextEdit.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'ToolbarMoved', ownerTypes: ['window'] },
        text: { summary: 'Se dispara en una ventana MDI cuando el usuario mueve la FrameBar o la SheetBar.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'HotLinkAlarm', ownerTypes: ['window'] },
        text: { 
            summary: 'Se dispara tras recibir datos nuevos de una aplicación servidor DDE.',
            obsoleteMessage: 'Evento DDE obsoleto; se mantiene por compatibilidad.'
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'RemoteExec', ownerTypes: ['window'] },
        text: { 
            summary: 'Se dispara cuando una aplicación cliente DDE envía un comando.',
            obsoleteMessage: 'Evento DDE obsoleto; se mantiene por compatibilidad.'
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'RemoteHotLinkStart', ownerTypes: ['window'] },
        text: { 
            summary: 'Se dispara cuando un cliente DDE solicita iniciar un hot link.',
            obsoleteMessage: 'Evento DDE obsoleto; se mantiene por compatibilidad.'
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'RemoteHotLinkStop', ownerTypes: ['window'] },
        text: { 
            summary: 'Se dispara cuando un cliente DDE solicita terminar un hot link.',
            obsoleteMessage: 'Evento DDE obsoleto; se mantiene por compatibilidad.'
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'RemoteRequest', ownerTypes: ['window'] },
        text: { 
            summary: 'Se dispara cuando un cliente DDE solicita datos.',
            obsoleteMessage: 'Evento DDE obsoleto; se mantiene por compatibilidad.'
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'RemoteSend', ownerTypes: ['window'] },
        text: { 
            summary: 'Se dispara cuando un cliente DDE ha enviado datos.',
            obsoleteMessage: 'Evento DDE obsoleto; se mantiene por compatibilidad.'
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'RightClicked', ownerTypes: ['treeview', 'listview', 'tab'] },
        text: { summary: 'Se dispara cuando el usuario hace clic con el botón derecho sobre el control.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-events', kind: 'event', namespace: 'object', invocation: 'member', name: 'RightDoubleClicked', ownerTypes: ['treeview', 'listview', 'tab'] },
        text: { summary: 'Se dispara cuando el usuario hace doble clic con el botón derecho sobre el control.' },
    },
];