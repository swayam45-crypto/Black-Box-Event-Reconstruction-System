# ChronoTrace Project Report

## Overview

ChronoTrace is a C++17 command-line application that reconstructs chronological timelines
from unordered event logs. It loads CSV records, validates data quality, sorts events,
searches by ID and time range, merges multiple sources, explores explicit dependencies, and
exports a timeline and analysis report.

## Modules

| Module | Responsibility |
|---|---|
| `event` | Central `Event` record |
| `file_handler` | CSV loading and timeline export |
| `merge_sort` | Stable Merge Sort and pairwise stream merging |
| `search` | ID lookup, timestamp lookup, time-range queries |
| `validation` | Duplicate IDs, repeated timestamps, ID gaps |
| `event_graph` | Adjacency list, BFS, DFS |
| `report` | Timeline display and analysis report |
| `main` | Menu-driven command-line interface |

## Design Decisions

- Timestamps are Unix seconds stored as `long long`, so comparison is direct.
- The sorting algorithm is implemented manually rather than delegated to `std::sort`.
- Multi-source merging uses pairwise Merge Sort merging instead of a Min-Heap.
- Validation only reports suspicious data; it does not modify input files.
- Dependency edges are loaded from an explicit file and are not inferred from timestamps.

## Testing

The `tests/` directory contains standalone checks for sorting, searching, and validation.
They can be built with the CMake targets `test_sort`, `test_search`, and `test_validation`,
or directly with `g++` as shown in `README.md`.

## Build

```powershell
g++ -std=c++17 -Wall -Wextra -Iinclude src/*.cpp -o bin/chronotrace.exe
```

Run from the project root so the relative `data/` and `output/` paths resolve:

```powershell
.\bin\chronotrace.exe
```

## Limitations

- Input uses a restricted CSV format without quoted fields.
- Timestamps are assumed to be directly comparable.
- Recorded order does not prove causation.
- The system is an educational simulation, not a certified forensic tool.
