#include "validation.hpp"
#include <algorithm>
#include <unordered_set>

bool ValidationResult::ok() const {
    return duplicateIds.empty() && repeatedTimestamps.empty() && idGaps.empty();
}

std::vector<Event> removeDuplicates(const std::vector<Event> &events) {
    std::vector<Event> result;
    std::unordered_set<int> seen;
    result.reserve(events.size());
    for (const auto &event : events) {
        if (seen.insert(event.id).second) result.push_back(event);
    }
    return result;
}

bool validateFields(const Event &event) {
    if (event.id <= 0) return false;
    if (event.timestamp <= 0) return false;
    if (event.source.empty()) return false;
    if (event.description.empty()) return false;
    return true;
}

ValidationResult validateEvents(const std::vector<Event> &events) {
    ValidationResult result;

    std::unordered_set<int> ids;
    std::unordered_set<int> reportedDuplicates;
    for (const auto &event : events) {
        if (!ids.insert(event.id).second && reportedDuplicates.insert(event.id).second) {
            result.duplicateIds.push_back(event.id);
        }
    }

    std::vector<long long> timestamps;
    timestamps.reserve(events.size());
    for (const auto &event : events) timestamps.push_back(event.timestamp);
    std::sort(timestamps.begin(), timestamps.end());

    for (std::size_t i = 1; i < timestamps.size(); ++i) {
        if (timestamps[i] == timestamps[i - 1] &&
            (result.repeatedTimestamps.empty() || result.repeatedTimestamps.back() != timestamps[i])) {
            result.repeatedTimestamps.push_back(timestamps[i]);
        }
    }

    if (!ids.empty()) {
        std::vector<int> sortedIds(ids.begin(), ids.end());
        std::sort(sortedIds.begin(), sortedIds.end());
        for (std::size_t i = 1; i < sortedIds.size(); ++i) {
            if (sortedIds[i] - sortedIds[i - 1] > 1) {
                result.idGaps.emplace_back(sortedIds[i - 1], sortedIds[i]);
            }
        }
    }

    std::sort(result.duplicateIds.begin(), result.duplicateIds.end());
    return result;
}
