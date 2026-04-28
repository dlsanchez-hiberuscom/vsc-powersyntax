import * as assert from 'assert';
import {
    PB_BUILTIN_FUNCTIONS,
    getBuiltinFunctionInfo,
} from '../../powerbuilder/resolution/builtinFunctions';
import {
    findSystemSymbolsByName,
    listSystemDataWindowEvents,
    listSystemDataWindowFunctions,
    listSystemEvents,
    listSystemGlobalFunctions,
    listSystemObjectFunctions,
    resolveSystemDataWindowEvent,
    resolveSystemEventForOwner,
    resolveSystemGlobalFunction,
    resolveSystemMemberFunctionForOwner,
    resolveSystemStatement,
} from '../../powerbuilder/systemSymbols/resolvers';

suite('BuiltinFunctions', () => {
    test('el adaptador heredado mantiene funciones globales comunes', () => {
        const expected = [
            'messagebox', 'isnull', 'isvalid', 'trim', 'left', 'right', 'mid',
            'len', 'pos', 'upper', 'lower', 'replace', 'string', 'integer',
            'long', 'double', 'dec', 'date', 'time', 'today', 'now',
            'year', 'month', 'day', 'hour', 'minute', 'second',
            'abs', 'round', 'mod', 'sqrt', 'max', 'min',
            'typeof', 'classname', 'setnull', 'fileopen', 'fileclose',
            'fileread', 'filewrite', 'fileexists', 'rgb',
        ];

        for (const fn of expected) {
            assert.ok(PB_BUILTIN_FUNCTIONS[fn], `Should contain entry for '${fn}'`);
        }
    });

    test('HALT deja de exponerse como builtin function y se resuelve como statement', () => {
        assert.strictEqual(resolveSystemGlobalFunction('HALT'), undefined);
        assert.ok(resolveSystemStatement('HALT'));
        assert.strictEqual(getBuiltinFunctionInfo('HALT'), undefined);
        assert.strictEqual(PB_BUILTIN_FUNCTIONS.halt, undefined);
    });

    test('el catálogo nuevo soporta lookup case-insensitive y firmas múltiples', () => {
        const clipboardSymbols = findSystemSymbolsByName('clipboard');
        const clipboardGlobal = resolveSystemGlobalFunction('clipboard');

        assert.ok(clipboardSymbols.length >= 1);
        assert.ok(clipboardSymbols.some(entry => entry.domain === 'global-functions'));
        assert.ok(clipboardGlobal);
        assert.strictEqual(clipboardGlobal!.name, 'Clipboard');
        assert.strictEqual(clipboardGlobal!.signatures.length, 2);
    });

    test('el catálogo nuevo soporta obsolescencia y replacement', () => {
        const leftW = resolveSystemGlobalFunction('leftw');
        const rightW = resolveSystemGlobalFunction('rightw');
        const midW = resolveSystemGlobalFunction('midw');
        const lenW = resolveSystemGlobalFunction('lenw');
        const leftTrimW = resolveSystemGlobalFunction('lefttrimw');
        const rightTrimW = resolveSystemGlobalFunction('righttrimw');
        const matchW = resolveSystemGlobalFunction('matchw');
        const fillW = resolveSystemGlobalFunction('fillw');

        assert.ok(leftW);
        assert.strictEqual(leftW!.obsolete, true);
        assert.strictEqual(leftW!.replacement, 'Left');
        assert.ok(rightW);
        assert.strictEqual(rightW!.obsolete, true);
        assert.strictEqual(rightW!.replacement, 'Right');
        assert.ok(rightW!.sourceUrl?.includes('rightW_func.html'));
        assert.ok(midW);
        assert.strictEqual(midW!.obsolete, true);
        assert.strictEqual(midW!.replacement, 'Mid');
        assert.ok(midW!.sourceUrl?.includes('midW_func.html'));
        assert.ok(lenW);
        assert.strictEqual(lenW!.obsolete, true);
        assert.strictEqual(lenW!.replacement, 'Len');
        assert.ok(lenW!.sourceUrl?.includes('lenW_func.html'));
        assert.ok(leftTrimW);
        assert.strictEqual(leftTrimW!.obsolete, true);
        assert.strictEqual(leftTrimW!.replacement, 'LeftTrim');
        assert.ok(leftTrimW!.sourceUrl?.includes('leftTrimW_func.html'));
        assert.ok(rightTrimW);
        assert.strictEqual(rightTrimW!.obsolete, true);
        assert.strictEqual(rightTrimW!.replacement, 'RightTrim');
        assert.ok(rightTrimW!.sourceUrl?.includes('rightTrimW_func.html'));
        assert.ok(matchW);
        assert.strictEqual(matchW!.obsolete, true);
        assert.strictEqual(matchW!.replacement, 'Match');
        assert.ok(matchW!.sourceUrl?.includes('matchW_func.html'));
        assert.ok(fillW);
        assert.strictEqual(fillW!.obsolete, true);
        assert.strictEqual(fillW!.replacement, 'Fill');
        assert.ok(fillW!.sourceUrl?.includes('fillW_func.html'));
    });

    test('el catálogo nuevo cubre funciones globales oficiales realmente usadas por el workspace de pruebas', () => {
        const openDialog = resolveSystemGlobalFunction('GetFileOpenName');
        const isNumber = resolveSystemGlobalFunction('IsNumber');

        assert.ok(openDialog);
        assert.ok(isNumber);
        assert.strictEqual(openDialog!.category, 'Diálogos');
        assert.strictEqual(isNumber!.category, 'Validación');
        assert.ok(PB_BUILTIN_FUNCTIONS.getfileopenname);
        assert.ok(PB_BUILTIN_FUNCTIONS.isnumber);
        assert.strictEqual(getBuiltinFunctionInfo('GetFileOpenName')?.name, 'GetFileOpenName');
        assert.strictEqual(getBuiltinFunctionInfo('IsNumber')?.name, 'IsNumber');
    });

    test('el catálogo nuevo cubre un bloque oficial de archivos y directorios del test workspace', () => {
        const expected = [
            'GetFileSaveName',
            'GetCurrentDirectory',
            'ChangeDirectory',
            'DirectoryExists',
            'CreateDirectory',
            'RemoveDirectory',
            'FileCopy',
            'FileDelete',
            'FileMove',
            'FileLength',
        ];

        for (const name of expected) {
            const symbol = resolveSystemGlobalFunction(name);

            assert.ok(symbol, `Expected system function ${name}`);
            assert.ok(PB_BUILTIN_FUNCTIONS[name.toLowerCase()], `Expected builtin markdown for ${name}`);
            assert.strictEqual(getBuiltinFunctionInfo(name)?.name, name);
        }
    });

    test('el catálogo nuevo cubre un bloque oficial de texto y fecha del test workspace', () => {
        const expected = [
            'LeftTrim',
            'RightTrim',
            'Fill',
            'LastPos',
            'Match',
            'WordCap',
            'IsDate',
            'IsTime',
            'DayName',
            'DayNumber',
        ];

        for (const name of expected) {
            const symbol = resolveSystemGlobalFunction(name);

            assert.ok(symbol, `Expected system function ${name}`);
            assert.ok(PB_BUILTIN_FUNCTIONS[name.toLowerCase()], `Expected builtin markdown for ${name}`);
            assert.strictEqual(getBuiltinFunctionInfo(name)?.name, name);
        }
    });

    test('el catálogo nuevo cubre un bloque oficial de conversión y fecha-hora del test workspace', () => {
        const expected = [
            'String',
            'Integer',
            'Long',
            'Double',
            'Dec',
            'Date',
            'Time',
            'Today',
            'Now',
            'Year',
            'Month',
            'Day',
            'Hour',
            'Minute',
            'Second',
        ];

        for (const name of expected) {
            const symbol = resolveSystemGlobalFunction(name);

            assert.ok(symbol, `Expected system function ${name}`);
            assert.ok(symbol!.sourceUrl, `Expected official sourceUrl for ${name}`);
            assert.ok(PB_BUILTIN_FUNCTIONS[name.toLowerCase()], `Expected builtin markdown for ${name}`);
            assert.strictEqual(getBuiltinFunctionInfo(name)?.name, name);
        }
    });

    test('el catálogo nuevo cubre un bloque oficial de matemáticas y sistema del test workspace', () => {
        const expected = [
            'Abs',
            'Round',
            'Mod',
            'Sqrt',
            'Max',
            'Min',
            'Log',
            'Exp',
            'Sin',
            'Cos',
            'Tan',
            'Rand',
            'Cpu',
        ];

        for (const name of expected) {
            const symbol = resolveSystemGlobalFunction(name);

            assert.ok(symbol, `Expected system function ${name}`);
            assert.ok(symbol!.sourceUrl, `Expected official sourceUrl for ${name}`);
            assert.ok(PB_BUILTIN_FUNCTIONS[name.toLowerCase()], `Expected builtin markdown for ${name}`);
            assert.strictEqual(getBuiltinFunctionInfo(name)?.name, name);
        }
    });

    test('el catálogo nuevo cubre un primer batch curado de 25 funciones globales oficiales', () => {
        const expected = [
            'LenW',
            'LeftTrimW',
            'RightTrimW',
            'MatchW',
            'FillW',
            'FileSeek',
            'FileSeek64',
            'FileReadEx',
            'FileWriteEx',
            'FileLength64',
            'FileEncoding',
            'CommandParm',
            'GetEnvironment',
            'PointerX',
            'PointerY',
            'SetPointer',
            'WorkSpaceHeight',
            'WorkSpaceWidth',
            'WorkSpaceX',
            'WorkSpaceY',
            'PixelsToUnits',
            'UnitsToPixels',
            'RelativeDate',
            'RelativeTime',
            'Pi',
        ];

        for (const name of expected) {
            const symbol = resolveSystemGlobalFunction(name);

            assert.ok(symbol, `Expected curated batch symbol ${name}`);
            assert.ok(symbol!.sourceUrl, `Expected official sourceUrl for ${name}`);
            assert.ok(PB_BUILTIN_FUNCTIONS[name.toLowerCase()], `Expected builtin markdown for ${name}`);
            assert.strictEqual(getBuiltinFunctionInfo(name)?.name, name);
        }
    });

    test('el catálogo nuevo cubre un segundo batch curado de 25 funciones globales oficiales', () => {
        const expected = [
            'Length',
            'Reverse',
            'BlobMid',
            'IntHigh',
            'IntLow',
            'ToAnsi',
            'ToUnicode',
            'DaysAfter',
            'SecondsAfter',
            'ACos',
            'ASin',
            'ATan',
            'Ceiling',
            'Fact',
            'LogTen',
            'Randomize',
            'Sign',
            'Truncate',
            'GetFocus',
            'DBHandle',
            'DebugBreak',
            'GarbageCollectGetTimeLimit',
            'GarbageCollectSetTimeLimit',
            'Sleep',
            'Timer',
        ];

        for (const name of expected) {
            const symbol = resolveSystemGlobalFunction(name);

            assert.ok(symbol, `Expected curated MF-02 symbol ${name}`);
            assert.ok(symbol!.sourceUrl, `Expected sourceUrl for ${name}`);
            assert.ok(PB_BUILTIN_FUNCTIONS[name.toLowerCase()], `Expected builtin markdown for ${name}`);
            assert.strictEqual(getBuiltinFunctionInfo(name)?.name, name);
        }

        assert.strictEqual(resolveSystemGlobalFunction('GetFocus')?.category, 'Objetos');
        assert.strictEqual(resolveSystemGlobalFunction('ToUnicode')?.category, 'Conversión');
        assert.strictEqual(resolveSystemGlobalFunction('Sleep')?.category, 'Sistema');
    });

    test('el catálogo nuevo cierra MF-02 con 10 globales oficiales de entorno y registro', () => {
        const expected = [
            'GetInstalledRuntimes',
            'IsRunningAsSolution',
            'AddToLibraryList',
            'GetLibraryList',
            'SetLibraryList',
            'RegistryDelete',
            'RegistryGet',
            'RegistryKeys',
            'RegistrySet',
            'RegistryValues',
        ];

        for (const name of expected) {
            const symbol = resolveSystemGlobalFunction(name);

            assert.ok(symbol, `Expected curated MF-02 closure symbol ${name}`);
            assert.ok(symbol!.sourceUrl, `Expected sourceUrl for ${name}`);
            assert.ok(PB_BUILTIN_FUNCTIONS[name.toLowerCase()], `Expected builtin markdown for ${name}`);
            assert.strictEqual(getBuiltinFunctionInfo(name)?.name, name);
        }

        assert.strictEqual(resolveSystemGlobalFunction('RegistryGet')?.category, 'Configuración');
        assert.strictEqual(resolveSystemGlobalFunction('SetLibraryList')?.category, 'Proyecto / IDE');
        assert.strictEqual(resolveSystemGlobalFunction('GetInstalledRuntimes')?.category, 'Proyecto / IDE');
    });

    test('la ampliación V2 añade ProfileInt y GetFolder con taxonomía más estricta', () => {
        const expected = ['ProfileInt', 'GetFolder'];

        for (const name of expected) {
            const symbol = resolveSystemGlobalFunction(name);

            assert.ok(symbol, `Expected curated V2 symbol ${name}`);
            assert.ok(symbol!.sourceUrl?.includes('/powerscript_reference/'), `Expected official sourceUrl for ${name}`);
            assert.ok(PB_BUILTIN_FUNCTIONS[name.toLowerCase()], `Expected builtin markdown for ${name}`);
            assert.strictEqual(getBuiltinFunctionInfo(name)?.name, name);
        }

        assert.strictEqual(resolveSystemGlobalFunction('ProfileInt')?.category, 'Configuración');
        assert.strictEqual(resolveSystemGlobalFunction('GetFolder')?.category, 'Diálogos');
    });

    test('MF-03 cubre 15 funciones oficiales de diálogos, tracing y ventanas', () => {
        const expected = [
            'ChooseColor',
            'ShowHelp',
            'ShowPopupHelp',
            'OpenURL',
            'TraceBegin',
            'TraceClose',
            'TraceDisableActivity',
            'TraceEnableActivity',
            'TraceEnd',
            'TraceError',
            'TraceOpen',
            'TraceUser',
            'PBGetMenuString',
            'Open',
            'Close',
        ];

        for (const name of expected) {
            const symbol = resolveSystemGlobalFunction(name);

            assert.ok(symbol, `Expected curated MF-03 symbol ${name}`);
            assert.ok(symbol!.sourceUrl?.includes('/powerscript_reference/'), `Expected official sourceUrl for ${name}`);
            assert.ok(PB_BUILTIN_FUNCTIONS[name.toLowerCase()], `Expected builtin markdown for ${name}`);
            assert.strictEqual(getBuiltinFunctionInfo(name)?.name, name);
        }

        assert.strictEqual(resolveSystemGlobalFunction('ChooseColor')?.category, 'Diálogos');
        assert.strictEqual(resolveSystemGlobalFunction('OpenURL')?.category, 'Web / HTTP');
        assert.strictEqual(resolveSystemGlobalFunction('TraceOpen')?.category, 'Sistema');
        assert.strictEqual(resolveSystemGlobalFunction('Close')?.category, 'Sistema');
    });

    test('all keys should be lowercase and values should be markdown', () => {
        for (const [key, value] of Object.entries(PB_BUILTIN_FUNCTIONS)) {
            assert.strictEqual(key, key.toLowerCase(), `Key '${key}' should be lowercase`);
            assert.ok(typeof value === 'string', `Value for '${key}' should be a string`);
            assert.ok(value.length > 0, `Value for '${key}' should not be empty`);
            assert.ok(value.includes('**'), `Value for '${key}' should contain markdown bold`);
        }
    });

    test('el catálogo manual ya alcanza el cierre operativo de MF-03 en funciones globales', () => {
        const count = listSystemGlobalFunctions().length;
        assert.ok(count >= 174, `Expected at least 174 global system functions, got ${count}`);
    });

    test('el catálogo manual ya enlaza al menos 170 funciones globales oficiales de PowerScript', () => {
        const officialCount = listSystemGlobalFunctions().filter(symbol =>
            symbol.sourceUrl?.includes('/powerscript_reference/'),
        ).length;

        assert.ok(officialCount >= 170, `Expected at least 170 official PowerScript functions, got ${officialCount}`);
    });

    test('MF-04A cubre métodos owner-aware de edición de texto con fuente oficial', () => {
        const expected = [
            ['CanUndo', 'singlelineedit'],
            ['Clear', 'singlelineedit'],
            ['Copy', 'editmask'],
            ['Cut', 'multilineedit'],
            ['Paste', 'singlelineedit'],
            ['ReplaceText', 'multilineedit'],
            ['SelectText', 'editmask'],
            ['Undo', 'singlelineedit'],
        ] as const;

        for (const [name, ownerType] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), [ownerType]);

            assert.ok(symbol, `Expected owner-aware method ${name} for ${ownerType}`);
            assert.strictEqual(symbol!.namespace, 'object');
            assert.strictEqual(symbol!.category, 'Texto');
            assert.ok(symbol!.sourceUrl?.includes('SingleLineEdit_control.html'));
        }

        assert.strictEqual(resolveSystemMemberFunctionForOwner('selecttext', ['statictext']), undefined);
    });

    test('MF-04B cubre métodos owner-aware de contexto, puntero y selección con fuente oficial', () => {
        const expected = [
            ['ClassName', 'singlelineedit', 'Contexto'],
            ['GetParent', 'editmask', 'Contexto'],
            ['PointerX', 'multilineedit', 'Interacción'],
            ['PointerY', 'singlelineedit', 'Interacción'],
            ['Position', 'editmask', 'Texto'],
            ['SelectedLength', 'multilineedit', 'Texto'],
            ['SelectedStart', 'singlelineedit', 'Texto'],
            ['SelectedText', 'editmask', 'Texto'],
            ['TypeOf', 'multilineedit', 'Contexto'],
        ] as const;

        for (const [name, ownerType, category] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), [ownerType]);

            assert.ok(symbol, `Expected owner-aware method ${name} for ${ownerType}`);
            assert.strictEqual(symbol!.namespace, 'object');
            assert.strictEqual(symbol!.category, category);
            assert.ok(symbol!.sourceUrl?.includes('SingleLineEdit_control.html'));
        }

        assert.strictEqual(resolveSystemMemberFunctionForOwner('selectedtext', ['statictext']), undefined);
    });

    test('MF-04C cubre métodos owner-aware de línea y scroll para EditMask y MultiLineEdit', () => {
        const expected = [
            ['LineCount', 'editmask'],
            ['LineLength', 'multilineedit'],
            ['Scroll', 'editmask'],
            ['SelectedLine', 'multilineedit'],
            ['TextLine', 'editmask'],
        ] as const;

        for (const [name, ownerType] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), [ownerType]);

            assert.ok(symbol, `Expected owner-aware method ${name} for ${ownerType}`);
            assert.strictEqual(symbol!.namespace, 'object');
            assert.strictEqual(symbol!.category, 'Texto');
            assert.ok(symbol!.sourceUrl?.includes('MultiLineEdit_control.html'));
        }

        assert.strictEqual(resolveSystemMemberFunctionForOwner('linecount', ['singlelineedit']), undefined);
    });

    test('MF-04D cubre métodos owner-aware de ventana con homónimos de contexto y workspace', () => {
        const expected = [
            ['GetParent', 'Contexto'],
            ['ParentWindow', 'Contexto'],
            ['PointerX', 'Interacción'],
            ['PointerY', 'Interacción'],
            ['Print', 'Visual'],
            ['TypeOf', 'Contexto'],
            ['WorkSpaceHeight', 'Layout'],
            ['WorkSpaceWidth', 'Layout'],
            ['WorkSpaceX', 'Layout'],
            ['WorkSpaceY', 'Layout'],
        ] as const;

        for (const [name, category] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), ['window']);

            assert.ok(symbol, `Expected owner-aware window method ${name}`);
            assert.strictEqual(symbol!.namespace, 'object');
            assert.strictEqual(symbol!.category, category);
            assert.ok(symbol!.sourceUrl?.includes('Window_control.html'));
        }

        assert.strictEqual(resolveSystemMemberFunctionForOwner('workspacewidth', ['singlelineedit']), undefined);
    });

    test('MF-06A cubre métodos owner-aware curados de ventana y controles ricos', () => {
        const expected = [
            ['OpenSheet', 'window', 'Visual', 'Window_control.html'],
            ['SaveDockingState', 'window', 'Contexto', 'Window_control.html'],
            ['AddItem', 'listbox', 'Interacción', 'ListBox_control.html'],
            ['SelectTab', 'tab', 'Interacción', 'Tab_control.html'],
            ['AddColumn', 'listview', 'Layout', 'ListView_control.html'],
            ['SetLevelPictures', 'treeview', 'Visual', 'TreeView_control.html'],
        ] as const;

        for (const [name, ownerType, category, sourceSnippet] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), [ownerType]);

            assert.ok(symbol, `Expected owner-aware curated method ${name} for ${ownerType}`);
            assert.strictEqual(symbol!.namespace, 'object');
            assert.strictEqual(symbol!.category, category);
            assert.ok(symbol!.sourceUrl?.includes(sourceSnippet));
        }

        assert.strictEqual(resolveSystemMemberFunctionForOwner('opensheet', ['singlelineedit']), undefined);
        assert.strictEqual(resolveSystemMemberFunctionForOwner('setlevelpictures', ['listview']), undefined);
    });

    test('MF-09A cubre funciones residuales de image lists y columnas en ListView', () => {
        const expected = [
            ['DeleteLargePicture', 'Visual'],
            ['DeleteLargePictures', 'Visual'],
            ['DeleteSmallPicture', 'Visual'],
            ['DeleteSmallPictures', 'Visual'],
            ['DeleteStatePicture', 'Visual'],
            ['DeleteStatePictures', 'Visual'],
            ['Sort', 'Layout'],
            ['TotalColumns', 'Contexto'],
        ] as const;

        for (const [name, category] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), ['listview']);

            assert.ok(symbol, `Expected curated ListView method ${name}`);
            assert.strictEqual(symbol!.namespace, 'object');
            assert.strictEqual(symbol!.category, category);
            assert.ok(symbol!.sourceUrl?.includes('ListView_control.html'));
        }

        assert.strictEqual(resolveSystemMemberFunctionForOwner('deletelargepicture', ['treeview']), undefined);
        assert.strictEqual(resolveSystemMemberFunctionForOwner('totalcolumns', ['treeview']), undefined);
    });

    test('MF-09B cubre arrastre, seleccion y totalizadores residuales de ListView', () => {
        const expected = [
            ['Drag', 'Interacción'],
            ['SelectedIndex', 'Interacción'],
            ['TotalItems', 'Interacción'],
            ['TotalSelected', 'Interacción'],
        ] as const;

        for (const [name, category] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), ['listview']);

            assert.ok(symbol, `Expected curated ListView method ${name}`);
            assert.strictEqual(symbol!.namespace, 'object');
            assert.strictEqual(symbol!.category, category);
            assert.ok(symbol!.sourceUrl?.includes('ListView_control.html'));
        }

        const listBoxSelectedIndex = resolveSystemMemberFunctionForOwner('selectedindex', ['listbox']);

        assert.ok(listBoxSelectedIndex);
        assert.ok(listBoxSelectedIndex!.sourceUrl?.includes('ListBox_control.html'));
        assert.strictEqual(resolveSystemMemberFunctionForOwner('totalselected', ['treeview']), undefined);
    });

    test('MF-09C cubre salida, posicion y tipo runtime residuales de ListView', () => {
        const expected = [
            ['Print', 'Visual'],
            ['SetPosition', 'Layout'],
            ['TypeOf', 'Contexto'],
        ] as const;

        for (const [name, category] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), ['listview']);

            assert.ok(symbol, `Expected curated ListView method ${name}`);
            assert.strictEqual(symbol!.namespace, 'object');
            assert.strictEqual(symbol!.category, category);
            assert.ok(symbol!.sourceUrl?.includes('ListView_control.html'));
        }

        assert.ok(resolveSystemMemberFunctionForOwner('print', ['window'])?.sourceUrl?.includes('Window_control.html'));
        assert.ok(resolveSystemMemberFunctionForOwner('setposition', ['treeview'])?.sourceUrl?.includes('TreeView_control.html'));
    });

    test('MF-09D cubre limpieza de image lists residuales de TreeView', () => {
        const expected = [
            ['DeletePicture', 'Visual'],
            ['DeletePictures', 'Visual'],
            ['DeleteStatePicture', 'Visual'],
            ['DeleteStatePictures', 'Visual'],
        ] as const;

        for (const [name, category] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), ['treeview']);

            assert.ok(symbol, `Expected curated TreeView method ${name}`);
            assert.strictEqual(symbol!.namespace, 'object');
            assert.strictEqual(symbol!.category, category);
            assert.ok(symbol!.sourceUrl?.includes('TreeView_control.html'));
        }

        assert.strictEqual(resolveSystemMemberFunctionForOwner('deletepicture', ['listview']), undefined);
        assert.ok(resolveSystemMemberFunctionForOwner('deletestatepicture', ['listview'])?.sourceUrl?.includes('ListView_control.html'));
    });

    test('MF-09E cubre contexto, salida y posicion residuales de TreeView', () => {
        const expected = [
            ['ClassName', 'Contexto'],
            ['Print', 'Visual'],
            ['SetPosition', 'Layout'],
            ['TypeOf', 'Contexto'],
        ] as const;

        for (const [name, category] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), ['treeview']);

            assert.ok(symbol, `Expected curated TreeView method ${name}`);
            assert.strictEqual(symbol!.namespace, 'object');
            assert.strictEqual(symbol!.category, category);
            assert.ok(symbol!.sourceUrl?.includes('TreeView_control.html'));
        }

        assert.ok(resolveSystemMemberFunctionForOwner('classname', ['listview'])?.sourceUrl?.includes('ListView_control.html'));
        assert.ok(resolveSystemMemberFunctionForOwner('typeof', ['window'])?.sourceUrl?.includes('Window_control.html'));
    });

    test('MF-09F cubre overlay y ordenacion residual de TreeView', () => {
        const expected = [
            ['SetOverlayPicture', 'Visual'],
            ['Sort', 'Layout'],
            ['SortAll', 'Layout'],
        ] as const;

        for (const [name, category] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), ['treeview']);

            assert.ok(symbol, `Expected curated TreeView method ${name}`);
            assert.strictEqual(symbol!.namespace, 'object');
            assert.strictEqual(symbol!.category, category);
            assert.ok(symbol!.sourceUrl?.includes('TreeView_control.html'));
        }

        assert.ok(resolveSystemMemberFunctionForOwner('setoverlaypicture', ['listview'])?.sourceUrl?.includes('ListView_control.html'));
        assert.ok(resolveSystemMemberFunctionForOwner('sort', ['listview'])?.sourceUrl?.includes('ListView_control.html'));
    });

    test('MF-09G cubre contexto y orden Z residuales de Window', () => {
        const expected = [
            ['ClassName', 'Contexto'],
            ['SetPosition', 'Layout'],
        ] as const;

        for (const [name, category] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), ['window']);

            assert.ok(symbol, `Expected curated Window method ${name}`);
            assert.strictEqual(symbol!.namespace, 'object');
            assert.strictEqual(symbol!.category, category);
            assert.ok(symbol!.sourceUrl?.includes('Window_control.html'));
        }

        assert.ok(resolveSystemMemberFunctionForOwner('classname', ['tab'])?.sourceUrl?.includes('Tab_control.html'));
        assert.ok(resolveSystemMemberFunctionForOwner('setposition', ['listview'])?.sourceUrl?.includes('ListView_control.html'));
    });

    test('MF-09H cubre CommitDocking como helper obsoleto de dockable windows', () => {
        const symbol = resolveSystemMemberFunctionForOwner('commitdocking', ['window']);

        assert.ok(symbol);
        assert.strictEqual(symbol!.namespace, 'object');
        assert.strictEqual(symbol!.category, 'Visual');
        assert.strictEqual(symbol!.obsolete, true);
        assert.ok(symbol!.obsoleteMessage?.includes('dockable windows'));
        assert.ok(symbol!.sourceUrl?.includes('Window_control.html'));
        assert.strictEqual(resolveSystemMemberFunctionForOwner('commitdocking', ['treeview']), undefined);
    });

    test('MF-09I cubre LoadDockingState como helper obsoleto de docking persistido', () => {
        const symbol = resolveSystemMemberFunctionForOwner('loaddockingstate', ['window']);

        assert.ok(symbol);
        assert.strictEqual(symbol!.namespace, 'object');
        assert.strictEqual(symbol!.category, 'Contexto');
        assert.strictEqual(symbol!.obsolete, true);
        assert.ok(symbol!.obsoleteMessage?.includes('dockable windows'));
        assert.ok(symbol!.sourceUrl?.includes('Window_control.html'));
        assert.strictEqual(resolveSystemMemberFunctionForOwner('loaddockingstate', ['tab']), undefined);
    });

    test('MF-09J cubre OpenSheetAsDocument como apertura obsoleta de documento docked', () => {
        const symbol = resolveSystemMemberFunctionForOwner('opensheetasdocument', ['window']);

        assert.ok(symbol);
        assert.strictEqual(symbol!.namespace, 'object');
        assert.strictEqual(symbol!.category, 'Visual');
        assert.strictEqual(symbol!.obsolete, true);
        assert.ok(symbol!.obsoleteMessage?.includes('dockable windows'));
        assert.ok(symbol!.sourceUrl?.includes('Window_control.html'));
        assert.strictEqual(resolveSystemMemberFunctionForOwner('opensheetasdocument', ['listview']), undefined);
    });

    test('MF-09K cubre OpenSheetDocked como apertura obsoleta en posición docked', () => {
        const symbol = resolveSystemMemberFunctionForOwner('opensheetdocked', ['window']);

        assert.ok(symbol);
        assert.strictEqual(symbol!.namespace, 'object');
        assert.strictEqual(symbol!.category, 'Visual');
        assert.strictEqual(symbol!.obsolete, true);
        assert.ok(symbol!.obsoleteMessage?.includes('dockable windows'));
        assert.ok(symbol!.sourceUrl?.includes('Window_control.html'));
        assert.strictEqual(resolveSystemMemberFunctionForOwner('opensheetdocked', ['treeview']), undefined);
    });

    test('MF-09L cubre OpenSheetFromDockingState como restauración obsoleta de docking', () => {
        const symbol = resolveSystemMemberFunctionForOwner('opensheetfromdockingstate', ['window']);

        assert.ok(symbol);
        assert.strictEqual(symbol!.namespace, 'object');
        assert.strictEqual(symbol!.category, 'Visual');
        assert.strictEqual(symbol!.obsolete, true);
        assert.ok(symbol!.obsoleteMessage?.includes('dockable windows'));
        assert.ok(symbol!.sourceUrl?.includes('Window_control.html'));
        assert.strictEqual(resolveSystemMemberFunctionForOwner('opensheetfromdockingstate', ['tab']), undefined);
    });

    test('MF-09M cubre OpenSheetInTabGroup como apertura obsoleta por grupo de pestañas', () => {
        const symbol = resolveSystemMemberFunctionForOwner('opensheetintabgroup', ['window']);

        assert.ok(symbol);
        assert.strictEqual(symbol!.namespace, 'object');
        assert.strictEqual(symbol!.category, 'Visual');
        assert.strictEqual(symbol!.obsolete, true);
        assert.ok(symbol!.obsoleteMessage?.includes('dockable windows'));
        assert.ok(symbol!.sourceUrl?.includes('Window_control.html'));
        assert.strictEqual(resolveSystemMemberFunctionForOwner('opensheetintabgroup', ['listbox']), undefined);
    });

    test('MF-09N cubre OpenSheetWithParmAsDocument como apertura obsoleta con parámetro', () => {
        const symbol = resolveSystemMemberFunctionForOwner('opensheetwithparmasdocument', ['window']);

        assert.ok(symbol);
        assert.strictEqual(symbol!.namespace, 'object');
        assert.strictEqual(symbol!.category, 'Visual');
        assert.strictEqual(symbol!.obsolete, true);
        assert.ok(symbol!.obsoleteMessage?.includes('dockable windows'));
        assert.ok(symbol!.sourceUrl?.includes('Window_control.html'));
        assert.strictEqual(resolveSystemMemberFunctionForOwner('opensheetwithparmasdocument', ['treeview']), undefined);
    });

    test('MF-09O cubre OpenSheetWithParmDocked como apertura obsoleta docked con parámetro', () => {
        const symbol = resolveSystemMemberFunctionForOwner('opensheetwithparmdocked', ['window']);

        assert.ok(symbol);
        assert.strictEqual(symbol!.namespace, 'object');
        assert.strictEqual(symbol!.category, 'Visual');
        assert.strictEqual(symbol!.obsolete, true);
        assert.ok(symbol!.obsoleteMessage?.includes('dockable windows'));
        assert.ok(symbol!.sourceUrl?.includes('Window_control.html'));
        assert.strictEqual(resolveSystemMemberFunctionForOwner('opensheetwithparmdocked', ['tab']), undefined);
    });

    test('MF-09P cubre OpenSheetWithParmFromDockingState como restauración obsoleta con parámetro', () => {
        const symbol = resolveSystemMemberFunctionForOwner('opensheetwithparmfromdockingstate', ['window']);

        assert.ok(symbol);
        assert.strictEqual(symbol!.namespace, 'object');
        assert.strictEqual(symbol!.category, 'Visual');
        assert.strictEqual(symbol!.obsolete, true);
        assert.ok(symbol!.obsoleteMessage?.includes('dockable windows'));
        assert.ok(symbol!.sourceUrl?.includes('Window_control.html'));
        assert.strictEqual(resolveSystemMemberFunctionForOwner('opensheetwithparmfromdockingstate', ['listview']), undefined);
    });

    test('MF-09Q cubre OpenSheetWithParmInTabGroup como apertura obsoleta por grupo con parámetro', () => {
        const symbol = resolveSystemMemberFunctionForOwner('opensheetwithparmintabgroup', ['window']);

        assert.ok(symbol);
        assert.strictEqual(symbol!.namespace, 'object');
        assert.strictEqual(symbol!.category, 'Visual');
        assert.strictEqual(symbol!.obsolete, true);
        assert.ok(symbol!.obsoleteMessage?.includes('dockable windows'));
        assert.ok(symbol!.sourceUrl?.includes('Window_control.html'));
        assert.strictEqual(resolveSystemMemberFunctionForOwner('opensheetwithparmintabgroup', ['treeview']), undefined);
    });

    test('MF-09R cubre la familia DDE legacy de Window como compatibilidad heredada obsoleta', () => {
        const expected = [
            'CloseChannel',
            'ExecRemote',
            'GetCommandDDE',
            'GetCommandDDEOrigin',
            'GetDataDDE',
            'GetDataDDEOrigin',
            'GetRemote',
            'OpenChannel',
            'RespondRemote',
            'SetDataDDE',
            'SetRemote',
            'StartHotLink',
            'StartServerDDE',
            'StopHotLink',
            'StopServerDDE',
        ] as const;

        for (const name of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), ['window']);

            assert.ok(symbol, `Expected legacy DDE Window method ${name}`);
            assert.strictEqual(symbol!.namespace, 'object');
            assert.strictEqual(symbol!.obsolete, true);
            assert.ok(symbol!.obsoleteMessage?.includes('compatibilidad heredada'));
            assert.ok(symbol!.sourceUrl?.includes('Window_control.html'));
        }

        assert.strictEqual(resolveSystemMemberFunctionForOwner('openchannel', ['listview']), undefined);
    });

    test('MF-05A cubre getters tipados y ayudas de identidad de fila DataWindow', () => {
        const expected = [
            ['GetItemNumber', 'datawindow'],
            ['GetItemTime', 'datawindowchild'],
            ['GetNextModified', 'datastore'],
            ['GetRowFromRowId', 'datawindow'],
            ['GetRowIdFromRow', 'datawindowchild'],
            ['GetSelectedRow', 'datastore'],
            ['GetSQLSelect', 'datawindow'],
            ['GetText', 'datawindowchild'],
            ['GetValidate', 'datastore'],
            ['GetValue', 'datawindow'],
        ] as const;

        for (const [name, ownerType] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), [ownerType]);

            assert.ok(symbol, `Expected DataWindow method ${name} for ${ownerType}`);
            assert.strictEqual(symbol!.namespace, 'datawindow');
            assert.ok(symbol!.sourceUrl?.includes(`/dwmeth_${name}.html`));
        }

        assert.strictEqual(resolveSystemMemberFunctionForOwner('getitemnumber', ['singlelineedit']), undefined);
    });

    test('MF-05B cubre helpers de columnas y child reports DataWindow', () => {
        const expected = [
            ['ClearValues', 'datawindowchild'],
            ['GetChild', 'datawindow'],
            ['GetClickedColumn', 'datastore'],
            ['GetClickedRow', 'datawindowchild'],
            ['GetColumn', 'datawindow'],
            ['GetColumnName', 'datastore'],
            ['GetFormat', 'datawindowchild'],
            ['SetColumn', 'datastore'],
            ['SetFormat', 'datawindow'],
            ['SetValue', 'datawindowchild'],
        ] as const;

        for (const [name, ownerType] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), [ownerType]);

            assert.ok(symbol, `Expected DataWindow column helper ${name} for ${ownerType}`);
            assert.strictEqual(symbol!.namespace, 'datawindow');
            assert.ok(symbol!.sourceUrl?.includes(`/dwmeth_${name}.html`));
        }

        assert.strictEqual(resolveSystemMemberFunctionForOwner('getchild', ['singlelineedit']), undefined);
    });

    test('MF-05C cubre buffers y blobs de estado DataWindow', () => {
        const expected = [
            ['DeletedCount', 'datawindowchild'],
            ['FilteredCount', 'datastore'],
            ['ModifiedCount', 'datawindow'],
            ['GetChanges', 'datawindowchild'],
            ['GetFullState', 'datastore'],
            ['GetStateStatus', 'datawindow'],
            ['ResetUpdate', 'datawindowchild'],
            ['RowsCopy', 'datastore'],
            ['RowsDiscard', 'datawindow'],
            ['SetChanges', 'datawindowchild'],
        ] as const;

        for (const [name, ownerType] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), [ownerType]);

            assert.ok(symbol, `Expected DataWindow state helper ${name} for ${ownerType}`);
            assert.strictEqual(symbol!.namespace, 'datawindow');
            assert.ok(symbol!.sourceUrl?.includes(`/dwmeth_${name}.html`));
        }

        assert.strictEqual(resolveSystemMemberFunctionForOwner('rowscopy', ['singlelineedit']), undefined);
    });

    test('MF-05D cubre transacciones, share y persistencia DataWindow', () => {
        const expected = [
            ['DBCancel', 'datawindow'],
            ['GetTrans', 'datastore'],
            ['ResetTransObject', 'datawindowchild'],
            ['ReselectRow', 'datawindow'],
            ['SetSQLSelect', 'datastore'],
            ['SetTrans', 'datawindowchild'],
            ['ShareData', 'datawindow'],
            ['ShareDataOff', 'datastore'],
            ['SaveAs', 'datawindowchild'],
            ['SaveNativePDFToBlob', 'datawindow'],
        ] as const;

        for (const [name, ownerType] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), [ownerType]);

            assert.ok(symbol, `Expected DataWindow transactional method ${name} for ${ownerType}`);
            assert.strictEqual(symbol!.namespace, 'datawindow');
            assert.ok(symbol!.sourceUrl?.includes(`/dwmeth_${name}.html`));
        }

        assert.strictEqual(resolveSystemMemberFunctionForOwner('gettrans', ['singlelineedit']), undefined);
    });

    test('MF-05E cubre importación, exportación e impresión DataWindow', () => {
        const expected = [
            ['ExportJson', 'datawindow'],
            ['ExportRowAsJson', 'datawindowchild'],
            ['ImportClipboard', 'datastore'],
            ['ImportFile', 'datawindow'],
            ['ImportJson', 'datawindowchild'],
            ['ImportJsonByKey', 'datastore'],
            ['ImportRowFromJson', 'datawindow'],
            ['ImportString', 'datawindowchild'],
            ['Print', 'datastore'],
            ['PrintCancel', 'datawindow'],
        ] as const;

        for (const [name, ownerType] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), [ownerType]);

            assert.ok(symbol, `Expected DataWindow IO method ${name} for ${ownerType}`);
            assert.strictEqual(symbol!.namespace, 'datawindow');
            assert.ok(symbol!.sourceUrl?.includes(`/dwmeth_${name}.html`));
        }

        assert.strictEqual(resolveSystemMemberFunctionForOwner('printcancel', ['singlelineedit']), undefined);
    });

    test('MF-05F cubre contexto, layout y expansión TreeView de DataWindow', () => {
        const expected = [
            ['ClassName', 'datawindowchild'],
            ['GetContextService', 'datastore'],
            ['GetParent', 'datawindow'],
            ['TypeOf', 'datawindowchild'],
            ['GetBorderStyle', 'datastore'],
            ['SetBorderStyle', 'datawindow'],
            ['SetDetailHeight', 'datawindowchild'],
            ['SetPosition', 'datastore'],
            ['Expand', 'datawindow'],
            ['ExpandAll', 'datawindowchild'],
        ] as const;

        for (const [name, ownerType] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), [ownerType]);

            assert.ok(symbol, `Expected DataWindow context/layout method ${name} for ${ownerType}`);
            assert.strictEqual(symbol!.namespace, 'datawindow');
            assert.ok(symbol!.sourceUrl?.includes(`/dwmeth_${name}.html`));
        }

        assert.strictEqual(resolveSystemMemberFunctionForOwner('expand', ['singlelineedit']), undefined);
    });

    test('MF-05G cubre edición de texto sobre el control DataWindow', () => {
        const expected = [
            'CanUndo',
            'Clear',
            'Copy',
            'Cut',
            'Paste',
            'ReplaceText',
            'SelectText',
            'Undo',
            'Position',
            'Scroll',
        ] as const;

        for (const name of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), ['datawindow']);

            assert.ok(symbol, `Expected DataWindow text method ${name}`);
            assert.strictEqual(symbol!.namespace, 'datawindow');
            assert.strictEqual(symbol!.category, 'Texto');
            assert.ok(symbol!.sourceUrl?.includes(`/dwmeth_${name}.html`));
        }

        assert.strictEqual(resolveSystemMemberFunctionForOwner('undo', ['datastore']), undefined);
    });

    test('MF-05H cubre puntero, selección y RichText del control DataWindow', () => {
        const expected = [
            ['FindNext', 'datawindow'],
            ['GetBandAtPointer', 'datawindowchild'],
            ['GetObjectAtPointer', 'datawindow'],
            ['PointerX', 'datawindow'],
            ['PointerY', 'datawindow'],
            ['SelectedLength', 'datawindow'],
            ['SelectedLine', 'datawindow'],
            ['SelectedStart', 'datawindow'],
            ['SelectedText', 'datawindow'],
            ['TextLine', 'datawindow'],
        ] as const;

        for (const [name, ownerType] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), [ownerType]);

            assert.ok(symbol, `Expected DataWindow pointer/selection method ${name} for ${ownerType}`);
            assert.strictEqual(symbol!.namespace, 'datawindow');
            assert.ok(symbol!.sourceUrl?.includes(`/dwmeth_${name}.html`));
        }

        assert.strictEqual(resolveSystemMemberFunctionForOwner('selectedtext', ['datastore']), undefined);
    });

    test('MF-05I cubre navegación visual y selección RichText en DataWindow', () => {
        const expected = [
            ['ScrollNextPage', 'datawindowchild'],
            ['ScrollNextRow', 'datawindow'],
            ['ScrollPriorPage', 'datawindowchild'],
            ['ScrollPriorRow', 'datawindow'],
            ['SetFocus', 'datawindow'],
            ['SetTabOrder', 'datawindowchild'],
            ['SetRowFocusIndicator', 'datawindow'],
            ['SelectTextAll', 'datawindow'],
            ['SelectTextLine', 'datawindow'],
            ['SelectTextWord', 'datawindow'],
        ] as const;

        for (const [name, ownerType] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), [ownerType]);

            assert.ok(symbol, `Expected DataWindow visual navigation method ${name} for ${ownerType}`);
            assert.strictEqual(symbol!.namespace, 'datawindow');
            assert.ok(symbol!.sourceUrl?.includes(`/dwmeth_${name}.html`));
        }

        assert.strictEqual(resolveSystemMemberFunctionForOwner('setfocus', ['datastore'])?.namespace, 'object');
    });

    test('MF-07A cubre runtime avanzado y graph curados de DataWindow', () => {
        const expected = [
            ['CollapseAll', 'datawindow', 'Navegación'],
            ['Create', 'datastore', 'Metadatos'],
            ['SetFullState', 'datastore', 'Transacciones'],
            ['SetText', 'datawindow', 'Texto'],
            ['CategoryCount', 'datawindow', 'Metadatos'],
            ['GetDataValue', 'datastore', 'Datos'],
            ['SetDataStyle', 'datawindow', 'Visual'],
            ['ObjectAtPointer', 'datawindow', 'Contexto'],
        ] as const;

        for (const [name, ownerType, category] of expected) {
            const symbol = resolveSystemMemberFunctionForOwner(name.toLowerCase(), [ownerType]);

            assert.ok(symbol, `Expected DataWindow curated method ${name} for ${ownerType}`);
            assert.strictEqual(symbol!.namespace, 'datawindow');
            assert.strictEqual(symbol!.category, category);
            assert.ok(symbol!.sourceUrl?.includes(`/dwmeth_${name}.html`));
        }

        assert.strictEqual(resolveSystemMemberFunctionForOwner('objectatpointer', ['datastore']), undefined);
    assert.strictEqual(resolveSystemMemberFunctionForOwner('settext', ['datastore'])?.namespace, 'datawindow');
    });

    test('el catálogo nuevo resuelve métodos integrados de objeto según el owner tipado', () => {
        const setFocus = resolveSystemMemberFunctionForOwner('setfocus', ['singlelineedit']);
        const postEvent = resolveSystemMemberFunctionForOwner('postevent', ['window']);
        const retrieve = resolveSystemMemberFunctionForOwner('retrieve', ['singlelineedit']);

        assert.ok(setFocus);
        assert.strictEqual(setFocus!.namespace, 'object');
        assert.ok(postEvent);
        assert.strictEqual(postEvent!.namespace, 'object');
        assert.strictEqual(retrieve, undefined);
    });

    test('MF-08A cubre system events curados de Window con owner-aware', () => {
        const activate = resolveSystemEventForOwner('activate', ['window']);
        const closeQuery = resolveSystemEventForOwner('closequery', ['window']);
        const hide = resolveSystemEventForOwner('hide', ['window']);
        const resize = resolveSystemEventForOwner('resize', ['window']);
        const unrelatedOwner = resolveSystemEventForOwner('closequery', ['singlelineedit']);

        assert.ok(activate);
        assert.strictEqual(activate!.category, 'Ciclo de vida');
        assert.ok(activate!.sourceUrl?.includes('Window_control.html'));
        assert.ok(closeQuery);
        assert.strictEqual(closeQuery!.category, 'Ciclo de vida');
        assert.ok(closeQuery!.summary.includes('Message.ReturnValue'));
        assert.ok(hide);
        assert.strictEqual(hide!.namespace, 'object');
        assert.ok(resize);
        assert.strictEqual(resize!.category, 'Sistema');
        assert.strictEqual(unrelatedOwner, undefined);
    });

    test('MF-08B cubre system events de interacción y drag sobre Window', () => {
        const expected = [
            ['DragDrop', 'Interacción'],
            ['DragEnter', 'Interacción'],
            ['DragLeave', 'Interacción'],
            ['DragWithin', 'Interacción'],
            ['Help', 'Interacción'],
            ['Key', 'Interacción'],
            ['MenuChanged', 'Sistema'],
            ['MouseDown', 'Interacción'],
            ['MouseMove', 'Interacción'],
            ['MouseUp', 'Interacción'],
        ] as const;

        for (const [name, category] of expected) {
            const symbol = resolveSystemEventForOwner(name.toLowerCase(), ['window']);

            assert.ok(symbol, `Expected system event ${name} for window`);
            assert.strictEqual(symbol!.namespace, 'object');
            assert.strictEqual(symbol!.category, category);
            assert.ok(symbol!.sourceUrl?.includes('Window_control.html'));
        }

        assert.ok(resolveSystemEventForOwner('key', ['window'])!.summary.includes('RichTextEdit'));
        assert.ok(resolveSystemEventForOwner('menuchanged', ['window'])!.summary.includes('ribbon bar'));
        assert.ok(resolveSystemEventForOwner('dragdrop', ['singlelineedit'])?.sourceUrl?.includes('dragDrop_event.html'));
        assert.ok(listSystemEvents().length >= 43);
    });

    test('MF-08C cubre system events residuales de Window con owner-aware', () => {
        const other = resolveSystemEventForOwner('other', ['window']);
        const rButtonDown = resolveSystemEventForOwner('rbuttondown', ['window']);
        const systemKey = resolveSystemEventForOwner('systemkey', ['window']);
        const toolbarMoved = resolveSystemEventForOwner('toolbarmoved', ['window']);

        assert.ok(other);
        assert.strictEqual(other!.category, 'Sistema');
        assert.ok(other!.summary.includes('Windows'));
        assert.ok(rButtonDown);
        assert.strictEqual(rButtonDown!.category, 'Interacción');
        assert.ok(systemKey);
        assert.ok(systemKey!.summary.includes('Alt'));
        assert.ok(toolbarMoved);
        assert.strictEqual(toolbarMoved!.category, 'Sistema');
        assert.ok(toolbarMoved!.summary.includes('FrameBar'));
        assert.strictEqual(resolveSystemEventForOwner('systemkey', ['singlelineedit']), undefined);
        assert.ok(listSystemEvents().length >= 43);
    });

    test('MF-08D cubre system events DDE obsoletos de Window', () => {
        const expected = [
            'HotLinkAlarm',
            'RemoteExec',
            'RemoteHotLinkStart',
            'RemoteHotLinkStop',
            'RemoteRequest',
            'RemoteSend',
        ];

        for (const name of expected) {
            const entry = resolveSystemEventForOwner(name, ['window']);
            assert.ok(entry, `${name} debería resolverse para window`);
            assert.strictEqual(entry!.category, 'Sistema');
            assert.strictEqual(entry!.namespace, 'object');
            assert.strictEqual(entry!.obsolete, true);
            assert.ok(entry!.obsoleteMessage?.includes('compatibilidad heredada'));
            assert.strictEqual(entry!.sourceUrl, 'https://docs.appeon.com/pb2025/objects_and_controls/Window_control.html');
        }

        assert.ok(resolveSystemEventForOwner('hotlinkalarm', ['window'])!.summary.includes('servidor DDE'));
        assert.ok(resolveSystemEventForOwner('remotehotlinkstart', ['window'])!.summary.includes('hot link'));
        assert.strictEqual(resolveSystemEventForOwner('remoteexec', ['singlelineedit']), undefined);
        assert.ok(listSystemEvents().length >= 43);
    });

    test('MF-08E cubre system events owner-aware de seleccion y clic derecho en controles', () => {
        const selectionChangedTree = resolveSystemEventForOwner('selectionchanged', ['treeview']);
        const selectionChangedTab = resolveSystemEventForOwner('selectionchanged', ['tab']);
        const selectionChangedListBox = resolveSystemEventForOwner('selectionchanged', ['listbox']);
        const selectionChangingTree = resolveSystemEventForOwner('selectionchanging', ['treeview']);
        const selectionChangingTab = resolveSystemEventForOwner('selectionchanging', ['tab']);
        const rightClickedListView = resolveSystemEventForOwner('rightclicked', ['listview']);
        const rightClickedTab = resolveSystemEventForOwner('rightclicked', ['tab']);
        const rightDoubleClickedTree = resolveSystemEventForOwner('rightdoubleclicked', ['treeview']);

        assert.ok(selectionChangedTree);
        assert.ok(selectionChangedTab);
        assert.ok(selectionChangedListBox);
        assert.strictEqual(selectionChangedListBox!.category, 'Interacción');
        assert.ok(selectionChangedTree!.summary.includes('selección'));
        assert.ok(selectionChangingTree);
        assert.ok(selectionChangingTree!.summary.includes('impedir'));
        assert.ok(selectionChangingTab);
        assert.strictEqual(resolveSystemEventForOwner('selectionchanging', ['listbox']), undefined);
        assert.ok(rightClickedListView);
        assert.ok(rightClickedTab);
        assert.ok(rightDoubleClickedTree);
        assert.strictEqual(rightClickedListView!.sourceUrl, 'https://docs.appeon.com/pb2025/objects_and_controls/TreeView_control.html');
        assert.strictEqual(resolveSystemEventForOwner('rightclicked', ['listbox']), undefined);
        assert.ok(listSystemEvents().length >= 43);
    });

    test('el catálogo nuevo separa métodos y eventos específicos de DataWindow', () => {
        const retrieve = resolveSystemMemberFunctionForOwner('retrieve', ['datawindow']);
        const setSort = resolveSystemMemberFunctionForOwner('setsort', ['datawindow']);
        const getItemDate = resolveSystemMemberFunctionForOwner('getitemdate', ['datawindowchild']);
        const getItemDateTime = resolveSystemMemberFunctionForOwner('getitemdatetime', ['datastore']);
        const getItemDecimal = resolveSystemMemberFunctionForOwner('getitemdecimal', ['datawindow']);
        const setItemStatus = resolveSystemMemberFunctionForOwner('setitemstatus', ['datawindow']);
        const unrelatedOwner = resolveSystemMemberFunctionForOwner('setitemstatus', ['singlelineedit']);
        const itemChanged = resolveSystemDataWindowEvent('itemchanged');
        const itemError = resolveSystemEventForOwner('itemerror', ['datawindow']);
        const contextualEvent = resolveSystemEventForOwner('itemchanged', ['datawindow']);

        assert.ok(retrieve);
        assert.strictEqual(retrieve!.namespace, 'datawindow');
        assert.ok(setSort);
        assert.strictEqual(setSort!.namespace, 'datawindow');
        assert.ok(getItemDate);
        assert.strictEqual(getItemDate!.namespace, 'datawindow');
        assert.ok(getItemDate!.sourceUrl?.includes('dwmeth_GetItemDate.html'));
        assert.ok(getItemDateTime);
        assert.strictEqual(getItemDateTime!.namespace, 'datawindow');
        assert.ok(getItemDateTime!.sourceUrl?.includes('dwmeth_GetItemDateTime.html'));
        assert.ok(getItemDecimal);
        assert.strictEqual(getItemDecimal!.namespace, 'datawindow');
        assert.ok(getItemDecimal!.sourceUrl?.includes('dwmeth_GetItemDecimal.html'));
        assert.ok(setItemStatus);
        assert.strictEqual(setItemStatus!.namespace, 'datawindow');
        assert.ok(setItemStatus!.sourceUrl?.includes('dwmeth_SetItemStatus.html'));
        assert.strictEqual(unrelatedOwner, undefined);
        assert.ok(itemChanged);
        assert.strictEqual(itemChanged!.namespace, 'datawindow');
        assert.ok(itemError);
        assert.strictEqual(itemError!.namespace, 'datawindow');
        assert.ok(contextualEvent);
        assert.strictEqual(contextualEvent!.namespace, 'datawindow');
        assert.ok(listSystemObjectFunctions().length >= 207);
        assert.ok(listSystemDataWindowFunctions().length >= 209);
        assert.ok(listSystemEvents().length >= 43);
        assert.ok(listSystemDataWindowEvents().length >= 12);
    });
});
