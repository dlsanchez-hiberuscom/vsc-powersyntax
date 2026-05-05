import { buildCompactPayloadPolicy, type AiContextViewModel, type PresentationBlockViewModel } from './viewModels';

export function buildAiContextViewModel(input: {
  title: string;
  sourceOrigin?: AiContextViewModel['sourceOrigin'];
  confidence?: AiContextViewModel['confidence'];
  sections: Array<{
    title: string;
    blocks: PresentationBlockViewModel[];
  }>;
}): AiContextViewModel {
  return {
    feature: 'ai-context',
    title: input.title,
    ...(input.sourceOrigin ? { sourceOrigin: input.sourceOrigin } : {}),
    ...(input.confidence ? { confidence: input.confidence } : {}),
    sections: input.sections.map((section) => ({
      title: section.title,
      blocks: section.blocks.map((block) => ({ kind: block.kind, lines: [...block.lines] })),
    })),
    payloadPolicy: buildCompactPayloadPolicy('ai-context', 32 * 1024),
  };
}

export function formatAiContextViewModel(viewModel: AiContextViewModel): Record<string, unknown> {
  return {
    title: viewModel.title,
    sourceOrigin: viewModel.sourceOrigin ?? 'unknown',
    confidence: viewModel.confidence ?? 'unknown',
    sections: viewModel.sections.map((section) => ({
      title: section.title,
      blocks: section.blocks,
    })),
  };
}