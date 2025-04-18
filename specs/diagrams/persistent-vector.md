# Persistent Vector Architecture

## Trie Structure

```
                  Root Node
                 /    |    \
                /     |     \
               /      |      \
          Node 1    Node 2   Node 3
         / | | \    / | \    / | \
        /  | |  \  /  |  \  /  |  \
      L1  L2 L3 L4 L5 L6 L7 L8 L9 L10
```

## Path Copying for Modifications

```
    Original Trie                 Modified Trie (after set(7, X))
        Root                           New Root
       /  |  \                         /  |  \
      /   |   \                       /   |   \
   Node1 Node2 Node3               Node1 New2 Node3
   / | \  / | \  / | \             / | \  / | \  / | \
  A  B C  D E F  G H I            A  B C  D E F  X H I
                                          ^
                                    Only this path is copied
```

## Tail Optimization

```
    PersistentVector
    +----------------+
    | Root           |
    | Tail [A,B,C,D] |  <- Last 32 elements for O(1) append
    | Size           |
    | Height         |
    +----------------+
```

## Chunking for Better Cache Locality

```
    Leaf Node (Chunk)
    +-----------------------------+
    | [A, B, C, D, ..., up to 32] |
    +-----------------------------+
```

## Small Vector Optimization

```
    SmallPersistentVector
    +----------------+
    | Elements Array | <- Direct array for vectors with < 32 elements
    +----------------+
```
