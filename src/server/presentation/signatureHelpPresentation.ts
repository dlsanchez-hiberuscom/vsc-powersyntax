import { SignatureHelp } from 'vscode-languageserver/node';

import { buildCompactPayloadPolicy, type SignatureHelpViewModelSource, type SymbolSignatureViewModel } from './viewModels';

export function buildSymbolSignatureViewModel(input: {
  signatures: SymbolSignatureViewModel['signatures'];
  activeSignature?: number;
  activeParameter: number;
  source: SignatureHelpViewModelSource;
  reason: string;
  locale?: SymbolSignatureViewModel['locale'];
  resolvedCallable?: SymbolSignatureViewModel['resolvedCallable'];
}): SymbolSignatureViewModel {
  return {
    feature: 'signatureHelp',
    signatures: input.signatures,
    activeSignature: input.activeSignature ?? 0,
    activeParameter: input.activeParameter,
    source: input.source,
    reason: input.reason,
    ...(input.locale ? { locale: input.locale } : {}),
    ...(input.resolvedCallable ? { resolvedCallable: input.resolvedCallable } : {}),
    payloadPolicy: buildCompactPayloadPolicy('signatureHelp', 12 * 1024),
  };
}

export function formatSymbolSignatureViewModel(viewModel: SymbolSignatureViewModel): SignatureHelp {
  return {
    signatures: viewModel.signatures,
    activeSignature: viewModel.activeSignature,
    activeParameter: viewModel.activeParameter,
  };
}