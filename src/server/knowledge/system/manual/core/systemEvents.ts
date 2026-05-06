import { PbSystemSymbolEntry } from '../../types';
import { systemEvent } from '../common';
import {
    FOCUSABLE_OBJECT_TYPES,
    INPUT_OBJECT_TYPES,
} from '../ownerTypes/visualOwnerTypes';

export const PB_MANUAL_CORE_SYSTEM_EVENT_CATEGORIES = [
    'Lifecycle',
    'Interaction',
    'Editing',
    'System',
    'Errors',
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
    return descriptors.map(descriptor => {
        const paramsMatch = descriptor.signature.match(/\(([^)]+)\)/);
        const parameters = paramsMatch 
            ? paramsMatch[1].split(',').map(p => ({ label: p.trim().replace('?', '') }))
            : undefined;
            
        return systemEvent({
            name: descriptor.name,
            category: descriptor.category,
            summary: descriptor.summary,
            signatures: [{ 
                label: descriptor.signature,
                parameters
            }],
            appliesTo: descriptor.appliesTo,
            ownerTypes: descriptor.ownerTypes,
            obsolete: descriptor.obsolete,
            obsoleteMessage: descriptor.obsoleteMessage,
            replacement: descriptor.replacement,
            sourceUrl: descriptor.sourceUrl,
        });
    });
}

const PB_MANUAL_CORE_SYSTEM_EVENTS_MF_08B = defineSystemEventEntries([
    {
        name: 'DragDrop',
        category: 'Interaction',
        summary: 'Fires when a dragged control is dropped onto the window.',
        signature: 'DragDrop()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'DragEnter',
        category: 'Interaction',
        summary: 'Fires when a dragged control enters the window.',
        signature: 'DragEnter()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'DragLeave',
        category: 'Interaction',
        summary: 'Fires when a dragged control leaves the window.',
        signature: 'DragLeave()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'DragWithin',
        category: 'Interaction',
        summary: 'Fires while a dragged control remains inside the window.',
        signature: 'DragWithin()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'Help',
        category: 'Interaction',
        summary: 'Fires when the user presses F1 or uses context help from the title bar.',
        signature: 'Help()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'Key',
        category: 'Interaction',
        summary: 'Fires when the user presses a key outside a RichTextEdit or a DataWindow edit control.',
        signature: 'Key()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'MenuChanged',
        category: 'System',
        summary: 'Fires when the ribbon bar of an MDI or MDIHelp window is initialized or rebuilt.',
        signature: 'MenuChanged()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'MouseDown',
        category: 'Interaction',
        summary: 'Fires when the user presses the left button in a free area of the window.',
        signature: 'MouseDown(flags, xpos, ypos)',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'MouseMove',
        category: 'Interaction',
        summary: 'Fires when the pointer moves inside the window.',
        signature: 'MouseMove(flags, xpos, ypos)',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'MouseUp',
        category: 'Interaction',
        summary: 'Fires when the user releases the left button in a free area of the window.',
        signature: 'MouseUp(flags, xpos, ypos)',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
]);

const PB_MANUAL_CORE_SYSTEM_EVENTS_MF_08C = defineSystemEventEntries([
    {
        name: 'Other',
        category: 'System',
        summary: 'Fires when a Windows message occurs that does not correspond to a PowerBuilder event.',
        signature: 'Other(wparam, lparam)',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'RButtonDown',
        category: 'Interaction',
        summary: 'Fires when the user presses the right button in a free area of the window.',
        signature: 'RButtonDown()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'SystemKey',
        category: 'Interaction',
        summary: 'Fires when the user presses Alt or Alt with another key outside a DataWindow or RichTextEdit.',
        signature: 'SystemKey()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
    {
        name: 'ToolbarMoved',
        category: 'System',
        summary: 'Fires in an MDI window when the user moves the FrameBar or the SheetBar.',
        signature: 'ToolbarMoved()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    },
]);

const PB_MANUAL_CORE_SYSTEM_EVENTS_MF_08D = defineSystemEventEntries([
    {
        name: 'HotLinkAlarm',
        category: 'System',
        summary: 'Fires after a DDE server application sends new data and the DDE client application receives it.',
        signature: 'HotLinkAlarm()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
        obsolete: true,
        obsoleteMessage: 'DDE event is obsolete in PowerBuilder; maintained only for legacy compatibility.',
    },
    {
        name: 'RemoteExec',
        category: 'System',
        summary: 'Fires when a DDE client application sends a command.',
        signature: 'RemoteExec()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
        obsolete: true,
        obsoleteMessage: 'DDE event is obsolete in PowerBuilder; maintained only for legacy compatibility.',
    },
    {
        name: 'RemoteHotLinkStart',
        category: 'System',
        summary: 'Fires when a DDE client application requests to start a hot link.',
        signature: 'RemoteHotLinkStart()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
        obsolete: true,
        obsoleteMessage: 'DDE event is obsolete in PowerBuilder; maintained only for legacy compatibility.',
    },
    {
        name: 'RemoteHotLinkStop',
        category: 'System',
        summary: 'Fires when a DDE client application requests to terminate a hot link.',
        signature: 'RemoteHotLinkStop()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
        obsolete: true,
        obsoleteMessage: 'DDE event is obsolete in PowerBuilder; maintained only for legacy compatibility.',
    },
    {
        name: 'RemoteRequest',
        category: 'System',
        summary: 'Fires when a DDE client application requests data.',
        signature: 'RemoteRequest()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
        obsolete: true,
        obsoleteMessage: 'DDE event is obsolete in PowerBuilder; maintained only for legacy compatibility.',
    },
    {
        name: 'RemoteSend',
        category: 'System',
        summary: 'Fires when a DDE client application has sent data.',
        signature: 'RemoteSend()',
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
        obsolete: true,
        obsoleteMessage: 'DDE event is obsolete in PowerBuilder; maintained only for legacy compatibility.',
    },
]);

const PB_MANUAL_CORE_SYSTEM_EVENTS_MF_08E = defineSystemEventEntries([
    {
        name: 'SelectionChanged',
        category: 'Interaction',
        summary: 'Fires when the active selection of the control changes.',
        signature: 'SelectionChanged()',
        appliesTo: ['TreeView control', 'Tab control', 'ListBox control'],
        ownerTypes: ['treeview', 'tab', 'listbox'],
        sourceUrl: TREEVIEW_CONTROL_SOURCE_URL,
    },
    {
        name: 'SelectionChanging',
        category: 'Interaction',
        summary: 'Fires just before the selection changes and can return 1 to prevent the change.',
        signature: 'SelectionChanging()',
        appliesTo: ['TreeView control', 'Tab control'],
        ownerTypes: ['treeview', 'tab'],
        sourceUrl: TREEVIEW_CONTROL_SOURCE_URL,
    },
    {
        name: 'RightClicked',
        category: 'Interaction',
        summary: 'Fires when the user right-clicks on the control.',
        signature: 'RightClicked()',
        appliesTo: ['TreeView control', 'ListView control', 'Tab control'],
        ownerTypes: ['treeview', 'listview', 'tab'],
        sourceUrl: TREEVIEW_CONTROL_SOURCE_URL,
    },
    {
        name: 'RightDoubleClicked',
        category: 'Interaction',
        summary: 'Fires when the user double-clicks the right button on the control.',
        signature: 'RightDoubleClicked()',
        appliesTo: ['TreeView control', 'ListView control', 'Tab control'],
        ownerTypes: ['treeview', 'listview', 'tab'],
        sourceUrl: TREEVIEW_CONTROL_SOURCE_URL,
    },
]);

export const PB_MANUAL_CORE_SYSTEM_EVENTS: readonly PbSystemSymbolEntry[] = [
    systemEvent({
        name: 'Constructor',
        category: 'Lifecycle',
        summary: 'System event associated with the logical construction of the object.',
        signatures: [{ label: 'Constructor()' }],
        appliesTo: ['PowerBuilder objects with initialization script'],
    }),
    systemEvent({
        name: 'Destructor',
        category: 'Lifecycle',
        summary: 'System event associated with the logical destruction of the object.',
        signatures: [{ label: 'Destructor()' }],
        appliesTo: ['PowerBuilder objects with release script'],
    }),
    systemEvent({
        name: 'Open',
        category: 'Lifecycle',
        summary: 'System event fired when opening the object or entering its active cycle.',
        signatures: [{ label: 'Open()' }],
    }),
    systemEvent({
        name: 'Close',
        category: 'Lifecycle',
        summary: 'System event fired when the object requests to close.',
        signatures: [{ label: 'Close()' }],
    }),
    systemEvent({
        name: 'Activate',
        category: 'Lifecycle',
        summary: 'Fires just before the window becomes the active window.',
        signatures: [{ label: 'Activate()' }],
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    }),
    systemEvent({
        name: 'CloseQuery',
        category: 'Lifecycle',
        summary: 'Fires when trying to close a window and allows canceling the close via Message.ReturnValue.',
        signatures: [{ label: 'CloseQuery()' }],
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    }),
    systemEvent({
        name: 'Deactivate',
        category: 'Lifecycle',
        summary: 'Fires when the window ceases to be the active window.',
        signatures: [{ label: 'Deactivate()' }],
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    }),
    systemEvent({
        name: 'Hide',
        category: 'Lifecycle',
        summary: 'Fires just before a window is hidden.',
        signatures: [{ label: 'Hide()' }],
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    }),
    systemEvent({
        name: 'Show',
        category: 'Lifecycle',
        summary: 'Fires just before a window is displayed on screen via Show.',
        signatures: [{ 
            label: 'Show(show, status)',
            parameters: [
                { label: 'show' },
                { label: 'status' }
            ]
        }],
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    }),
    systemEvent({
        name: 'Clicked',
        category: 'Interaction',
        summary: 'System event fired when the user clicks a compatible visual control.',
        signatures: [{ label: 'Clicked()' }],
        appliesTo: ['visual controls with pointer interaction'],
    }),
    systemEvent({
        name: 'DoubleClicked',
        category: 'Interaction',
        summary: 'System event fired when the user double-clicks a compatible visual control.',
        signatures: [{ label: 'DoubleClicked()' }],
        appliesTo: ['visual controls with pointer interaction'],
    }),
    systemEvent({
        name: 'GetFocus',
        category: 'Interaction',
        summary: 'System event fired when the object obtains input focus.',
        signatures: [{ label: 'GetFocus()' }],
        appliesTo: ['focusable objects'],
        ownerTypes: FOCUSABLE_OBJECT_TYPES,
    }),
    systemEvent({
        name: 'LoseFocus',
        category: 'Interaction',
        summary: 'System event fired when the object loses input focus.',
        signatures: [{ label: 'LoseFocus()' }],
        appliesTo: ['focusable objects'],
        ownerTypes: FOCUSABLE_OBJECT_TYPES,
    }),
    systemEvent({
        name: 'KeyDown',
        category: 'Interaction',
        summary: 'System event fired when the user presses a key on the object with focus.',
        signatures: [{ label: 'KeyDown(key, keyflags)' }],
        appliesTo: ['focusable objects'],
        ownerTypes: FOCUSABLE_OBJECT_TYPES,
    }),
    systemEvent({
        name: 'KeyUp',
        category: 'Interaction',
        summary: 'System event fired when the user releases a key on the object with focus.',
        signatures: [{ label: 'KeyUp(key, keyflags)' }],
        appliesTo: ['focusable objects'],
        ownerTypes: FOCUSABLE_OBJECT_TYPES,
    }),
    systemEvent({
        name: 'Modified',
        category: 'Editing',
        summary: 'System event fired when the content of a compatible input control changes.',
        signatures: [{ label: 'Modified()' }],
        appliesTo: ['input and edit controls'],
        ownerTypes: INPUT_OBJECT_TYPES,
    }),
    systemEvent({
        name: 'Timer',
        category: 'System',
        summary: 'System event fired by timers associated with the object.',
        signatures: [{ label: 'Timer()' }],
    }),
    systemEvent({
        name: 'Resize',
        category: 'System',
        summary: 'Fires when the window is opened or resized by user action or script.',
        signatures: [{ 
            label: 'Resize(sizetype, newwidth, newheight)',
            parameters: [
                { label: 'sizetype' },
                { label: 'newwidth' },
                { label: 'newheight' }
            ]
        }],
        appliesTo: WINDOW_SYSTEM_EVENT_APPLIES_TO,
        ownerTypes: WINDOW_SYSTEM_EVENT_OWNER_TYPES,
        sourceUrl: WINDOW_CONTROL_SOURCE_URL,
    }),
    systemEvent({
        name: 'SystemError',
        category: 'Errors',
        summary: 'System event used by the runtime to propagate global errors.',
        signatures: [{ label: 'SystemError()' }],
        appliesTo: ['global error handling scripts'],
    }),
    ...PB_MANUAL_CORE_SYSTEM_EVENTS_MF_08B,
    ...PB_MANUAL_CORE_SYSTEM_EVENTS_MF_08C,
    ...PB_MANUAL_CORE_SYSTEM_EVENTS_MF_08D,
    ...PB_MANUAL_CORE_SYSTEM_EVENTS_MF_08E,
];
