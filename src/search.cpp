#include "search.hpp"
#include <algorithm>

const Event *searchById(const std::vector<Event> &events, int id) {
    for (const auto &event : events) {
        if (event.id == id) return &event;
    }
    return nullptr;
}

std::vector<Event> searchByTimestamp(const std::vector<Event> &sortedEvents, long long timestamp) {
    auto lower = std::lower_bound(sortedEvents.begin(), sortedEvents.end(), timestamp,
                                  [](const Event &e, long long value) { return e.timestamp < value; });
    std::vector<Event> result;
    for (auto it = lower; it != sortedEvents.end() && it->timestamp == timestamp; ++it) {
        result.push_back(*it);
    }
    return result;
}

std::vector<Event> searchByRange(const std::vector<Event> &sortedEvents, long long start, long long end) {
    if (start > end) std::swap(start, end);
    auto lower = std::lower_bound(sortedEvents.begin(), sortedEvents.end(), start,
                                  [](const Event &e, long long value) { return e.timestamp < value; });
    auto upper = std::upper_bound(sortedEvents.begin(), sortedEvents.end(), end,
                                  [](long long value, const Event &e) { return value < e.timestamp; });
    return std::vector<Event>(lower, upper);
}
