#include "merge_sort.hpp"

static void mergeArr(std::vector<Event> &arr, int l, int m, int r) {
    int n1 = m - l + 1;
    int n2 = r - m;
    std::vector<Event> L(n1), R(n2);
    for (int i = 0; i < n1; i++) L[i] = arr[l + i];
    for (int j = 0; j < n2; j++) R[j] = arr[m + 1 + j];
    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        if (L[i].timestamp <= R[j].timestamp) arr[k++] = L[i++];
        else arr[k++] = R[j++];
    }
    while (i < n1) arr[k++] = L[i++];
    while (j < n2) arr[k++] = R[j++];
}

static void msort(std::vector<Event> &arr, int l, int r) {
    if (l < r) {
        int m = l + (r - l) / 2;
        msort(arr, l, m);
        msort(arr, m + 1, r);
        mergeArr(arr, l, m, r);
    }
}

void mergeSort(std::vector<Event> &arr) {
    if (arr.size() > 1) msort(arr, 0, (int)arr.size() - 1);
}

std::vector<Event> mergeSorted(const std::vector<Event> &a, const std::vector<Event> &b) {
    std::vector<Event> out;
    out.reserve(a.size() + b.size());
    std::size_t i = 0, j = 0;
    while (i < a.size() && j < b.size()) {
        if (a[i].timestamp <= b[j].timestamp) out.push_back(a[i++]);
        else out.push_back(b[j++]);
    }
    while (i < a.size()) out.push_back(a[i++]);
    while (j < b.size()) out.push_back(b[j++]);
    return out;
}

std::vector<Event> mergeMany(std::vector<std::vector<Event>> streams) {
    for (auto &stream : streams) mergeSort(stream);
    if (streams.empty()) return {};
    while (streams.size() > 1) {
        std::vector<std::vector<Event>> next;
        next.reserve((streams.size() + 1) / 2);
        for (std::size_t i = 0; i < streams.size(); i += 2) {
            if (i + 1 < streams.size()) next.push_back(mergeSorted(streams[i], streams[i + 1]));
            else next.push_back(std::move(streams[i]));
        }
        streams = std::move(next);
    }
    return streams.front();
}
