import type {
  ApiObjectExplorerProjectionNode,
  ApiObjectExplorerProjectionNodePath,
  ApiObjectExplorerProjectionPage,
} from '../shared/publicApi';

export interface ObjectExplorerLoadMoreNode {
  type: 'load-more';
  id: string;
  label: string;
  description?: string;
  tooltip?: string;
  parentId?: string;
  parentPath?: ApiObjectExplorerProjectionNodePath;
  cursor: string;
  pageSize: number;
}

export type ObjectExplorerProjectionTreeNode = ApiObjectExplorerProjectionNode | ObjectExplorerLoadMoreNode;

export function isObjectExplorerLoadMoreNode(
  node: unknown,
): node is ObjectExplorerLoadMoreNode {
  return Boolean(
    node
    && typeof node === 'object'
    && 'type' in node
    && (node as { type?: unknown }).type === 'load-more',
  );
}

export function appendObjectExplorerProjectionPage(
  existingNodes: readonly ObjectExplorerProjectionTreeNode[],
  page: ApiObjectExplorerProjectionPage,
): ObjectExplorerProjectionTreeNode[] {
  const merged: ObjectExplorerProjectionTreeNode[] = existingNodes.filter((node) => !isObjectExplorerLoadMoreNode(node));
  merged.push(...page.nodes);

  if (page.projection.pageInfo?.hasMore && page.projection.pageInfo.nextCursor) {
    merged.push({
      type: 'load-more',
      id: `load-more:${page.parentId ?? 'root'}:${page.projection.pageInfo.nextCursor}`,
      label: 'Cargar más',
      description: `Página ${page.projection.pageInfo.page ?? 1}`,
      tooltip: 'Solicitar la siguiente página de Object Explorer.',
      ...(page.parentId ? { parentId: page.parentId } : {}),
      ...(page.parentPath ? { parentPath: { ...page.parentPath } } : {}),
      cursor: page.projection.pageInfo.nextCursor,
      pageSize: page.projection.pageInfo.pageSize ?? page.nodes.length,
    });
  }

  return merged;
}