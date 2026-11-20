#ifndef MERGE_SORT_HPP
#define MERGE_SORT_HPP

#include "event.hpp"
#include <vector>

void mergeSort(std::vector<Event> &arr);
std::vector<Event> mergeSorted(const std::vector<Event> &a, const std::vector<Event> &b);
std::vector<Event> mergeMany(std::vector<std::vector<Event>> streams);

#endif
