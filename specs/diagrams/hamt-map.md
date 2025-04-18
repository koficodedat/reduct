# HAMT Map Architecture

## Trie Structure with Bitmap Indexing

```
                  Root Node (bitmap: 10010100)
                 /         |         \
                /          |          \
               /           |           \
    Branch Node 1    Branch Node 2    Branch Node 3
    (bitmap: 01100)  (bitmap: 10001)  (bitmap: 00110)
       /     \           /   \           /    \
      /       \         /     \         /      \
  Leaf A    Leaf B   Leaf C  Collision  Leaf E  Leaf F
                              Node
                             /    \
                        Leaf D1  Leaf D2
```

## Bitmap Indexing

```
Bitmap: 00101001  (binary)
        ││││││││
        │││││││└─ Bit 0: 1 (child at index 0)
        ││││││└── Bit 1: 0 (no child)
        │││││└─── Bit 2: 0 (no child)
        ││││└──── Bit 3: 1 (child at index 1)
        │││└───── Bit 4: 0 (no child)
        ││└────── Bit 5: 1 (child at index 2)
        │└─────── Bit 6: 0 (no child)
        └──────── Bit 7: 0 (no child)

Children array: [Child0, Child1, Child2]
```

## Path Copying for Modifications

```
    Original Trie                 Modified Trie (after set("key", X))
        Root                           New Root
       /  |  \                         /  |  \
      /   |   \                       /   |   \
   Node1 Node2 Node3               Node1 New2 Node3
   / | \  / | \  / | \             / | \  / | \  / | \
  A  B C  D E F  G H I            A  B C  D X F  G H I
                                          ^
                                    Only this path is copied
```

## Collision Resolution

```
    Collision Node
    +------------------+
    | Hash: 12345      |
    | Entries:         |
    |  ["foo", ValueA] |
    |  ["bar", ValueB] |  <- Keys with same hash but different values
    +------------------+
```

## Specialized Key Types

```
    StringKeyHAMTMap               NumberKeyHAMTMap
    +------------------+           +------------------+
    | hashFn: strHash  |           | hashFn: numHash  |
    | equalsFn: strEq  |           | equalsFn: numEq  |
    +------------------+           +------------------+
```

## Small Map Optimization

```
    SmallHAMTMap
    +------------------+
    | Entries:         |
    |  [Key1, Value1]  |
    |  [Key2, Value2]  |  <- Direct array for maps with < 8 entries
    |  [Key3, Value3]  |
    +------------------+
```
