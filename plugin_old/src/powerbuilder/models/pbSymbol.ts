import * as vscode from 'vscode';

export type PbSymbolKind =
    | 'type'
    | 'function'
    | 'subroutine'
    | 'event'
    | 'variable'
    | 'constant'
    | 'structure'
    | 'global-function';

export type PbContainerKind =
    | 'file-object'
    | 'type'
    | 'structure'
    | 'function'
    | 'subroutine'
    | 'event';

export type PbImplementationKind =
    | 'implementation'
    | 'prototype'
    | 'on-handler'
    | 'qualified-event';

export type PbDeclarationScope =
    | 'member'
    | 'local'
    | 'parameter';

export interface PbSymbol {
    name: string;
    kind: PbSymbolKind;
    uri: vscode.Uri;
    range: vscode.Range;
    selectionRange: vscode.Range;

    detail?: string;
    parent?: string;
    returnType?: string;
    access?: string;
    children?: PbSymbol[];

    /**
     * Nombre del contenedor inmediato al que pertenece el símbolo.
     * Ejemplos:
     * - util_w_opciones_impresion
     * - m_file
     * - w_master
     */
    containerName?: string;

    /**
     * Tipo del contenedor inmediato.
     */
    containerKind?: PbContainerKind;

    /**
     * Firma del contenedor inmediato cuando el símbolo pertenece a un callable.
     */
    containerSignature?: string;

    /**
     * Nombre del objeto raíz del archivo PB exportado.
     * Ejemplos:
     * - util_w_opciones_impresion
     * - m_rteframe
     * - n_tr
     */
    fileObjectName?: string;

    /**
     * Tipo de alcance semántico del símbolo.
     */
    declarationScope?: PbDeclarationScope;

    /**
     * Tipo base normalizado para tipos y estructuras que heredan de otro objeto.
     */
    baseTypeName?: string;

    /**
     * Firma textual normalizada.
     * Ejemplos:
     * - string of_getexampletitle(string as_classname)
     * - of_begin()
     * - clicked()
     */
    signature?: string;

    /**
     * Número de parámetros detectados en la firma.
     */
    parameterCount?: number;

    /**
     * True si el símbolo procede de "forward prototypes".
     */
    isPrototype?: boolean;

    /**
     * Clasificación adicional de la implementación.
     */
    implementationKind?: PbImplementationKind;

    /**
     * Nombre del propietario explícito en eventos calificados o handlers ON.
     * Ejemplos:
     * - m_find
     * - n_tr
     */
    ownerName?: string;

    /**
     * True si el símbolo declara una función o subrutina externa.
     */
    isExternal?: boolean;

    /**
     * Nombre de la librería declarada para la función o subrutina externa.
     */
    externalLibraryName?: string;

    /**
     * Nombre exportado real cuando se usa ALIAS FOR en una declaración externa.
     */
    externalName?: string;
}