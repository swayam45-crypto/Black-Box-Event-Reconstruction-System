# ChronoTrace Algorithm Analysis

Let `n` be the number of events and `k` the number of event sources.

## Merge Sort

Events are ordered by timestamp using a manually implemented stable merge sort.

- Best, average, worst: O(n log n)
- Auxiliary space: O(n)
- Equal timestamps keep their original relative order because the merge uses `<=`.

## Multi-Source Merging (no heap)

Each source is sorted with Merge Sort, then sorted streams are combined pairwise in a
divide-and-conquer fashion using the same stable merge routine.

- Sorting all streams: O(n log n) total
- Pairwise merging: O(n log k)
- Auxiliary space: O(n)
- No priority queue or heap is used.

## Searching

- Event-ID lookup: linear search, O(n)
- Timestamp lookup: binary search plus adjacent scan, O(log n + m) for `m` matches
- Inclusive time range: two binary searches, O(log n + m)

## Duplicate Detection

Duplicate event IDs are found with `std::unordered_set<int>`.

- Expected time: O(n)
- Worst case: O(n^2) for adversarial hash collisions

## Validation

- Repeated timestamps: sort timestamps, then scan, O(n log n)
- ID gaps: sort unique IDs, then scan adjacent values, O(n log n)

## Dependency Graph

The graph uses an adjacency list.

- Add edge: O(1) average
- BFS: O(V + E)
- DFS: O(V + E)

Edges are loaded from `data/dependencies.csv`; they are never inferred from timestamps alone.
