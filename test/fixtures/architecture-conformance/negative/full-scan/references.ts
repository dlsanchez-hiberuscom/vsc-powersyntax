// @ts-nocheck
import { createSemanticQueryFacade } from '../../../../../src/server/features/semanticQueryFacade';

export function provideReferences(kb) {
  const facade = createSemanticQueryFacade;
  return kb.findAllDefinitions('w_main') ?? facade;
}