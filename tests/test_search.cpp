#include "search.hpp"
#include <iostream>
#include <vector>

static bool check(bool condition, const char *message) {
    if (!condition) std::cerr << "FAIL: " << message << '\n';
    return condition;
}

int main() {
    bool ok = true;
    std::vector<Event> events{{1, 10, "A", "a"}, {2, 20, "B", "b"}, {3, 20, "C", "c"},
                              {4, 30, "D", "d"}};

    const Event *found = searchById(events, 3);
    ok = check(found != nullptr && found->description == "c", "linear search by ID") && ok;
    ok = check(searchById(events, 99) == nullptr, "missing ID returns null") && ok;

    std::vector<Event> sameTime = searchByTimestamp(events, 20);
    ok = check(sameTime.size() == 2, "binary search finds all events at timestamp") && ok;

    std::vector<Event> range = searchByRange(events, 15, 30);
    ok = check(range.size() == 3, "inclusive time range") && ok;

    std::vector<Event> reversed = searchByRange(events, 30, 15);
    ok = check(reversed.size() == 3, "reversed range is normalized") && ok;

    std::vector<Event> none = searchByRange(events, 100, 200);
    ok = check(none.empty(), "empty range returns no events") && ok;

    if (ok) std::cout << "test_search passed\n";
    return ok ? 0 : 1;
}
