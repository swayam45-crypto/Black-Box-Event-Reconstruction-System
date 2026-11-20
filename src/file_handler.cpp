#include "file_handler.hpp"
#include <fstream>
#include <iostream>
#include <sstream>

static std::string trim(const std::string &value) {
    std::size_t first = value.find_first_not_of(" \t\r\n");
    if (first == std::string::npos) return "";
    std::size_t last = value.find_last_not_of(" \t\r\n");
    return value.substr(first, last - first + 1);
}

static bool parseInteger(const std::string &text, long long &value) {
    try {
        std::size_t used = 0;
        std::string cleaned = trim(text);
        if (cleaned.empty()) return false;
        long long parsed = std::stoll(cleaned, &used);
        if (used != cleaned.size()) return false;
        value = parsed;
        return true;
    } catch (...) {
        return false;
    }
}

std::vector<Event> loadEvents(const std::string &filename) {
    std::vector<Event> events;
    std::ifstream file(filename);
    if (!file.is_open()) {
        std::cerr << "Error: could not open file '" << filename << "'.\n";
        return events;
    }

    std::string line;
    int lineNumber = 0;
    while (std::getline(file, line)) {
        ++lineNumber;
        if (trim(line).empty()) continue;
        if (lineNumber == 1 && line.find("id") != std::string::npos &&
            line.find("timestamp") != std::string::npos) {
            continue;
        }

        std::stringstream ss(line);
        std::string idText, timestampText, source, description;
        if (!std::getline(ss, idText, ',') || !std::getline(ss, timestampText, ',') ||
            !std::getline(ss, source, ',') || !std::getline(ss, description)) {
            std::cerr << "Warning: malformed row " << lineNumber << " in '" << filename << "'.\n";
            continue;
        }

        long long id = 0;
        long long timestamp = 0;
        if (!parseInteger(idText, id) || !parseInteger(timestampText, timestamp)) {
            std::cerr << "Warning: invalid numeric field on row " << lineNumber << " in '"
                      << filename << "'.\n";
            continue;
        }

        Event event;
        event.id = static_cast<int>(id);
        event.timestamp = timestamp;
        event.source = trim(source);
        event.description = trim(description);

        if (event.id <= 0 || event.timestamp <= 0 || event.source.empty() ||
            event.description.empty()) {
            std::cerr << "Warning: invalid event fields on row " << lineNumber << " in '"
                      << filename << "'.\n";
            continue;
        }

        events.push_back(event);
    }

    return events;
}

void saveTimeline(const std::string &filename, const std::vector<Event> &events) {
    std::ofstream file(filename);
    if (!file.is_open()) {
        std::cerr << "Error: could not write to '" << filename << "'.\n";
        return;
    }

    file << "id,timestamp,source,description\n";
    for (const auto &event : events) {
        file << event.id << ',' << event.timestamp << ',' << event.source << ','
             << event.description << '\n';
    }
}
