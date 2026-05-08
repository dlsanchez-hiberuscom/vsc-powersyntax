// @ts-nocheck
import { resolveTargetEntityDetailed } from '../../../../../src/server/knowledge/resolution/semanticQueryService';

export function provideHover(kb) {
  return kb.publishedState ?? resolveTargetEntityDetailed;
}