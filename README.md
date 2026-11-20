# ChronoTrace
## Black Box Event Reconstruction and Timeline Analysis System

**Project Type:** Data Structures and Algorithms (DSA) Mini-Project  
**Programming Language:** C++  
**C++ Standard:** C++17  
**Application Type:** Command-Line Application  
**Primary Domain:** Event Log Analysis and Timeline Reconstruction

---

## 1. Project Overview

ChronoTrace is a C++-based event reconstruction system designed to organize, analyze, and reconstruct chronological sequences from event logs that may arrive in an unordered manner.

In systems such as aircraft monitoring, industrial control, network monitoring, and distributed computing, different recording sources can generate events independently. When these records are collected, they may not be arranged in the order in which the events occurred.

ChronoTrace processes these records, organizes them by timestamp, detects potential data-quality issues, and provides tools for searching and analyzing the reconstructed timeline.

The project demonstrates how fundamental and advanced data structures can be applied to a practical event-analysis problem.

### Example Scenario

Suppose a simulated aircraft monitoring system generates these events:

| Event ID | Timestamp | Source | Description |
|---|---|---|---|
| 104 | 10:00:05 | ENGINE | Engine reading recorded |
| 101 | 10:00:01 | SENSOR | Monitoring started |
| 103 | 10:00:03 | CABIN | Pressure warning |
| 102 | 10:00:02 | FLIGHT | Altitude reading |
| 105 | 10:00:07 | COMM | Communication signal lost |

The records are not arranged chronologically.

ChronoTrace reconstructs the timeline as:

1. 10:00:01 — Monitoring started
2. 10:00:02 — Altitude reading
3. 10:00:03 — Pressure warning
4. 10:00:05 — Engine reading recorded
5. 10:00:07 — Communication signal lost

The resulting timeline helps an investigator understand the recorded sequence of events.

**Important limitation:** ChronoTrace is an educational simulation, not a certified aircraft black-box investigation system. Timestamps establish recorded time order, but they do not independently prove causation. Real systems may require clock synchronization, timestamp uncertainty handling, and specialized forensic validation.

---

## 2. Problem Statement

Event logs collected from multiple sources may be unordered, contain duplicate identifiers, include malformed records, or have gaps in the recorded data.

Manually organizing large event logs can be time-consuming and error-prone.

The objective of ChronoTrace is to develop a C++ application that:

- Reads event records from structured files.
- Validates and stores the records.
- Reconstructs a chronological timeline.
- Merges multiple sorted event streams efficiently.
- Searches for events by identifier and timestamp.
- Detects duplicate identifiers and potential data gaps.
- Represents known event dependencies using a graph.
- Exports the reconstructed timeline and analysis results.

---

## 3. Project Objectives

The primary objectives are:

1. Apply DSA concepts to a practical event-analysis problem.
2. Implement Merge Sort for chronological event ordering.
3. Implement a Min-Heap for efficient multi-source event merging.
4. Use searching algorithms for event investigation.
5. Use hash-based structures for duplicate detection.
6. Represent known relationships between events using graphs.
7. Implement file handling and structured data processing in C++.
8. Evaluate algorithmic time and space complexity.
9. Develop a modular, maintainable, and testable application.

---

## 4. Technology Stack

ChronoTrace uses standard C++17 and does not require an external database, web server, or third-party framework.

| Technology | Purpose |
|---|---|
| C++17 | Core programming language |
| GCC / MinGW-w64 | C++ compiler |
| Visual Studio Code | Code editor |
| CMake | Project configuration and build management |
| CSV | Input event-log format |
| Standard C++ Library | File handling, containers, strings, and utilities |
| Git | Version control |
| GitHub | Source-code hosting and project collaboration |

### Standard C++ features used

- `std::vector` for storing event records.
- `std::string` for source names and descriptions.
- `std::ifstream` for reading input files.
- `std::ofstream` for writing output reports.
- `std::unordered_set` for duplicate detection.
- `std::priority_queue` for heap-based processing, if using the STL implementation.
- `std::queue` for graph traversal using BFS.
- `std::stack` or recursion for DFS, where appropriate.

### Why C++17?

C++17 provides convenient standard-library containers and file-handling facilities while still allowing the core algorithms to be implemented manually.

For the strongest DSA demonstration, implement Merge Sort and the Min-Heap yourself before considering STL alternatives.

---

## 5. System Architecture

ChronoTrace follows a modular architecture.

The major processing stages are:

1. **Input Layer:** Reads event records from CSV files.
2. **Validation Layer:** Checks fields and identifies suspicious records.
3. **Storage Layer:** Stores events in memory using C++ data structures.
4. **Processing Layer:** Sorts events and merges multiple streams.
5. **Analysis Layer:** Supports searching and dependency-graph traversal.
6. **Output Layer:** Displays results and exports timelines and reports.

### Processing workflow

```text
                 START
                   |
                   v
          Load Event Log Files
                   |
                   v
          Parse CSV Event Records
                   |
                   v
           Validate Input Data
                   |
                   v
          Store Valid Event Records
                   |
                   v
            Select Operation
                   |
          +--------+---------+
          |        |         |
          v        v         v
      Merge Sort  Min-Heap  Searching
          |        |         |
          +--------+---------+
                   |
                   v
           Event Graph Analysis
                   |
                   v
          Generate Timeline/Report
                   |
                   v
                  EXIT
```

Validation errors should be reported clearly. Original records should be preserved separately from the reconstructed output so that processing does not silently overwrite the input.

---

## 6. Project Folder Structure

Create the following project structure:

```text
ChronoTrace/
|
|-- src/
|   |-- main.cpp
|   |-- event.cpp
|   |-- file_handler.cpp
|   |-- merge_sort.cpp
|   |-- min_heap.cpp
|   |-- search.cpp
|   |-- validation.cpp
|   |-- event_graph.cpp
|   |-- report.cpp
|
|-- include/
|   |-- event.hpp
|   |-- file_handler.hpp
|   |-- merge_sort.hpp
|   |-- min_heap.hpp
|   |-- search.hpp
|   |-- validation.hpp
|   |-- event_graph.hpp
|   |-- report.hpp
|
|-- data/
|   |-- sample_events.csv
|   |-- multi_source_events.csv
|
|-- output/
|   |-- reconstructed_timeline.txt
|   |-- analysis_report.txt
|
|-- tests/
|   |-- test_sort.cpp
|   |-- test_search.cpp
|   |-- test_validation.cpp
|
|-- docs/
|   |-- project_report.md
|   |-- algorithm_analysis.md
|
|-- CMakeLists.txt
|-- README.md
|-- .gitignore
```

### Folder responsibilities

**`src/`**

Contains the implementations of the application modules.

**`include/`**

Contains header files with declarations of structures and functions.

**`data/`**

Contains sample CSV files used as input.

**`output/`**

Stores generated timelines and analysis reports.

**`tests/`**

Contains tests for individual algorithms and modules.

**`docs/`**

Contains project documentation, algorithm analysis, and implementation notes.

The `output/` directory can be created automatically by the program or included in the repository with a placeholder file.

---

## 7. Event Data Model

The central data structure is an `Event`.

Create `include/event.hpp`:

```cpp
#ifndef EVENT_HPP
#define EVENT_HPP

#include <string>

struct Event {
    int id;
    long long timestamp;
    std::string source;
    std::string description;
};

#endif
```

### Field descriptions

| Field | Meaning |
|---|---|
| `id` | Unique identifier assigned to a recorded event |
| `timestamp` | Recorded time represented as Unix time in seconds |
| `source` | Recording subsystem that produced the event |
| `description` | Human-readable event description |

Unix timestamps make chronological comparison straightforward.

If human-readable dates are required, implement a conversion function. Preserve the original timestamp and its source when analyzing real-world data.

The `id` field should not be assumed to represent chronological order unless the input specification explicitly guarantees that property.

---

## 8. Sample Input File

Create `data/sample_events.csv`:

```csv
id,timestamp,source,description
104,1792900805,ENGINE,Engine reading recorded
101,1792900801,SENSOR,Monitoring started
103,1792900803,CABIN,Pressure warning
102,1792900802,FLIGHT,Altitude reading
105,1792900807,COMM,Signal lost
```

This file intentionally contains events in an unordered sequence.

For the first implementation, descriptions should not contain commas. A later improvement can support properly quoted CSV fields.

### Multiple-source input

Create `data/multi_source_events.csv` containing events from multiple sources.

The advanced implementation should also support reading separate files, such as:

```text
data/
|-- engine_events.csv
|-- cabin_events.csv
|-- communication_events.csv
```

Each source should be individually sorted before applying the standard k-way Min-Heap merge algorithm.

If the input streams are not sorted, sort them first or use another suitable processing strategy.

---

## 9. Core DSA Concepts

### 9.1 Structures and Dynamic Arrays

**Data structure:** `struct Event` and `std::vector<Event>`

**Purpose:** Store and manage event records in memory.

**Why it matters:** A consistent event representation makes sorting, searching, validation, and graph analysis easier.

### 9.2 Merge Sort

**Purpose:** Reconstruct the chronological timeline.

The algorithm divides the event array into smaller parts, sorts each part, and merges the sorted parts.

Expected time complexity:

- Best case: O(n log n)
- Average case: O(n log n)
- Worst case: O(n log n)

Auxiliary space: O(n).

Use a stable comparison so that events with equal timestamps preserve their input order.

### 9.3 Min-Heap

**Purpose:** Merge multiple sorted event streams.

The heap stores the next unprocessed event from each stream. The event with the smallest timestamp is selected first.

For n total events across k sorted streams:

- Time complexity: O(n log k)
- Heap space: O(k), excluding the input and output storage.

A manually implemented Min-Heap demonstrates array indexing, parent-child relationships, heapify operations, insertion, and removal.

### 9.4 Searching Algorithms

**Linear Search**

Useful for a straightforward event-ID lookup.

Time complexity: O(n).

**Binary Search**

Useful for locating a timestamp in a timeline sorted by timestamp.

Time complexity: O(log n).

To return every event sharing a timestamp, find a matching position and examine adjacent records with the same timestamp.

**Time-Range Search**

Returns events whose timestamps fall within a specified inclusive range.

A binary-search-based implementation can locate the beginning and end of the matching interval efficiently.

### 9.5 Hash-Based Duplicate Detection

Use `std::unordered_set<int>` to track event IDs.

Expected total time for processing n identifiers: O(n) average.

Worst-case hash-table performance can be worse than linear overall, so describe the complexity as expected or average rather than guaranteed.

### 9.6 Graphs

Use an adjacency list to represent known relationships between events.

Possible relationships include:

- A monitoring event followed by a sensor reading.
- A warning followed by an acknowledgement.
- An alert associated with a recorded response.

Use BFS or DFS to explore the relationships.

Graph vertices represent events, and directed edges represent explicitly recorded or simulated dependencies.

A timestamp difference alone is not enough to establish a causal edge.

### 9.7 File Handling

Use `std::ifstream` to read CSV files and `std::ofstream` to export results.

Validate each record before converting numeric fields or adding it to the event collection.

---

## 10. Detailed Implementation Roadmap

Implement the project in the following order.

### Stage 1: Environment Setup

Tasks:

1. Install or verify a C++17 compiler.
2. Install Visual Studio Code if required.
3. Create the project directory.
4. Create the initial folder structure.
5. Write a minimal `main.cpp`.
6. Compile and run the program.

**Completion condition:** The application prints a startup message and exits successfully.

### Stage 2: Event Structure

Tasks:

1. Create `event.hpp`.
2. Define the `Event` structure.
3. Create a few event objects.
4. Display their fields.
5. Verify that timestamps and IDs are stored correctly.

**Completion condition:** Event records can be represented and displayed.

### Stage 3: CSV File Handling

Tasks:

1. Create the sample CSV.
2. Implement file opening.
3. Read each row.
4. Parse the fields.
5. Validate numeric conversions.
6. Store valid events in a vector.
7. Report malformed rows.

**Completion condition:** The program loads and displays the sample records.

### Stage 4: Timeline Reconstruction

Tasks:

1. Implement Merge Sort.
2. Compare events using timestamps.
3. Preserve order for equal timestamps.
4. Display the sorted timeline.
5. Test empty input, a single event, and equal timestamps.

**Completion condition:** Unordered records are correctly sorted.

### Stage 5: Validation and Data Quality

Tasks:

1. Detect duplicate event IDs.
2. Validate required fields.
3. Detect repeated timestamps.
4. Report possible event-ID gaps.
5. Keep warnings separate from original records.

**Completion condition:** Invalid or suspicious data is reported without silently modifying the source file.

### Stage 6: Search Operations

Tasks:

1. Implement event-ID search.
2. Implement binary search on timestamps.
3. Add inclusive time-range queries.
4. Test records that do not exist.
5. Test multiple events with identical timestamps.

**Completion condition:** Users can search and filter event records.

### Stage 7: Multi-Source Merging

Tasks:

1. Prepare separate sorted event streams.
2. Implement a Min-Heap.
3. Insert the first event from each stream.
4. Remove the minimum timestamp.
5. Insert the next event from the selected stream.
6. Continue until all streams are empty.
7. Verify the merged output.

**Completion condition:** Multiple sorted streams produce one chronological timeline.

### Stage 8: Dependency Graph

Tasks:

1. Define how event dependencies are represented.
2. Create an adjacency-list graph.
3. Add known relationships.
4. Implement BFS or DFS.
5. Display connected or dependent events.
6. Avoid inventing relationships from timestamps alone.

**Completion condition:** The program can explore explicitly defined event relationships.

### Stage 9: Menu and Reporting

Tasks:

1. Create the main menu.
2. Connect each menu option to its module.
3. Add input validation.
4. Export the reconstructed timeline.
5. Generate a data-quality summary.
6. Handle file and processing errors.

**Completion condition:** All completed modules can be accessed from the command-line interface.

### Stage 10: Testing and Documentation

Tasks:

1. Test each algorithm independently.
2. Test malformed and empty input.
3. Test duplicate IDs and repeated timestamps.
4. Test multiple-stream merging.
5. Test graph traversal.
6. Verify exported output.
7. Document the complexity of each algorithm.
8. Prepare screenshots and a project report.

**Completion condition:** The project runs reliably on the supplied sample data, and its behavior is documented.

---

## 11. Application Menu

The final command-line interface should provide:

```text
=====================================
          CHRONOTRACE
   Event Reconstruction System
=====================================

1. Load event log
2. Display original events
3. Reconstruct chronological timeline
4. Search event by ID
5. Search events by time range
6. Validate event records
7. Merge multiple event sources
8. Explore event dependencies
9. Export reconstructed timeline
10. Generate analysis report
0. Exit

Enter your choice:
```

The application should report errors for invalid menu selections and allow users to return to the menu without restarting the program.

---

## 12. Build and Run Instructions

### Prerequisites

Install:

- A C++17-compatible compiler such as GCC.
- CMake.
- A terminal or Visual Studio Code.

Check the compiler:

```bash
g++ --version
```

Check CMake:

```bash
cmake --version
```

### Quick compile during early development

When only `main.cpp` exists:

```bash
g++ -std=c++17 -Wall -Wextra src/main.cpp -o chronotrace.exe
```

Run in Windows PowerShell:

```powershell
.\chronotrace.exe
```

### CMake configuration

Create `CMakeLists.txt` in the project root:

```cmake
cmake_minimum_required(VERSION 3.16)

project(ChronoTrace LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(chronotrace
    src/main.cpp
    src/file_handler.cpp
    src/merge_sort.cpp
    src/min_heap.cpp
    src/search.cpp
    src/validation.cpp
    src/event_graph.cpp
    src/report.cpp
)

target_include_directories(chronotrace PRIVATE include)
```

Add or remove source files as the project develops. If you create `event.cpp`, include it in the target when it contains non-inline definitions.

Build the application:

```bash
cmake -S . -B build
cmake --build build
```

On Windows, the executable may be generated at:

```powershell
.\build\Debug\chronotrace.exe
```

For other generators or configurations, check the location printed by CMake.

Run the program from the project root so the relative paths to `data/` and `output/` work as expected.

### Using Linux

For a GCC-based environment:

```bash
g++ --version
cmake -S . -B build
cmake --build build
./build/chronotrace
```

### Web interface

The static web interface is in `ui/`. It supports the same features as the CLI and does not
require Python.

```powershell
.\ui\start-ui.cmd
```

The launcher starts a local Node.js server on a free port and opens the browser. You can also
run the server manually:

```powershell
node ui/server.js
```

Open `http://127.0.0.1:8080/` (or the port printed by the server). Opening `ui/index.html`
directly in a browser also works.

---

## 13. Testing Strategy

Test every module separately before integrating it into the complete application.

| Test case | Expected behavior |
|---|---|
| Unordered event records | Sorted by timestamp |
| Equal timestamps | Stable, consistent ordering |
| Empty file | No crash; report no events |
| Missing input file | Clear error message |
| Invalid timestamp | Malformed record reported |
| Duplicate event ID | Duplicate detected |
| Missing ID in a sequence | Possible gap reported |
| Nonexistent event ID | No matching event message |
| Time-range query | All events within the selected interval |
| Multiple sorted streams | Correct merged timeline |
| Empty stream | Other streams still merge correctly |
| Dependency graph | BFS/DFS follows defined edges |
| Exported timeline | Matches the processed result |

Tests should check correctness, not just whether the program compiles.

For stronger validation, compare algorithm results with a trusted reference implementation in test code. The production implementation should still demonstrate the algorithms you intend to showcase.

---

## 14. Algorithm Complexity Summary

Let:

- n = total number of events.
- k = number of sorted input streams.
- V = number of graph vertices.
- E = number of graph edges.

| Operation | Expected time complexity |
|---|---|
| Merge Sort | O(n log n) |
| Linear Search | O(n) |
| Binary Search | O(log n) |
| Hash-based duplicate detection | O(n) average total |
| Min-Heap insertion | O(log k) |
| Min-Heap removal | O(log k) |
| Merge k sorted streams | O(n log k) |
| BFS | O(V + E) |
| DFS | O(V + E) |

These complexities describe the core algorithms. File parsing, output formatting, memory allocation, and validation also contribute to overall execution time.

---

## 15. Development Schedule

A suggested two-week schedule:

| Day | Task |
|---|---|
| 1 | Environment setup and project structure |
| 2 | Event structure and sample data |
| 3 | CSV parsing and file handling |
| 4 | Merge Sort |
| 5 | Validation and duplicate detection |
| 6 | Binary search and time-range search |
| 7–8 | Min-Heap and multi-source merging |
| 9–10 | Graph representation and traversal |
| 11 | Menu and report generation |
| 12 | Integration and testing |
| 13 | README and algorithm analysis |
| 14 | Final report and demonstration |

The schedule can be adjusted according to your available time and the complexity of the implementation.

---

## 16. Future Enhancements

After completing the core project, consider these extensions:

### 16.1 Clock Offset Handling

Simulate different recording sources with clock offsets. Preserve original timestamps and record any estimated correction separately.

### 16.2 Timestamp Uncertainty

Allow a timestamp to have an uncertainty interval. Report events whose order cannot be determined confidently rather than inventing a definite sequence.

### 16.3 Advanced Gap Analysis

Analyze missing sequence numbers or unexpected gaps using source-specific rules. Report possible missing records without treating every gap as proof of data loss.

### 16.4 Timeline Filtering

Allow filtering by source, event category, time range, or severity.

### 16.5 Performance Benchmarking

Compare Merge Sort with other sorting approaches and compare manual Min-Heap merging with a standard-library implementation.

### 16.6 Event Replay

Create a text-based replay mode that displays the timeline step by step.

### 16.7 Improved CSV Support

Support quoted fields, escaped quotes, and descriptions containing commas.

### 16.8 Evidence Integrity

Preserve original input files and generate checksums or file hashes to help detect accidental changes. A checksum alone does not establish authenticity or chain of custody.

---

## 17. Limitations

The initial implementation has several limitations:

- It uses simulated or sample event logs.
- It assumes timestamps are comparable unless clock correction is explicitly implemented.
- Timestamp order does not prove causation.
- The CSV parser may initially support only a restricted format.
- The dependency graph only represents known or explicitly simulated relationships.
- The project is not certified for real aircraft investigation or safety-critical use.

These limitations can become part of the project's future-work discussion.

---

## 18. Expected Learning Outcomes

By completing ChronoTrace, you should gain practical experience with:

- C++ structures and classes.
- Dynamic arrays and STL containers.
- File handling and CSV parsing.
- Merge Sort and algorithm analysis.
- Min-Heap implementation.
- Binary search and range queries.
- Hash-based duplicate detection.
- Graphs, adjacency lists, BFS, and DFS.
- Modular software design.
- Testing, debugging, and documentation.
- Complexity analysis and performance measurement.

---

## 19. Final Deliverables

The final project submission should include:

1. Complete C++ source code.
2. Header files and build configuration.
3. Sample input CSV files.
4. Reconstructed timeline output.
5. Data-quality and analysis reports.
6. Test programs and test results.
7. README documentation.
8. Project report and algorithm complexity analysis.
9. Screenshots of successful program execution.
10. A demonstration of sorting, searching, multi-source merging, and graph traversal.

---

## 20. Getting Started

Start with the smallest working version of ChronoTrace:

1. Set up the C++17 compiler.
2. Create the folder structure.
3. Define the `Event` structure.
4. Create `sample_events.csv`.
5. Read and display the records.
6. Implement Merge Sort.
7. Verify that the reconstructed timeline is correct.

Once this version works, implement validation and searching, followed by Min-Heap merging and graph analysis.

**The core principle of ChronoTrace is simple:** preserve the recorded events, reconstruct their chronological sequence, report uncertainty and data-quality problems, and distinguish recorded time order from proven causal relationships.

That gives you a strong foundation for a DSA mini-project with a clear path from basic implementation to advanced event analysis.
