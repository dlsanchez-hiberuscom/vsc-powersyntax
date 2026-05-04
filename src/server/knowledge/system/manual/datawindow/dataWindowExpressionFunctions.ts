import { PbSystemSymbolEntry } from '../../types';
import { dataWindowExpressionFunction } from '../common';

export const PB_MANUAL_CORE_DATAWINDOW_EXPRESSION_FUNCTION_CATEGORIES = [
    'Agregación',
    'Contexto',
    'Fecha y hora',
    'Matemáticas',
    'Texto',
    'Visual',
] as const;

type DataWindowExpressionFunctionCategory = (typeof PB_MANUAL_CORE_DATAWINDOW_EXPRESSION_FUNCTION_CATEGORIES)[number];

type DataWindowExpressionFunctionDescriptor = {
    name: string;
    sourceUrl: string;
};

const DATAWINDOW_EXPRESSION_APPLIES_TO = ['DataWindow expressions'] as const;

const AGGREGATION_FUNCTION_NAMES = new Set([
    'Avg',
    'Count',
    'CrosstabAvg',
    'CrosstabAvgDec',
    'CrosstabCount',
    'CrosstabMax',
    'CrosstabMaxDec',
    'CrosstabMin',
    'CrosstabMinDec',
    'CrosstabSum',
    'CrosstabSumDec',
    'CumulativePercent',
    'CumulativeSum',
    'First',
    'Large',
    'Last',
    'Max',
    'Median',
    'Min',
    'Mode',
    'Percent',
    'Small',
    'StDev',
    'StDevP',
    'Sum',
    'Var',
    'VarP',
]);

const CONTEXT_FUNCTION_NAMES = new Set([
    'Case',
    'CurrentRow',
    'Describe',
    'GetRow',
    'If',
    'IsDate',
    'IsExpanded',
    'IsNull',
    'IsNumber',
    'IsRowModified',
    'IsRowNew',
    'IsSelected',
    'IsTime',
    'Page',
    'PageAbs',
    'PageAcross',
    'PageCount',
    'PageCountAcross',
    'ProfileInt',
    'ProfileString',
    'RowCount',
    'RowHeight',
]);

const DATE_TIME_FUNCTION_NAMES = new Set([
    'Date',
    'DateTime',
    'Day',
    'DayName',
    'DayNumber',
    'DaysAfter',
    'Hour',
    'Minute',
    'Month',
    'Now',
    'RelativeDate',
    'RelativeTime',
    'Second',
    'SecondsAfter',
    'Time',
    'Today',
    'Year',
]);

const MATHEMATICAL_FUNCTION_NAMES = new Set([
    'Abs',
    'ACos',
    'ASin',
    'ATan',
    'Ceiling',
    'Cos',
    'Dec',
    'Exp',
    'Fact',
    'Int',
    'Integer',
    'Log',
    'LogTen',
    'Long',
    'Mod',
    'Number',
    'Pi',
    'Rand',
    'Real',
    'Round',
    'Sign',
    'Sin',
    'Sqrt',
    'Tan',
    'Truncate',
]);

const TEXT_FUNCTION_NAMES = new Set([
    'Asc',
    'AscA',
    'Char',
    'CharA',
    'Fill',
    'FillA',
    'GetText',
    'Left',
    'LeftA',
    'LastPos',
    'LeftTrim',
    'Len',
    'LenA',
    'LookUpDisplay',
    'Lower',
    'Match',
    'Mid',
    'MidA',
    'Pos',
    'PosA',
    'Replace',
    'ReplaceA',
    'RichText',
    'RichTextFile',
    'Right',
    'RightA',
    'RightTrim',
    'Space',
    'String',
    'StripRTF',
    'Trim',
    'Upper',
    'WordCap',
]);

const VISUAL_FUNCTION_NAMES = new Set([
    'Bitmap',
    'FontHeight',
    'GetPaintDC',
    'GetPaintRectHeight',
    'GetPaintRectWidth',
    'GetPaintRectX',
    'GetPaintRectY',
    'Paint',
    'RGB',
]);

const SPECIAL_SUMMARIES = new Map<string, string>([
    ['CurrentRow', 'Devuelve la fila actual evaluada por la expresión DataWindow.'],
    ['Describe', 'Recupera una propiedad Describe/Modify desde una expresión DataWindow.'],
    ['GetRow', 'Devuelve la fila asociada al contexto actual de evaluación de la expresión DataWindow.'],
    ['GetText', 'Devuelve el texto activo del contexto de pintura en una expresión DataWindow.'],
    ['If', 'Evalúa una condición y devuelve uno de dos valores dentro de una expresión DataWindow.'],
    ['LookUpDisplay', 'Devuelve el valor mostrado por un DropDownDataWindow dentro de una expresión DataWindow.'],
    ['PageCount', 'Devuelve el número total de páginas generado por el DataWindow.'],
    ['RowCount', 'Devuelve el número de filas visibles para la evaluación actual de la expresión DataWindow.'],
    ['Sum', 'Agrega valores de una expresión o columna sobre el conjunto de filas del DataWindow.'],
]);

const SPECIAL_SIGNATURES = new Map<string, string>([
    ['Avg', 'Avg(expression)'],
    ['Count', 'Count(expression)'],
    ['CurrentRow', 'CurrentRow()'],
    ['Describe', 'Describe(property)'],
    ['GetRow', 'GetRow()'],
    ['If', 'If(condition, truevalue, falsevalue)'],
    ['Now', 'Now()'],
    ['Page', 'Page()'],
    ['PageAbs', 'PageAbs()'],
    ['PageAcross', 'PageAcross()'],
    ['PageCount', 'PageCount()'],
    ['PageCountAcross', 'PageCountAcross()'],
    ['RowCount', 'RowCount()'],
    ['Sum', 'Sum(expression)'],
    ['Today', 'Today()'],
]);

function categorizeDataWindowExpressionFunction(
    name: string,
): DataWindowExpressionFunctionCategory {
    if (AGGREGATION_FUNCTION_NAMES.has(name)) {
        return 'Agregación';
    }

    if (CONTEXT_FUNCTION_NAMES.has(name)) {
        return 'Contexto';
    }

    if (DATE_TIME_FUNCTION_NAMES.has(name)) {
        return 'Fecha y hora';
    }

    if (MATHEMATICAL_FUNCTION_NAMES.has(name)) {
        return 'Matemáticas';
    }

    if (TEXT_FUNCTION_NAMES.has(name)) {
        return 'Texto';
    }

    if (VISUAL_FUNCTION_NAMES.has(name)) {
        return 'Visual';
    }

    throw new Error(`Unclassified DataWindow expression function: ${name}`);
}

function buildDataWindowExpressionFunctionSummary(
    name: string,
    category: DataWindowExpressionFunctionCategory,
): string {
    const specialSummary = SPECIAL_SUMMARIES.get(name);
    if (specialSummary) {
        return specialSummary;
    }

    switch (category) {
        case 'Agregación':
            return 'Función oficial de agregación disponible en expresiones DataWindow.';
        case 'Contexto':
            return 'Función oficial de contexto o estado disponible en expresiones DataWindow.';
        case 'Fecha y hora':
            return 'Función oficial de fecha y hora disponible en expresiones DataWindow.';
        case 'Matemáticas':
            return 'Función oficial numérica disponible en expresiones DataWindow.';
        case 'Texto':
            return 'Función oficial de texto disponible en expresiones DataWindow.';
        case 'Visual':
            return 'Función oficial visual o de layout disponible en expresiones DataWindow.';
    }
}

function buildDataWindowExpressionFunctionSignature(name: string): string {
    return SPECIAL_SIGNATURES.get(name) ?? `${name}(...)`;
}

function defineDataWindowExpressionFunctionEntries(
    descriptors: readonly DataWindowExpressionFunctionDescriptor[],
): readonly PbSystemSymbolEntry[] {
    return descriptors.map(descriptor => {
        const category = categorizeDataWindowExpressionFunction(descriptor.name);

        return dataWindowExpressionFunction({
            name: descriptor.name,
            category,
            summary: buildDataWindowExpressionFunctionSummary(descriptor.name, category),
            signatures: [{ label: buildDataWindowExpressionFunctionSignature(descriptor.name) }],
            appliesTo: DATAWINDOW_EXPRESSION_APPLIES_TO,
            sourceUrl: descriptor.sourceUrl,
        });
    });
}

export const PB_MANUAL_CORE_DATAWINDOW_EXPRESSION_FUNCTIONS = defineDataWindowExpressionFunctionEntries([
    { name: 'Abs', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/Abs.html' },
    { name: 'ACos', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_10348_ACos.html' },
    { name: 'Asc', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_69379_Asc.html' },
    { name: 'AscA', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_45467_AscA.html' },
    { name: 'ASin', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_98088_ASin.html' },
    { name: 'ATan', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_63653_ATan.html' },
    { name: 'Avg', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_39005_Avg.html' },
    { name: 'Bitmap', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/ch02s04s08.html' },
    { name: 'Case', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_71588_Case.html' },
    { name: 'Ceiling', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_99772_Ceiling.html' },
    { name: 'Char', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_62969_Char.html' },
    { name: 'CharA', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_35919_CharA.html' },
    { name: 'Cos', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_98768_Cos.html' },
    { name: 'Count', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_23922_Count.html' },
    { name: 'CrosstabAvg', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_67474_CrosstabAvg.html' },
    { name: 'CrosstabAvgDec', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_36780_CrosstabAvgDec.html' },
    { name: 'CrosstabCount', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_22059_CrosstabCount.html' },
    { name: 'CrosstabMax', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_53422_CrosstabMax.html' },
    { name: 'CrosstabMaxDec', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_19520_CrosstabMaxDec.html' },
    { name: 'CrosstabMin', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_15877_CrosstabMin.html' },
    { name: 'CrosstabMinDec', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_12015_CrosstabMinDec.html' },
    { name: 'CrosstabSum', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_37474_CrosstabSum.html' },
    { name: 'CrosstabSumDec', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_20757_CrosstabSumDec.html' },
    { name: 'CumulativePercent', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_53359_CumulativePercent.html' },
    { name: 'CumulativeSum', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_40258_CumulativeSum.html' },
    { name: 'CurrentRow', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_10412_CurrentRow.html' },
    { name: 'Date', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_18213_Date.html' },
    { name: 'DateTime', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/DateTime.html' },
    { name: 'Day', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_62119_Day.html' },
    { name: 'DayName', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_48207_DayName.html' },
    { name: 'DayNumber', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_91748_DayNumber.html' },
    { name: 'DaysAfter', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_86584_DaysAfter.html' },
    { name: 'Dec', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_10498_Dec.html' },
    { name: 'Describe', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/ch02s04s34.html' },
    { name: 'Exp', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_33439_Exp.html' },
    { name: 'Fact', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/Fact.html' },
    { name: 'Fill', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_94021_Fill.html' },
    { name: 'FillA', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_15258_FillA.html' },
    { name: 'First', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_30468_First.html' },
    { name: 'FontHeight', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/FontHeight.html' },
    { name: 'GetPaintDC', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_37888_GetPaintDC.html' },
    { name: 'GetPaintRectHeight', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_63405_GetPaintRectHeight.html' },
    { name: 'GetPaintRectWidth', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_35425_GetPaintRectWidth.html' },
    { name: 'GetPaintRectX', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_79136_GetPaintRectX.html' },
    { name: 'GetPaintRectY', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_92139_GetPaintRectY.html' },
    { name: 'GetRow', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_71632_GetRow.html' },
    { name: 'GetText', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/GetText_dw_expression_func.html' },
    { name: 'Hour', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_35268_Hour.html' },
    { name: 'If', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_23386_If.html' },
    { name: 'Int', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_20471_Int.html' },
    { name: 'Integer', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_26344_Integer.html' },
    { name: 'IsDate', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_23032_IsDate.html' },
    { name: 'IsExpanded', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/ch02s04s53.html' },
    { name: 'IsNull', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/IsNull.html' },
    { name: 'IsNumber', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_63182_IsNumber.html' },
    { name: 'IsRowModified', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/ch02s04s56.html' },
    { name: 'IsRowNew', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/ch02s04s57.html' },
    { name: 'IsSelected', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/ch02s04s58.html' },
    { name: 'IsTime', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/IsTime.html' },
    { name: 'Large', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_46521_Large.html' },
    { name: 'Last', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_50638_Last.html' },
    { name: 'LastPos', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_60788_LastPos.html' },
    { name: 'Left', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_92283_Left.html' },
    { name: 'LeftA', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_96672_LeftA.html' },
    { name: 'LeftTrim', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_54083_LeftTrim.html' },
    { name: 'Len', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_51602_Len.html' },
    { name: 'LenA', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_66197_LenA.html' },
    { name: 'Log', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_25742_Log.html' },
    { name: 'LogTen', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_98860_LogTen.html' },
    { name: 'Long', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/Long.html' },
    { name: 'LookUpDisplay', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/LookUpDisplay.html' },
    { name: 'Lower', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_53411_Lower.html' },
    { name: 'Match', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/Match.html' },
    { name: 'Max', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_40350_Max.html' },
    { name: 'Median', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_26630_Median.html' },
    { name: 'Mid', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_16481_Mid.html' },
    { name: 'MidA', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_80320_MidA.html' },
    { name: 'Min', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_29937_Min.html' },
    { name: 'Minute', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_97047_Minute.html' },
    { name: 'Mod', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/Mod.html' },
    { name: 'Mode', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_46520_Mode.html' },
    { name: 'Month', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_29076_Month.html' },
    { name: 'Now', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_53249_Now.html' },
    { name: 'Number', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/ch02s04s84.html' },
    { name: 'Page', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_68807_Page.html' },
    { name: 'PageAbs', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_84249_PageAbs.html' },
    { name: 'PageAcross', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_13217_PageAcross.html' },
    { name: 'PageCount', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_63061_PageCount.html' },
    { name: 'PageCountAcross', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_31262_PageCountAcross.html' },
    { name: 'Paint', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_46302_Paint.html' },
    { name: 'Percent', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_39686_Percent.html' },
    { name: 'Pi', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_79672_Pi.html' },
    { name: 'Pos', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_76830_Pos.html' },
    { name: 'PosA', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_90747_PosA.html' },
    { name: 'ProfileInt', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_14093_ProfileInt.html' },
    { name: 'ProfileString', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_20809_ProfileString.html' },
    { name: 'Rand', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/ch02s04s97.html' },
    { name: 'Real', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/Real.html' },
    { name: 'RelativeDate', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/RelativeDate.html' },
    { name: 'RelativeTime', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/RelativeTime.html' },
    { name: 'Replace', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_34524_Replace.html' },
    { name: 'ReplaceA', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_45605_ReplaceA.html' },
    { name: 'RGB', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/RGB.html' },
    { name: 'RichText', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/ch02s04s104.html' },
    { name: 'RichTextFile', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/ch02s04s105.html' },
    { name: 'Right', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_70791_Right.html' },
    { name: 'RightA', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_13542_RightA.html' },
    { name: 'RightTrim', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_41914_RightTrim.html' },
    { name: 'Round', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_37204_Round.html' },
    { name: 'RowCount', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/RowCount.html' },
    { name: 'RowHeight', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/RowHeight.html' },
    { name: 'Second', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_23905_Second.html' },
    { name: 'SecondsAfter', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_16416_SecondsAfter.html' },
    { name: 'Sign', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/Sign.html' },
    { name: 'Sin', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_93770_Sin.html' },
    { name: 'Small', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_57411_Small.html' },
    { name: 'Space', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_39797_Space.html' },
    { name: 'Sqrt', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/Sqrt.html' },
    { name: 'StDev', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_66307_StDev.html' },
    { name: 'StDevP', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_89303_StDevP.html' },
    { name: 'String', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_70616_String.html' },
    { name: 'StripRTF', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/ch02s04s122.html' },
    { name: 'Sum', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/ch02s04s123.html' },
    { name: 'Tan', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_45298_Tan.html' },
    { name: 'Time', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_60436_Time.html' },
    { name: 'Today', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/Today.html' },
    { name: 'Trim', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_69510_Trim.html' },
    { name: 'Truncate', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_34776_Truncate.html' },
    { name: 'Upper', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_88745_Upper.html' },
    { name: 'Var', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_31507_Var.html' },
    { name: 'VarP', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_72684_VarP.html' },
    { name: 'WordCap', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_16642_WordCap.html' },
    { name: 'Year', sourceUrl: 'https://docs.appeon.com/pb2025/datawindow_reference/XREF_54782_Year.html' },
]);