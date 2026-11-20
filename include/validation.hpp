#ifndef VALIDATION_HPP
#define VALIDATION_HPP

#include "event.hpp"
#include <vector>
#include <utility>

struct ValidationResult {
    std::vector<int> duplicateIds;
    std::vector<long long> repeatedTimestamps;
    std::vector<std::pair<int, int>> idGaps;
    bool ok() const;
};

std::vector<Event> removeDuplicates(const std::vector<Event> &events);
bool validateFields(const Event &event);
ValidationResult validateEvents(const std::vector<Event> &events);

#endif
