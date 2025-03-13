# Reduct Algorithms Catalog

## Sorting Algorithms
- Quicksort
- Merge Sort
- Heap Sort
- Radix Sort
- Counting Sort

### Performance Characteristics
| Algorithm    | Time Complexity | Space Complexity | Stability |
|--------------|-----------------|------------------|-----------|
| Quicksort    | O(n log n)      | O(log n)         | No        |
| Merge Sort   | O(n log n)      | O(n)             | Yes       |
| Heap Sort    | O(n log n)      | O(1)             | No        |

## Searching Algorithms
- Binary Search
- Depth-First Search
- Breadth-First Search
- A* Search

## Graph Algorithms
- Dijkstra's Shortest Path
- Kruskal's Minimum Spanning Tree
- Topological Sort
- Strongly Connected Components

## String Algorithms
- Rabin-Karp String Matching
- Longest Common Subsequence
- Levenshtein Distance

## Machine Learning Primitives
- k-Nearest Neighbors
- Linear Regression
- Gradient Descent

## Usage Example
```typescript
import { quickSort, binarySearch } from 'reduct/algorithms';

const sortedArray = quickSort([3, 1, 4, 1, 5, 9]);
const foundIndex = binarySearch(sortedArray, 4);
```

## Algorithm Selection Guide
- Choose based on:
  - Input size
  - Memory constraints
  - Stability requirements
  - Performance needs

## Complexity Analysis
- Detailed time/space complexity
- Worst/average/best-case scenarios
- Memory footprint
- Theoretical limitations

## Performance Optimization
- Memoization support
- Lazy evaluation
- Parallel processing hooks