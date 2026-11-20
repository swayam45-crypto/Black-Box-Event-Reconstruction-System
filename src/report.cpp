#include "report.hpp"
#include <fstream>
#include <iostream>

void printTimeline(const std::vector<Event> &events) {
    if (events.empty()) {
        std::cout << "No events to display.\n";
        return;
    }
    std::cout << "ID    TIMESTAMP    SOURCE        DESCRIPTION\n";
    std::cout << "----------------------------------------------------------\n";
    for (const auto &event : events) {
        std::cout << event.id << "    " << event.timestamp << "    " << event.source << "        "
                  << event.description << '\n';
    }
    std::cout << "Total: " << events.size() << " event(s).\n";
}

void printValidation(const ValidationResult &result) {
    if (result.ok()) {
        std::cout << "Validation passed: no duplicate IDs, repeated timestamps, or ID gaps.\n";
        return;
    }

    std::cout << "Duplicate event IDs: ";
    if (result.duplicateIds.empty()) {
        std::cout << "none\n";
    } else {
        for (std::size_t i = 0; i < result.duplicateIds.size(); ++i) {
            if (i) std::cout << ", ";
            std::cout << result.duplicateIds[i];
        }
        std::cout << '\n';
    }

    std::cout << "Repeated timestamps: ";
    if (result.repeatedTimestamps.empty()) {
        std::cout << "none\n";
    } else {
        for (std::size_t i = 0; i < result.repeatedTimestamps.size(); ++i) {
            if (i) std::cout << ", ";
            std::cout << result.repeatedTimestamps[i];
        }
        std::cout << '\n';
    }

    std::cout << "Possible ID gaps: ";
    if (result.idGaps.empty()) {
        std::cout << "none\n";
    } else {
        for (std::size_t i = 0; i < result.idGaps.size(); ++i) {
            if (i) std::cout << ", ";
            std::cout << result.idGaps[i].first << "->" << result.idGaps[i].second;
        }
        std::cout << '\n';
    }
}

void writeAnalysisReport(const std::string &filename, const std::vector<Event> &allEvents,
                         const std::vector<Event> &timeline, const ValidationResult &result,
                         const EventGraph &graph) {
    std::ofstream file(filename);
    if (!file.is_open()) {
        std::cerr << "Error: could not write to '" << filename << "'.\n";
        return;
    }

    file << "ChronoTrace Analysis Report\n";
    file << "===========================\n\n";
    file << "Loaded events: " << allEvents.size() << '\n';
    file << "Timeline events: " << timeline.size() << '\n';
    file << "Duplicate IDs: " << result.duplicateIds.size() << '\n';
    file << "Repeated timestamps: " << result.repeatedTimestamps.size() << '\n';
    file << "Possible ID gaps: " << result.idGaps.size() << '\n';
    file << "Dependency edges: ";
    std::size_t edges = 0;
    for (const auto &entry : graph.adjacency()) edges += entry.second.size();
    file << edges << "\n\n";

    file << "Reconstructed timeline\n";
    file << "----------------------\n";
    for (const auto &event : timeline) {
        file << event.timestamp << "  [" << event.id << "]  " << event.source << " : "
             << event.description << '\n';
    }

    file << "\nData-quality details\n";
    file << "--------------------\n";
    file << "Duplicate IDs: ";
    for (std::size_t i = 0; i < result.duplicateIds.size(); ++i) {
        if (i) file << ", ";
        file << result.duplicateIds[i];
    }
    if (result.duplicateIds.empty()) file << "none";
    file << '\n';

    file << "Repeated timestamps: ";
    for (std::size_t i = 0; i < result.repeatedTimestamps.size(); ++i) {
        if (i) file << ", ";
        file << result.repeatedTimestamps[i];
    }
    if (result.repeatedTimestamps.empty()) file << "none";
    file << '\n';

    file << "Possible ID gaps: ";
    for (std::size_t i = 0; i < result.idGaps.size(); ++i) {
        if (i) file << ", ";
        file << result.idGaps[i].first << "->" << result.idGaps[i].second;
    }
    if (result.idGaps.empty()) file << "none";
    file << '\n';

    file << "\nDependency graph (adjacency list)\n";
    file << "---------------------------------\n";
    if (graph.empty()) {
        file << "No dependency edges loaded.\n";
    } else {
        for (const auto &entry : graph.adjacency()) {
            file << entry.first << " -> ";
            for (std::size_t i = 0; i < entry.second.size(); ++i) {
                if (i) file << ", ";
                file << entry.second[i];
            }
            file << '\n';
        }
    }
}
