import { PbSystemSymbolEntry } from '../../types';
import { dataWindowEvent } from '../common';
import {
    PB_MANUAL_CORE_DATAWINDOW_CONTROL_EVENT_APPLIES_TO,
    PB_MANUAL_CORE_DATAWINDOW_CONTROL_EVENT_OWNER_TYPES,
    PB_MANUAL_CORE_DATAWINDOW_DATA_EVENT_APPLIES_TO,
    PB_MANUAL_CORE_DATAWINDOW_DATA_EVENT_OWNER_TYPES,
} from '../ownerTypes/dataWindowOwnerTypes';

export const PB_MANUAL_CORE_DATAWINDOW_EVENT_CATEGORIES = [
    'Interaction',
    'Editing',
    'Navigation',
    'Errors',
    'Data',
    'Transactions',
] as const;

export const PB_MANUAL_CORE_DATAWINDOW_EVENTS: readonly PbSystemSymbolEntry[] = [
    dataWindowEvent({
        name: 'Clicked',
        category: 'Interaction',
        summary: 'Fires when the user clicks anywhere in the DataWindow.',
        signatures: [{
            label: 'Clicked(xpos, ypos, row, dwo)',
            parameters: [
                { label: 'xpos' },
                { label: 'ypos' },
                { label: 'row' },
                { label: 'dwo' }
            ]
        }],
        appliesTo: PB_MANUAL_CORE_DATAWINDOW_CONTROL_EVENT_APPLIES_TO,
        ownerTypes: PB_MANUAL_CORE_DATAWINDOW_CONTROL_EVENT_OWNER_TYPES,
        manualOverlay: {
            mode: 'override',
            reason: 'Enforces curated documentation for Clicked event.',
            evidence: ['manual-core:datawindow-events:event:object:member:clicked:datawindow'],
        },
        sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/dwevt_Clicked.html',
    }),
    dataWindowEvent({
        name: 'DoubleClicked',
        category: 'Interaction',
        summary: 'Fires when the user double-clicks inside the DataWindow.',
        signatures: [{
            label: 'DoubleClicked(xpos, ypos, row, dwo)',
            parameters: [
                { label: 'xpos' },
                { label: 'ypos' },
                { label: 'row' },
                { label: 'dwo' }
            ]
        }],
        appliesTo: PB_MANUAL_CORE_DATAWINDOW_CONTROL_EVENT_APPLIES_TO,
        ownerTypes: PB_MANUAL_CORE_DATAWINDOW_CONTROL_EVENT_OWNER_TYPES,
        manualOverlay: {
            mode: 'override',
            reason: 'Enforces curated documentation for DoubleClicked event.',
            evidence: ['manual-core:datawindow-events:event:object:member:doubleclicked:datawindow'],
        },
        sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/dwevt_DoubleClicked.html',
    }),
    dataWindowEvent({
        name: 'ButtonClicked',
        category: 'Interaction',
        summary: 'Fires after the user clicks a button contained in the DataWindow.',
        signatures: [{
            label: 'ButtonClicked(row, actionreturncode, dwo)',
            parameters: [
                { label: 'row' },
                { label: 'actionreturncode' },
                { label: 'dwo' }
            ]
        }],
        appliesTo: PB_MANUAL_CORE_DATAWINDOW_CONTROL_EVENT_APPLIES_TO,
        ownerTypes: PB_MANUAL_CORE_DATAWINDOW_CONTROL_EVENT_OWNER_TYPES,
        manualOverlay: {
            mode: 'override',
            reason: 'Enforces curated documentation for ButtonClicked event.',
            evidence: ['manual-core:datawindow-events:event:object:member:buttonclicked:datawindow'],
        },
        sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/dwevt_ButtonClicked.html',
    }),
    dataWindowEvent({
        name: 'ItemChanged',
        category: 'Editing',
        summary: 'Fires when a DataWindow item is changed and loses focus before the value is accepted.',
        signatures: [{
            label: 'ItemChanged(row, dwo, data)',
            parameters: [
                { label: 'row' },
                { label: 'dwo' },
                { label: 'data' }
            ]
        }],
        appliesTo: PB_MANUAL_CORE_DATAWINDOW_CONTROL_EVENT_APPLIES_TO,
        ownerTypes: PB_MANUAL_CORE_DATAWINDOW_CONTROL_EVENT_OWNER_TYPES,
        manualOverlay: {
            mode: 'override',
            reason: 'Enforces curated documentation for ItemChanged event.',
            evidence: ['manual-core:datawindow-events:event:object:member:itemchanged:datawindow'],
        },
        sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/dwevt_ItemChanged.html',
    }),
    dataWindowEvent({
        name: 'ItemError',
        category: 'Editing',
        summary: 'Fires when a modified value fails column validation.',
        signatures: [{
            label: 'ItemError(row, dwo, data)',
            parameters: [
                { label: 'row' },
                { label: 'dwo' },
                { label: 'data' }
            ]
        }],
        appliesTo: PB_MANUAL_CORE_DATAWINDOW_CONTROL_EVENT_APPLIES_TO,
        ownerTypes: PB_MANUAL_CORE_DATAWINDOW_CONTROL_EVENT_OWNER_TYPES,
        manualOverlay: {
            mode: 'override',
            reason: 'Enforces curated documentation for ItemError event.',
            evidence: ['manual-core:datawindow-events:event:object:member:itemerror:datawindow'],
        },
        sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/dwevt_ItemError.html',
    }),
    dataWindowEvent({
        name: 'ItemFocusChanged',
        category: 'Editing',
        summary: 'Fires when the current item with focus inside the DataWindow changes.',
        signatures: [{
            label: 'ItemFocusChanged(row, dwo)',
            parameters: [
                { label: 'row' },
                { label: 'dwo' }
            ]
        }],
        appliesTo: PB_MANUAL_CORE_DATAWINDOW_CONTROL_EVENT_APPLIES_TO,
        ownerTypes: PB_MANUAL_CORE_DATAWINDOW_CONTROL_EVENT_OWNER_TYPES,
        manualOverlay: {
            mode: 'override',
            reason: 'Enforces curated documentation for ItemFocusChanged event.',
            evidence: ['manual-core:datawindow-events:event:object:member:itemfocuschanged:datawindow'],
        },
        sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/dwevt_ItemFocusChanged.html',
    }),
    dataWindowEvent({
        name: 'RowFocusChanged',
        category: 'Navigation',
        summary: 'Fires when the current row of the DataWindow changes.',
        signatures: [{
            label: 'RowFocusChanged(currentrow)',
            parameters: [
                { label: 'currentrow' }
            ]
        }],
        appliesTo: PB_MANUAL_CORE_DATAWINDOW_CONTROL_EVENT_APPLIES_TO,
        ownerTypes: PB_MANUAL_CORE_DATAWINDOW_CONTROL_EVENT_OWNER_TYPES,
        manualOverlay: {
            mode: 'override',
            reason: 'Enforces curated documentation for RowFocusChanged event.',
            evidence: ['manual-core:datawindow-events:event:object:member:rowfocuschanged:datawindow'],
        },
        sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/dwevt_RowFocusChanged.html',
    }),
    dataWindowEvent({
        name: 'RowFocusChanging',
        category: 'Navigation',
        summary: 'Fires just before the current row of the DataWindow changes.',
        signatures: [{
            label: 'RowFocusChanging(currentrow, newrow)',
            parameters: [
                { label: 'currentrow' },
                { label: 'newrow' }
            ]
        }],
        appliesTo: PB_MANUAL_CORE_DATAWINDOW_CONTROL_EVENT_APPLIES_TO,
        ownerTypes: PB_MANUAL_CORE_DATAWINDOW_CONTROL_EVENT_OWNER_TYPES,
        manualOverlay: {
            mode: 'override',
            reason: 'Enforces curated documentation for RowFocusChanging event.',
            evidence: ['manual-core:datawindow-events:event:object:member:rowfocuschanging:datawindow'],
        },
        sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/dwevt_RowFocusChanging.html',
    }),
    dataWindowEvent({
        name: 'DBError',
        category: 'Errors',
        summary: 'Fires when a database operation of the DataWindow or DataStore results in an error.',
        signatures: [{
            label: 'DBError(sqldbcode, sqlerrtext, sqlsyntax, buffer, row)',
            parameters: [
                { label: 'sqldbcode' },
                { label: 'sqlerrtext' },
                { label: 'sqlsyntax' },
                { label: 'buffer' },
                { label: 'row' }
            ]
        }],
        appliesTo: PB_MANUAL_CORE_DATAWINDOW_DATA_EVENT_APPLIES_TO,
        ownerTypes: PB_MANUAL_CORE_DATAWINDOW_DATA_EVENT_OWNER_TYPES,
        manualOverlay: {
            mode: 'override',
            reason: 'Enforces curated documentation for DBError event.',
            evidence: ['manual-core:datawindow-events:event:object:member:dberror:datastore+datawindow'],
        },
        sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/dwevt_DBError.html',
    }),
    dataWindowEvent({
        name: 'RetrieveStart',
        category: 'Data',
        summary: 'Fires just before starting a Retrieve on the DataWindow or DataStore.',
        signatures: [{ label: 'RetrieveStart()' }],
        appliesTo: PB_MANUAL_CORE_DATAWINDOW_DATA_EVENT_APPLIES_TO,
        ownerTypes: PB_MANUAL_CORE_DATAWINDOW_DATA_EVENT_OWNER_TYPES,
        manualOverlay: {
            mode: 'override',
            reason: 'Enforces curated documentation for RetrieveStart event.',
            evidence: ['manual-core:datawindow-events:event:object:member:retrievestart:datastore+datawindow'],
        },
        sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/dwevt_RetrieveStart.html',
    }),
    dataWindowEvent({
        name: 'RetrieveRow',
        category: 'Data',
        summary: 'Fires after each row is retrieved during a Retrieve operation.',
        signatures: [{
            label: 'RetrieveRow(row)',
            parameters: [
                { label: 'row' }
            ]
        }],
        appliesTo: PB_MANUAL_CORE_DATAWINDOW_DATA_EVENT_APPLIES_TO,
        ownerTypes: PB_MANUAL_CORE_DATAWINDOW_DATA_EVENT_OWNER_TYPES,
        manualOverlay: {
            mode: 'override',
            reason: 'Enforces curated documentation for RetrieveRow event.',
            evidence: ['manual-core:datawindow-events:event:object:member:retrieverow:datastore+datawindow'],
        },
        sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/dwevt_RetrieveRow.html',
    }),
    dataWindowEvent({
        name: 'RetrieveEnd',
        category: 'Data',
        summary: 'Fires when the Retrieve process finishes.',
        signatures: [{
            label: 'RetrieveEnd(rowcount)',
            parameters: [
                { label: 'rowcount' }
            ]
        }],
        appliesTo: PB_MANUAL_CORE_DATAWINDOW_DATA_EVENT_APPLIES_TO,
        ownerTypes: PB_MANUAL_CORE_DATAWINDOW_DATA_EVENT_OWNER_TYPES,
        manualOverlay: {
            mode: 'override',
            reason: 'Enforces curated documentation for RetrieveEnd event.',
            evidence: ['manual-core:datawindow-events:event:object:member:retrieveend:datastore+datawindow'],
        },
        sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/dwevt_RetrieveEnd.html',
    }),
    dataWindowEvent({
        name: 'UpdateStart',
        category: 'Transactions',
        summary: 'Fires just before sending DataWindow or DataStore changes to the database.',
        signatures: [{ label: 'UpdateStart()' }],
        appliesTo: PB_MANUAL_CORE_DATAWINDOW_DATA_EVENT_APPLIES_TO,
        ownerTypes: PB_MANUAL_CORE_DATAWINDOW_DATA_EVENT_OWNER_TYPES,
        manualOverlay: {
            mode: 'override',
            reason: 'Enforces curated documentation for UpdateStart event.',
            evidence: ['manual-core:datawindow-events:event:object:member:updatestart:datastore+datawindow'],
        },
        sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/dwevt_UpdateStart.html',
    }),
    dataWindowEvent({
        name: 'UpdateEnd',
        category: 'Transactions',
        summary: 'Fires when the Update process finishes.',
        signatures: [{
            label: 'UpdateEnd(rowsinserted, rowsupdated, rowsdeleted)',
            parameters: [
                { label: 'rowsinserted' },
                { label: 'rowsupdated' },
                { label: 'rowsdeleted' }
            ]
        }],
        appliesTo: PB_MANUAL_CORE_DATAWINDOW_DATA_EVENT_APPLIES_TO,
        ownerTypes: PB_MANUAL_CORE_DATAWINDOW_DATA_EVENT_OWNER_TYPES,
        manualOverlay: {
            mode: 'override',
            reason: 'Enforces curated documentation for UpdateEnd event.',
            evidence: ['manual-core:datawindow-events:event:object:member:updateend:datastore+datawindow'],
        },
        sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/dwevt_UpdateEnd.html',
    }),
];
