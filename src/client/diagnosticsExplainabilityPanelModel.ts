export interface DiagnosticsExplainabilityLocationTarget {
  uri: string;
  line?: number;
  character?: number;
}

export interface ExplainableDiagnosticInput {
  uri: string;
  message: string;
  code?: string;
  severity?: 'error' | 'warning' | 'info' | 'hint';
  line: number;
  character: number;
  source?: string;
}

export interface DiagnosticsExplainabilityPanelSectionNode {
  type: 'section';
  id: string;
  label: string;
  description?: string;
  tooltip?: string;
  children: DiagnosticsExplainabilityPanelNode[];
}

export interface DiagnosticsExplainabilityPanelItemNode {
  type: 'item';
  id: string;
  label: string;
  description?: string;
  tooltip?: string;
  target?: DiagnosticsExplainabilityLocationTarget;
}

export type DiagnosticsExplainabilityPanelNode = DiagnosticsExplainabilityPanelSectionNode | DiagnosticsExplainabilityPanelItemNode;

export interface DiagnosticsExplainabilityPanelModel {
  message?: string;
  roots: DiagnosticsExplainabilityPanelNode[];
  focusNodeId?: string;
}

interface ExplainabilityDescriptor {
  title: string;
  why: string;
  nextSteps: string[];
}

function createItem(
  id: string,
  label: string,
  description?: string,
  tooltip?: string,
  target?: DiagnosticsExplainabilityLocationTarget,
): DiagnosticsExplainabilityPanelItemNode {
  return {
    type: 'item',
    id,
    label,
    ...(description ? { description } : {}),
    ...(tooltip ? { tooltip } : {}),
    ...(target ? { target } : {}),
  };
}

function createSection(
  id: string,
  label: string,
  children: DiagnosticsExplainabilityPanelNode[],
  description?: string,
  tooltip?: string,
): DiagnosticsExplainabilityPanelSectionNode {
  return {
    type: 'section',
    id,
    label,
    ...(description ? { description } : {}),
    ...(tooltip ? { tooltip } : {}),
    children,
  };
}

function explainDiagnostic(code: string | undefined): ExplainabilityDescriptor {
  switch ((code ?? '').toUpperCase()) {
    case 'SD2':
      return {
        title: 'Callable no resuelto',
        why: 'El motor no reunió evidencia suficiente para ligar la llamada a un símbolo único y defendible.',
        nextSteps: ['Revisa owner/base type del objeto activo.', 'Comprueba nombres, overloads y alcance visible.'],
      };
    case 'SD4':
    case 'SD5':
      return {
        title: 'Variable declarada pero no usada',
        why: 'La variable quedó publicada en el snapshot semántico sin lecturas posteriores defendibles.',
        nextSteps: ['Elimina la variable si quedó obsoleta.', 'Si la usarás después, comprueba que la referencia no quede en código muerto.'],
      };
    case 'SD6':
      return {
        title: 'Shadowing de símbolo',
        why: 'Una declaración local oculta otra previa y puede cambiar el winner semántico esperado.',
        nextSteps: ['Renombra la variable más cercana.', 'Verifica qué símbolo debería resolver realmente el código.'],
      };
    case 'SD7':
      return {
        title: 'API obsoleta',
        why: 'La llamada apunta a una función marcada como obsoleta en el catálogo soportado.',
        nextSteps: ['Sustituye la API por su alternativa vigente.', 'Comprueba quick-fix o documentación del runtime.'],
      };
    case 'SD8':
      return {
        title: 'Declaración duplicada',
        why: 'El mismo identificador aparece más de una vez en un scope incompatible.',
        nextSteps: ['Unifica la declaración.', 'Elimina o renombra la variante redundante.'],
      };
    case 'SD9':
    case 'SD10':
    case 'SD11':
    case 'SD12':
    case 'SD13':
      return {
        title: 'Problema estructural de control de flujo',
        why: 'La forma del bloque o del retorno no respeta el contrato estructural esperado por el parser/semantic pass.',
        nextSteps: ['Revisa delimitadores y ramas de control.', 'Comprueba retornos exigidos por la firma declarada.'],
      };
    case 'DATAOBJECT-NOT-FOUND':
    case 'DATAOBJECT-AMBIGUOUS':
    case 'DATAOBJECT-DYNAMIC':
    case 'RETRIEVE-ARITY-MISMATCH':
      return {
        title: 'Binding DataWindow incompleto',
        why: 'El bridge DataWindow no pudo demostrar de forma única el DataObject o sus argumentos asociados.',
        nextSteps: ['Comprueba el literal DataObject.', 'Revisa aridad y nombres de argumentos de Retrieve().'],
      };
    case 'TRANSACTION-BINDING-MISSING':
    case 'TRANSACTION-BINDING-UNKNOWN':
    case 'TRANSACTION-BINDING-DYNAMIC':
      return {
        title: 'Binding transaccional no defendible',
        why: 'La operación DataWindow/DB no dejó un binding transaccional verificable en el contexto actual.',
        nextSteps: ['Verifica SetTransObject/SetTrans antes de Retrieve/Update.', 'Reduce dinamismo si necesitas navegación o diagnostics más fuertes.'],
      };
    case 'NATIVE-DEPENDENCY':
      return {
        title: 'Dependencia nativa/externa',
        why: 'La resolución depende de runtime nativo o superficie externa no modelada completamente por el plugin.',
        nextSteps: ['Comprueba firmas externas y librerías nativas.', 'Espera degradación honesta si el runtime no es observable.'],
      };
    default:
      return {
        title: 'Diagnostic explicado de forma genérica',
        why: 'El código no tiene una ficha dedicada aún, pero el panel sigue mostrando contexto, localización y siguiente paso defendible.',
        nextSteps: ['Revisa el mensaje y la ubicación exacta.', 'Contrasta el código con el contexto activo y las reglas del proyecto.'],
      };
  }
}

export function buildDiagnosticsExplainabilityPanelModel(diagnostics: readonly ExplainableDiagnosticInput[]): DiagnosticsExplainabilityPanelModel {
  if (diagnostics.length === 0) {
    return {
      message: 'No hay diagnostics publicados para el archivo activo.',
      roots: [],
    };
  }

  const roots = diagnostics.map((diagnostic, index) => {
    const explanation = explainDiagnostic(diagnostic.code);
    const locationTarget = {
      uri: diagnostic.uri,
      line: diagnostic.line,
      character: diagnostic.character,
    };

    return createSection(
      `diagnostic:${index}`,
      diagnostic.message,
      [
        createItem(`diagnostic:${index}:code`, 'Code', diagnostic.code ?? 'sin código', explanation.title, locationTarget),
        createItem(`diagnostic:${index}:severity`, 'Severity', diagnostic.severity ?? 'unknown', diagnostic.source, locationTarget),
        createItem(`diagnostic:${index}:why`, 'Why', explanation.why, explanation.why, locationTarget),
        createSection(
          `diagnostic:${index}:next-steps`,
          'Next steps',
          explanation.nextSteps.map((step, stepIndex) => createItem(`diagnostic:${index}:next-step:${stepIndex}`, step)),
          `${explanation.nextSteps.length}`,
        ),
        createItem(
          `diagnostic:${index}:location`,
          'Location',
          `${diagnostic.line + 1}:${diagnostic.character + 1}`,
          `${diagnostic.uri}:${diagnostic.line + 1}:${diagnostic.character + 1}`,
          locationTarget,
        ),
      ],
      [diagnostic.code, diagnostic.severity].filter((part): part is string => Boolean(part)).join(' · '),
      explanation.title,
    );
  });

  return {
    message: `${diagnostics.length} diagnostic(s) explicables en el archivo activo.`,
    roots,
    focusNodeId: roots[0]?.id,
  };
}

export function findDiagnosticsExplainabilityNodeById(
  roots: readonly DiagnosticsExplainabilityPanelNode[],
  nodeId: string | undefined,
): DiagnosticsExplainabilityPanelNode | undefined {
  if (!nodeId) {
    return undefined;
  }

  const queue = [...roots];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    if (current.id === nodeId) {
      return current;
    }
    if (current.type === 'section') {
      queue.push(...current.children);
    }
  }

  return undefined;
}