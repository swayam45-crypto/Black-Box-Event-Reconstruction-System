#ifndef EVENT_HPP
#define EVENT_HPP

#include <string>

struct Event {
    int id;
    long long timestamp;
    std::string source;
    std::string description;
};

#endif
