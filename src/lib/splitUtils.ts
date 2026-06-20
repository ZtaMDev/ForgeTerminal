import type { SplitNode } from "@/types/terminal";

export function findNodeParent(root: SplitNode, targetId: string): SplitNode | null {
  if (root.type === "terminal") return null;
  if (root.children.some(c => c.id === targetId || (c.type === "terminal" && c.sessionId === targetId))) {
    return root;
  }
  for (const child of root.children) {
    const p = findNodeParent(child, targetId);
    if (p) return p;
  }
  return null;
}

export function findNode(root: SplitNode, targetId: string): SplitNode | null {
  if (root.id === targetId || (root.type === "terminal" && root.sessionId === targetId)) return root;
  if (root.type === "split") {
    for (const child of root.children) {
      const found = findNode(child, targetId);
      if (found) return found;
    }
  }
  return null;
}

export function replaceNode(root: SplitNode, targetId: string, newNode: SplitNode): SplitNode {
  if (root.id === targetId || (root.type === "terminal" && root.sessionId === targetId)) {
    return newNode;
  }
  if (root.type === "split") {
    return {
      ...root,
      children: root.children.map(c => replaceNode(c, targetId, newNode))
    };
  }
  return root;
}

export function removeNode(root: SplitNode, targetId: string): SplitNode | null {
  if (root.id === targetId || (root.type === "terminal" && root.sessionId === targetId)) {
    return null; // indicates root itself is removed
  }
  if (root.type === "split") {
    const removedIndex = root.children.findIndex(c => findNode(c, targetId) !== null);
    
    const newChildren = root.children
      .map(c => removeNode(c, targetId))
      .filter((c): c is SplitNode => c !== null);
    
    if (newChildren.length === 0) return null;
    if (newChildren.length === 1) return newChildren[0]; // collapse
    
    let newSizes = root.sizes;
    if (root.sizes && removedIndex !== -1 && newChildren.length < root.children.length) {
       const removedSize = root.sizes[removedIndex];
       newSizes = root.sizes.filter((_, i) => i !== removedIndex).map(s => s + (removedSize / newChildren.length));
    }

    return {
      ...root,
      children: newChildren,
      sizes: newSizes
    };
  }
  return root;
}

export function splitNodeAt(root: SplitNode, targetId: string, newSessionId: string, direction: "horizontal" | "vertical"): SplitNode {
  const target = findNode(root, targetId);
  if (!target) return root;

  const newId = crypto.randomUUID();
  const newNode: SplitNode = {
    type: "split",
    id: newId,
    direction,
    children: [
      target,
      { type: "terminal", id: crypto.randomUUID(), sessionId: newSessionId }
    ],
    sizes: [50, 50]
  };

  return replaceNode(root, targetId, newNode);
}

export function getSessions(root: SplitNode): string[] {
  if (root.type === "terminal") {
    return [root.sessionId];
  }
  return root.children.flatMap(getSessions);
}
