/**
 * Hash Array Mapped Trie (HAMT) node implementation
 *
 * This provides more efficient structural sharing by using
 * bit-mapped indexing to create sparse arrays.
 */

// Bit manipulation constants
const BITS_PER_LEVEL = 5;
const BRANCH_SIZE = 1 << BITS_PER_LEVEL; // 32
// Mask for extracting the position within a level
export const MASK = BRANCH_SIZE - 1; // 0x1F

/**
 * HAMT Node interface
 */
export interface HAMTNode<T> {
  // Bitmap indicating which slots are filled
  readonly bitmap: number;

  // Array of child nodes or values (sparse)
  readonly children: ReadonlyArray<T | HAMTNode<T>>;

  // Total size of the subtree
  readonly size: number;
}

/**
 * Create a new HAMT node
 */
export function createNode<T>(
  bitmap: number,
  children: ReadonlyArray<T | HAMTNode<T>>,
  size: number
): HAMTNode<T> {
  return { bitmap, children, size };
}

/**
 * Get the index in the sparse array for a given position
 */
export function getIndex(bitmap: number, position: number): number {
  // Count the number of bits set in the bitmap before the position
  const mask = (1 << position) - 1;
  return countBits(bitmap & mask);
}

/**
 * Count the number of bits set in a number (population count)
 */
export function countBits(n: number): number {
  // Brian Kernighan's algorithm
  let count = 0;
  while (n) {
    n &= n - 1;
    count++;
  }
  return count;
}

/**
 * Check if a position is present in the bitmap
 */
export function hasPosition(bitmap: number, position: number): boolean {
  return (bitmap & (1 << position)) !== 0;
}

/**
 * Set a position in the bitmap
 */
export function setBit(bitmap: number, position: number): number {
  return bitmap | (1 << position);
}

/**
 * Clear a position in the bitmap
 */
export function clearBit(bitmap: number, position: number): number {
  return bitmap & ~(1 << position);
}

/**
 * Get the child at a given position
 */
export function getChild<T>(node: HAMTNode<T>, position: number): T | HAMTNode<T> | undefined {
  if (!hasPosition(node.bitmap, position)) {
    return undefined;
  }

  const index = getIndex(node.bitmap, position);
  return node.children[index];
}

/**
 * Set a child at a given position
 */
export function setChild<T>(
  node: HAMTNode<T>,
  position: number,
  child: T | HAMTNode<T>,
  childSize: number = 1
): HAMTNode<T> {
  const bitmap = setBit(node.bitmap, position);
  const index = getIndex(bitmap, position);

  // Create a new children array with the child inserted
  const children = [...node.children];

  if (hasPosition(node.bitmap, position)) {
    // Replace existing child
    children[index] = child;
    return createNode(bitmap, children, node.size);
  } else {
    // Insert new child
    children.splice(index, 0, child);
    return createNode(bitmap, children, node.size + childSize);
  }
}

/**
 * Remove a child at a given position
 */
export function removeChild<T>(
  node: HAMTNode<T>,
  position: number,
  childSize: number = 1
): HAMTNode<T> {
  if (!hasPosition(node.bitmap, position)) {
    return node;
  }

  const index = getIndex(node.bitmap, position);
  const bitmap = clearBit(node.bitmap, position);

  // Create a new children array with the child removed
  const children = [...node.children];
  children.splice(index, 1);

  return createNode(bitmap, children, node.size - childSize);
}
