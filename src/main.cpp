#include "event.hpp"
#include "event_graph.hpp"
#include "file_handler.hpp"
#include "merge_sort.hpp"
#include "min_heap.hpp"
#include "report.hpp"
#include "search.hpp"
#include "validation.hpp"

#include <algorithm>
#include <iostream>
#include <limits>
#include <string>
#include <vector>

static void printMenu() {
    std::cout << "\n=====================================\n";
    std::cout << "          CHRONOTRACE\n";
    std::cout << "   Event Reconstruction System\n";
    std::cout << "=====================================\n";
    std::cout << "1. Load event log\n";
    std::cout << "2. Display original events\n";
    std::cout << "3. Reconstruct chronological timeline\n";
    std::cout << "4. Search event by ID\n";
    std::cout << "5. Search events by time range\n";
    std::cout << "6. Validate event records\n";
    std::cout << "7. Merge multiple event sources\n";
    std::cout << "8. Explore event dependencies\n";
    std::cout << "9. Export reconstructed timeline\n";
    std::cout << "10. Generate analysis report\n";
    std::cout << "0. Exit\n";
    std::cout << "Enter your choice: ";
}

static int readChoice() {
    std::string line;
    if (!std::getline(std::cin, line)) return -1;
    try {
        std::size_t used = 0;
        int value = std::stoi(line, &used);
        if (used != line.size()) return -1;
        return value;
    } catch (...) {
        return -1;
    }
}

static std::string readLine(const std::string &prompt, const std::string &fallback) {
    std::cout << prompt;
    std::string value;
    if (!std::getline(std::cin, value) || value.empty()) return fallback;
    return value;
}

static bool readLongLong(const std::string &prompt, long long &value) {
    std::cout << prompt;
    std::string line;
    if (!std::getline(std::cin, line)) return false;
    try {
        std::size_t used = 0;
        value = std::stoll(line, &used);
        return used == line.size();
    } catch (...) {
        return false;
    }
}

static std::vector<Event> prepareTimeline(const std::vector<Event> &events) {
    std::vector<Event> timeline = events;
    mergeSort(timeline);
    return timeline;
}

int main() {
    std::vector<Event> events;
    std::vector<Event> timeline;
    EventGraph graph;
    bool loaded = false;

    std::cout << "ChronoTrace started. Load an event log to begin.\n";

    while (true) {
        printMenu();
        int choice = readChoice();
        if (choice == -1) {
            std::cout << "Invalid selection. Enter a number from the menu.\n";
            continue;
        }

        if (choice == 0) {
            std::cout << "Exiting ChronoTrace.\n";
            break;
        }

        switch (choice) {
        case 1: {
            std::string filename = readLine("Enter CSV file path [data/sample_events.csv]: ",
                                            "data/sample_events.csv");
            std::vector<Event> loadedEvents = loadEvents(filename);
            events = loadedEvents;
            timeline.clear();
            loaded = !events.empty();
            if (loaded) {
                std::cout << "Loaded " << events.size() << " event(s) from '" << filename
                          << "'.\n";
            } else {
                std::cout << "No valid events loaded from '" << filename << "'.\n";
            }
            break;
        }
        case 2:
            if (!loaded) {
                std::cout << "No event log loaded. Choose option 1 first.\n";
                break;
            }
            printTimeline(events);
            break;
        case 3:
            if (!loaded) {
                std::cout << "No event log loaded. Choose option 1 first.\n";
                break;
            }
            timeline = prepareTimeline(events);
            std::cout << "Reconstructed timeline:\n";
            printTimeline(timeline);
            break;
        case 4: {
            if (!loaded) {
                std::cout << "No event log loaded. Choose option 1 first.\n";
                break;
            }
            long long id = 0;
            if (!readLongLong("Enter event ID: ", id)) {
                std::cout << "Invalid event ID.\n";
                break;
            }
            const Event *found = searchById(events, static_cast<int>(id));
            if (found == nullptr) {
                std::cout << "No event found with ID " << id << ".\n";
            } else {
                std::cout << "Found: " << found->id << " | " << found->timestamp << " | "
                          << found->source << " | " << found->description << '\n';
            }
            break;
        }
        case 5: {
            if (!loaded) {
                std::cout << "No event log loaded. Choose option 1 first.\n";
                break;
            }
            long long start = 0;
            long long end = 0;
            if (!readLongLong("Enter start timestamp: ", start) ||
                !readLongLong("Enter end timestamp: ", end)) {
                std::cout << "Invalid timestamp range.\n";
                break;
            }
            if (timeline.empty()) timeline = prepareTimeline(events);
            std::vector<Event> matches = searchByRange(timeline, start, end);
            if (matches.empty()) {
                std::cout << "No events in the selected time range.\n";
            } else {
                printTimeline(matches);
            }
            break;
        }
        case 6: {
            if (!loaded) {
                std::cout << "No event log loaded. Choose option 1 first.\n";
                break;
            }
            ValidationResult result = validateEvents(events);
            printValidation(result);
            break;
        }
        case 7: {
            long long count = 0;
            if (!readLongLong("Enter number of source files: ", count) || count <= 0) {
                std::cout << "Invalid number of files.\n";
                break;
            }
            std::vector<std::vector<Event>> streams;
            for (long long i = 0; i < count; ++i) {
                std::string filename = readLine(
                    "Enter source file " + std::to_string(i + 1) + " path: ", "");
                if (filename.empty()) {
                    std::cout << "Skipping empty file name.\n";
                    continue;
                }
                streams.push_back(loadEvents(filename));
            }
            if (streams.empty()) {
                std::cout << "No source files processed.\n";
                break;
            }
            timeline = mergeStreamsWithHeap(streams);
            events = timeline;
            loaded = !events.empty();
            std::cout << "Merged " << streams.size() << " source(s) using a Min-Heap.\n";
            printTimeline(timeline);
            break;
        }
        case 8: {
            std::string filename = readLine(
                "Enter dependency file path [data/dependencies.csv]: ", "data/dependencies.csv");
            if (!graph.loadFromFile(filename)) {
                std::cout << "Could not open dependency file '" << filename << "'.\n";
                break;
            }
            if (graph.empty()) {
                std::cout << "No dependency edges found in '" << filename << "'.\n";
                break;
            }
            long long start = 0;
            if (!readLongLong("Enter starting event ID for traversal: ", start)) {
                std::cout << "Invalid event ID.\n";
                break;
            }
            std::vector<int> bfsOrder = graph.bfs(static_cast<int>(start));
            std::vector<int> dfsOrder = graph.dfs(static_cast<int>(start));
            if (bfsOrder.empty()) {
                std::cout << "Event ID " << start << " has no dependency edges.\n";
                break;
            }
            std::cout << "BFS order: ";
            for (std::size_t i = 0; i < bfsOrder.size(); ++i) {
                if (i) std::cout << " -> ";
                std::cout << bfsOrder[i];
            }
            std::cout << "\nDFS order: ";
            for (std::size_t i = 0; i < dfsOrder.size(); ++i) {
                if (i) std::cout << " -> ";
                std::cout << dfsOrder[i];
            }
            std::cout << '\n';
            break;
        }
        case 9:
            if (!loaded) {
                std::cout << "No event log loaded. Choose option 1 first.\n";
                break;
            }
            if (timeline.empty()) timeline = prepareTimeline(events);
            saveTimeline("output/reconstructed_timeline.txt", timeline);
            std::cout << "Timeline exported to output/reconstructed_timeline.txt.\n";
            break;
        case 10: {
            if (!loaded) {
                std::cout << "No event log loaded. Choose option 1 first.\n";
                break;
            }
            if (timeline.empty()) timeline = prepareTimeline(events);
            ValidationResult result = validateEvents(events);
            writeAnalysisReport("output/analysis_report.txt", events, timeline, result, graph);
            std::cout << "Analysis report written to output/analysis_report.txt.\n";
            break;
        }
        default:
            std::cout << "Invalid selection. Enter a number from the menu.\n";
            break;
        }
    }

    return 0;
}
