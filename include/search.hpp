#ifndef SEARCH_HPP
#define SEARCH_HPP

#include "event.hpp"
#include <vector>

const Event *searchById(const std::vector<Event> &events, int id);
std::vector<Event> searchByTimestamp(const std::vector<Event> &sortedEvents, long long timestamp);
std::vector<Event> searchByRange(const std::vector<Event> &sortedEvents, long long start, long long end);

#endif
