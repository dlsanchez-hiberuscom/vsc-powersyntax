// @ts-nocheck
export function buildInteractiveServingCacheKey(descriptor) {
  return `uri:${descriptor.uri}|doc:${descriptor.documentVersion}`;
}