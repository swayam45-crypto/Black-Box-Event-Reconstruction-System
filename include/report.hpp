#ifndef REPORT_HPP
#define REPORT_HPP

#include "event.hpp"
#include "event_graph.hpp"
#include "validation.hpp"
#include <string>
#include <vector>

void printTimeline(const std::vector<Event> &events);
void printValidation(const ValidationResult &result);
void writeAnalysisReport(const std::string &filename, const std::vector<Event> &allEvents,
                         const std::vector<Event> &timeline, const ValidationResult &result,
                         const EventGraph &graph);

#endif
