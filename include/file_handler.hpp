#ifndef FILE_HANDLER_HPP
#define FILE_HANDLER_HPP

#include "event.hpp"
#include <vector>
#include <string>

std::vector<Event> loadEvents(const std::string &filename);
void saveTimeline(const std::string &filename, const std::vector<Event> &events);

#endif
