#include "merge_sort.hpp"
#include <iostream>
#include <vector>

static bool check(bool condition, const char *message) {
    if (!condition) std::cerr << "FAIL: " << message << '\n';
    return condition;
}

int main() {
    bool ok = true;

    std::vector<Event> empty;
    mergeSort(empty);
    ok = check(empty.empty(), "empty input stays empty") && ok;

    std::vector<Event> single{{1, 100, "A", "one"}};
    mergeSort(single);
    ok = check(single.size() == 1 && single[0].id == 1, "single event unchanged") && ok;

    std::vector<Event> events{{4, 40, "A", "d"}, {1, 10, "B", "a"}, {3, 30, "C", "c"},
                              {2, 20, "D", "b"}};
    mergeSort(events);
    for (std::size_t i = 1; i < events.size(); ++i) {
        ok = check(events[i - 1].timestamp <= events[i].timestamp,
                   "timestamps sorted ascending") && ok;
    }
    ok = check(events.front().id == 1 && events.back().id == 4, "sort order by timestamp") && ok;

    std::vector<Event> equal{{10, 50, "A", "first"}, {11, 50, "B", "second"},
                             {12, 50, "C", "third"}};
    mergeSort(equal);
    ok = check(equal[0].id == 10 && equal[1].id == 11 && equal[2].id == 12,
               "equal timestamps preserve input order") && ok;

    std::vector<Event> a{{1, 10, "A", "a"}, {3, 30, "A", "c"}};
    std::vector<Event> b{{2, 20, "B", "b"}, {4, 40, "B", "d"}};
    std::vector<Event> merged = mergeSorted(a, b);
    ok = check(merged.size() == 4, "merge keeps all events") && ok;
    for (std::size_t i = 1; i < merged.size(); ++i) {
        ok = check(merged[i - 1].timestamp <= merged[i].timestamp, "merge is sorted") && ok;
    }

    if (ok) std::cout << "test_sort passed\n";
    return ok ? 0 : 1;
}
