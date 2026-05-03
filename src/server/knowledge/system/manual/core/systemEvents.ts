import { PbSystemSymbolEntry } from '../../types';
import { systemEvent } from '../common';
import {
    FOCUSABLE_OBJECT_TYPES,
    INPUT_OBJECT_TYPES,
} from '../ownerTypes/visualOwnerTypes';

export const PB_MANUAL_CORE_SYSTEM_EVENT_CATEGORIES = [
    'Ciclo de vida',
    'Interacción',
    'Edición',
    'Sistema',
    'Errores',
] as const;

type SystemEventCategory = (typeof PB_MANUAL_CORE_SYSTEM_EVENT_CATEGORIES)[number];

type SystemEventDescriptor = {
    name: string;
    category: SystemEventCategory;
    summary: string;
    signature: string;
    appliesTo: readonly string[];
    ownerTypes: readonly string[];
    sourceUrl: string;
    obsolete?: boolean;
    obsoleteMessage?: string;
    replacement?: string;
};

const WINDOW_SYSTEM_EVENT_OWNER_TYPES = ['window'];
const WINDOW_SYSTEM_EVENT_APPLIES_TO = ['Window control'];
const WINDOW_CONTROL_SOURCE_URL = 'https://docs.appeon.com/pb2025/objects_and_controls/Window_control.html';
const TREEVIEW_CONTROL_SOURCE_URL = 'https://docs.appeon.com/pb2025/objects_and_controls/TreeView_control.html';

function defineSystemEventEntries(
    descriptors: readonly SystemEventDescriptor[],
): readonly PbSystemSymbolEntry[] {
    return descriptors.map(descriptor => systemEvent({
        name: descriptor.name,
        category: descriptor.category,
        summary: descriptor.summary,
        signatures: [{ label: descriptor.signature }],
        appliesTo: descriptor.appliesTo,
        ownerTypes: descriptor.ownerTypes,
        obsolete: descriptor.obsolete,
        obsoleteMessage: descriptor.obsoleteMessage,
        replacement: descriptor.replacement,
        sourceUrl: descriptor.sourceUrl,
    }));
}

const PB_MANUAL_CORE_SYSTEM_EVENTS_MF_08B = defineSystemEventEntries([
    {
        name: 'DragDrop',
        category: 'Interacción',
        summary: 'Se dispara cuando un control arrastrado se suelta sobre la ventana.',
        signature: 'DragDrop()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'DragEnter',
        category: 'Interacción',
        summary: 'Se dispara cuando un control arrastrado entra en la ventana.',
        signature: 'DragEnter()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'DragLeave',
        category: 'Interacción',
        summary: 'Se dispara cuando un control arrastrado abandona la ventana.',
        signature: 'DragLeave()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'DragWithin',
        category: 'Interacción',
        summary: 'Se dispara mientras un control arrastrado permanece dentro de la ventana.',
        signature: 'DragWithin()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'Help',
        category: 'Interacción',
        summary: 'Se dispara cuando el usuario pulsa F1 o usa la ayuda contextual desde la barra de título.',
        signature: 'Help()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'Key',
        category: 'Interacción',
        summary: 'Se dispara cuando el usuario pulsa una tecla fuera de un RichTextEdit o del edit control de un DataWindow.',
        signature: 'Key()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'MenuChanged',
        category: 'Sistema',
        summary: 'Se dispara cuando la ribbon bar de una ventana MDI o MDIHelp se inicializa o se reconstruye.',
        signature: 'MenuChanged()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'MouseDown',
        category: 'Interacción',
        summary: 'Se dispara cuando el usuario pulsa el botón izquierdo en un área libre de la ventana.',
        signature: 'MouseDown()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'MouseMove',
        category: 'Interacción',
        summary: 'Se dispara cuando el puntero se mueve dentro de la ventana.',
        signature: 'MouseMove()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'MouseUp',
        category: 'Interacción',
        summary: 'Se dispara cuando el usuario libera el botón izquierdo en un área libre de la ventana.',
        signature: 'MouseUp()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
]);

const PB_MANUAL_CORE_SYSTEM_EVENTS_MF_08C = defineSystemEventEntries([
    {
        name: 'Other',
        category: 'Sistema',
        summary: 'Se dispara cuando se produce un mensaje de Windows que no corresponde a un evento PowerBuilder.',
        signature: 'Other()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'RButtonDown',
        category: 'Interacción',
        summary: 'Se dispara cuando el usuario pulsa el botón derecho en un área libre de la ventana.',
        signature: 'RButtonDown()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'SystemKey',
        category: 'Interacción',
        summary: 'Se dispara cuando el usuario pulsa Alt o Alt junto con otra tecla fuera de un DataWindow o RichTextEdit.',
        signature: 'SystemKey()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'ToolbarMoved',
        category: 'Sistema',
        summary: 'Se dispara en una ventana MDI cuando el usuario mueve la FrameBar o la SheetBar.',
        signature: 'ToolbarMoved()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
]);

const PB_MANUAL_CORE_SYSTEM_EVENTS_MF_08D = defineSystemEventEntries([
    {
        name: 'HotLinkAlarm',
        category: 'Sistema',
        summary: 'Se dispara después de que una aplicación servidor DDE envía datos nuevos y la aplicación cliente DDE los recibe.',
        signature: 'HotLinkAlarm()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
        obsolete: true,
        obsoleteMessage: 'Evento DDE obsoleto en PowerBuilder; se mantiene solo por compatibilidad heredada.',
    },
    {
        name: 'RemoteExec',
        category: 'Sistema',
        summary: 'Se dispara cuando una aplicación cliente DDE envía un comando.',
        signature: 'RemoteExec()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
        obsolete: true,
        obsoleteMessage: 'Evento DDE obsoleto en PowerBuilder; se mantiene solo por compatibilidad heredada.',
    },
    {
        name: 'RemoteHotLinkStart',
        category: 'Sistema',
        summary: 'Se dispara cuando una aplicación cliente DDE solicita iniciar un hot link.',
        signature: 'RemoteHotLinkStart()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
        obsolete: true,
        obsoleteMessage: 'Evento DDE obsoleto en PowerBuilder; se mantiene solo por compatibilidad heredada.',
    },
    {
        name: 'RemoteHotLinkStop',
        category: 'Sistema',
        summary: 'Se dispara cuando una aplicación cliente DDE solicita terminar un hot link.',
        signature: 'RemoteHotLinkStop()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
        obsolete: true,
        obsoleteMessage: 'Evento DDE obsoleto en PowerBuilder; se mantiene solo por compatibilidad heredada.',
    },
    {
        name: 'RemoteRequest',
        category: 'Sistema',
        summary: 'Se dispara cuando una aplicación cliente DDE solicita datos.',
        signature: 'RemoteRequest()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
        obsolete: true,
        obsoleteMessage: 'Evento DDE obsoleto en PowerBuilder; se mantiene solo por compatibilidad heredada.',
    },
    {
        name: 'RemoteSend',
        category: 'Sistema',
        summary: 'Se dispara cuando una aplicación cliente DDE ha enviado datos.',
        signature: 'RemoteSend()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
        obsolete: true,
        obsoleteMessage: 'Evento DDE obsoleto en PowerBuilder; se mantiene solo por compatibilidad heredada.',
    },
]);

const PB_MANUAL_CORE_SYSTEM_EVENTS_MF_08E = defineSystemEventEntries([
    {
        name: 'SelectionChanged',
        category: 'Interacción',
        summary: 'Se dispara cuando cambia la selección activa del control.',
        signature: 'SelectionChanged()',
        appliesTo: ['TreeView control', 'Tab control', 'ListBox control'],
        ownerTypes: ['treeview', 'tab', 'listbox'],
        sourceUrl: TREEVIEW_CONTROL_SOURCE_URL,
    },
    {
        name: 'SelectionChanging',
        category: 'Interacción',
        summary: 'Se dispara justo antes de que cambie la selección y puede devolver 1 para impedir el cambio.',
        signature: 'SelectionChanging()',
        appliesTo: ['TreeView control', 'Tab control'],
        ownerTypes: ['treeview', 'tab'],
        sourceUrl: TREEVIEW_CONTROL_SOURCE_URL,
    },
    {
        name: 'RightClicked',
        category: 'Interacción',
        summary: 'Se dispara cuando el usuario hace clic con el botón derecho sobre el control.',
        signature: 'RightClicked()',
        appliesTo: ['TreeView control', 'ListView control', 'Tab control'],
        ownerTypes: ['treeview', 'listview', 'tab'],
        sourceUrl: TREEVIEW_CONTROL_SOURCE_URL,
    },
    {
        name: 'RightDoubleClicked',
        category: 'Interacción',
        summary: 'Se dispara cuando el usuario hace doble clic con el botón derecho sobre el control.',
        signature: 'RightDoubleClicked()',
        appliesTo: ['TreeView control', 'ListView control', 'Tab control'],
        ownerTypes: ['treeview', 'listview', 'tab'],
        sourceUrl: TREEVIEW_CONTROL_SOURCE_URL,
    },
]);

export const PB_MANUAL_CORE_SYSTEM_EVENTS: readonly PbSystemSymbolEntry[] = [
    systemEvent({
        name: 'Constructor',
        category: 'Ciclo de vida',
        summary: 'Evento del sistema asociado a la construcción lógica del objeto.',
        signatures: [{ label: 'Constructor()' }],
        appliesTo: ['objetos PowerBuilder con script de inicialización'],
    }),
    systemEvent({
        name: 'Destructor',
        category: 'Ciclo de vida',
        summary: 'Evento del sistema asociado a la destrucción lógica del objeto.',
        signatures: [{ label: 'Destructor()' }],
        appliesTo: ['objetos PowerBuilder con script de liberación'],
    }),
    systemEvent({
        name: 'Open',
        category: 'Ciclo de vida',
        summary: 'Evento del sistema disparado al abrir el objeto o al entrar en su ciclo activo.',
        signatures: [{ label: 'Open()' }],
    }),
    systemEvent({
        name: 'Close',
        category: 'Ciclo de vida',
        summary: 'Evento del sistema disparado cuando el objeto solicita cerrarse.',
        signatures: [{ label: 'Close()' }],
    }),
    systemEvent({
        name: 'Activate',
        category: 'Ciclo de vida',
        summary: 'Se dispara justo antes de que la ventana pase a ser la ventana activa.',
        signatures: [{ label: 'Activate()' }],
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    }),
    systemEvent({
        name: 'CloseQuery',
        category: 'Ciclo de vida',
        summary: 'Se dispara al intentar cerrar una ventana y permite cancelar el cierre mediante Message.ReturnValue.',
        signatures: [{ label: 'CloseQuery()' }],
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    }),
    systemEvent({
        name: 'Deactivate',
        category: 'Ciclo de vida',
        summary: 'Se dispara cuando la ventana deja de ser la ventana activa.',
        signatures: [{ label: 'Deactivate()' }],
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    }),
    systemEvent({
        name: 'Hide',
        category: 'Ciclo de vida',
        summary: 'Se dispara justo antes de que una ventana quede oculta.',
        signatures: [{ label: 'Hide()' }],
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    }),
    systemEvent({
        name: 'Show',
        category: 'Ciclo de vida',
        summary: 'Se dispara justo antes de que una ventana se muestre en pantalla mediante Show.',
        signatures: [{ label: 'Show()' }],
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    }),
    systemEvent({
        name: 'Clicked',
        category: 'Interacción',
        summary: 'Evento del sistema disparado cuando el usuario hace clic en un control compatible.',
        signatures: [{ label: 'Clicked()' }],
        appliesTo: ['controles visuales con interacción de puntero'],
    }),
    systemEvent({
        name: 'DoubleClicked',
        category: 'Interacción',
        summary: 'Evento del sistema disparado cuando el usuario hace doble clic en un control compatible.',
        signatures: [{ label: 'DoubleClicked()' }],
        appliesTo: ['controles visuales con interacción de puntero'],
    }),
    systemEvent({
        name: 'GetFocus',
        category: 'Interacción',
        summary: 'Evento del sistema disparado cuando el objeto obtiene el foco de entrada.',
        signatures: [{ label: 'GetFocus()' }],
        appliesTo: ['objetos focalizables'],
        ownerTypes: FOCUSABLE_OBJECT_TYPES,
    }),
    systemEvent({
        name: 'LoseFocus',
        category: 'Interacción',
        summary: 'Evento del sistema disparado cuando el objeto pierde el foco de entrada.',
        signatures: [{ label: 'LoseFocus()' }],
        appliesTo: ['objetos focalizables'],
        ownerTypes: FOCUSABLE_OBJECT_TYPES,
    }),
    systemEvent({
        name: 'KeyDown',
        category: 'Interacción',
        summary: 'Evento del sistema disparado cuando el usuario pulsa una tecla sobre el objeto con foco.',
        signatures: [{ label: 'KeyDown(key, keyflags)' }],
        appliesTo: ['objetos focalizables'],
        ownerTypes: FOCUSABLE_OBJECT_TYPES,
    }),
    systemEvent({
        name: 'KeyUp',
        category: 'Interacción',
        summary: 'Evento del sistema disparado cuando el usuario libera una tecla sobre el objeto con foco.',
        signatures: [{ label: 'KeyUp(key, keyflags)' }],
        appliesTo: ['objetos focalizables'],
        ownerTypes: FOCUSABLE_OBJECT_TYPES,
    }),
    systemEvent({
        name: 'Modified',
        category: 'Edición',
        summary: 'Evento del sistema disparado cuando cambia el contenido de un control de entrada compatible.',
        signatures: [{ label: 'Modified()' }],
        appliesTo: ['controles de entrada y edición'],
        ownerTypes: INPUT_OBJECT_TYPES,
    }),
    systemEvent({
        name: 'Timer',
        category: 'Sistema',
        summary: 'Evento del sistema disparado por temporizadores asociados al objeto.',
        signatures: [{ label: 'Timer()' }],
    }),
    systemEvent({
        name: 'Resize',
        category: 'Sistema',
        summary: 'Se dispara cuando la ventana se abre o cambia de tamano por accion del usuario o por script.',
        signatures: [{ label: 'Resize()' }],
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    }),
    systemEvent({
        name: 'SystemError',
        category: 'Errores',
        summary: 'Evento del sistema utilizado por el runtime para propagar errores globales.',
        signatures: [{ label: 'SystemError()' }],
        appliesTo: ['scripts de manejo global de errores'],
    }),
    ...PB_MANUAL_CORE_SYSTEM_EVENTS_MF_08B,
    ...PB_MANUAL_CORE_SYSTEM_EVENTS_MF_08C,
    ...PB_MANUAL_CORE_SYSTEM_EVENTS_MF_08D,
    ...PB_MANUAL_CORE_SYSTEM_EVENTS_MF_08E,
];
