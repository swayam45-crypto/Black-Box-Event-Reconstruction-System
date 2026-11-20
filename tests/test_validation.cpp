#include "validation.hpp"
#include <iostream>
#include <vector>

static bool check(bool condition, const char *message) {
    if (!condition) std::cerr << "FAIL: " << message << '\n';
    return condition;
}

int main() {
    bool ok = true;

    std::vector<Event> valid{{1, 10, "A", "a"}, {2, 20, "B", "b"}, {3, 30, "C", "c"}};
    ValidationResult clean = validateEvents(valid);
    ok = check(clean.ok(), "valid events pass validation") && ok;

    std::vector<Event> duplicates{{1, 10, "A", "a"}, {1, 20, "B", "b"}, {1, 30, "C", "c"}};
    ValidationResult dup = validateEvents(duplicates);
    ok = check(dup.duplicateIds.size() == 1 && dup.duplicateIds[0] == 1,
               "duplicate IDs detected once") && ok;
    std::vector<Event> unique = removeDuplicates(duplicates);
    ok = check(unique.size() == 1, "removeDuplicates keeps first occurrence") && ok;

    std::vector<Event> repeated{{1, 10, "A", "a"}, {2, 10, "B", "b"}, {3, 30, "C", "c"}};
    ValidationResult rep = validateEvents(repeated);
    ok = check(rep.repeatedTimestamps.size() == 1 && rep.repeatedTimestamps[0] == 10,
               "repeated timestamp detected") && ok;

    std::vector<Event> gap{{1, 10, "A", "a"}, {4, 20, "B", "b"}};
    ValidationResult gapped = validateEvents(gap);
    ok = check(gapped.idGaps.size() == 1 && gapped.idGaps[0].first == 1 &&
                   gapped.idGaps[0].second == 4,
               "ID gap detected") && ok;

    ok = check(!validateFields(Event{0, 10, "A", "a"}), "non-positive ID invalid") && ok;
    ok = check(!validateFields(Event{1, 0, "A", "a"}), "non-positive timestamp invalid") && ok;
    ok = check(!validateFields(Event{1, 10, "", "a"}), "empty source invalid") && ok;
    ok = check(!validateFields(Event{1, 10, "A", ""}), "empty description invalid") && ok;

    if (ok) std::cout << "test_validation passed\n";
    return ok ? 0 : 1;
}
