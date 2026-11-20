#include "min_heap.hpp"

#include "merge_sort.hpp"
#include <algorithm>

bool MinHeap::less(const HeapEntry &a, const HeapEntry &b) {
    if (a.event.timestamp != b.event.timestamp) {
        return a.event.timestamp < b.event.timestamp;
    }
    return a.sequence < b.sequence;
}

bool MinHeap::empty() const {
    return data.empty();
}

std::size_t MinHeap::size() const {
    return data.size();
}

void MinHeap::push(const Event &event, std::size_t streamIndex) {
    HeapEntry entry;
    entry.event = event;
    entry.streamIndex = streamIndex;
    entry.sequence = nextSequence++;
    data.push_back(entry);
    heapifyUp(data.size() - 1);
}

void MinHeap::pop() {
    if (data.empty()) return;
    data[0] = data.back();
    data.pop_back();
    if (!data.empty()) heapifyDown(0);
}

const HeapEntry &MinHeap::top() const {
    return data.front();
}

void MinHeap::heapifyUp(std::size_t index) {
    while (index > 0) {
        std::size_t parent = (index - 1) / 2;
        if (less(data[index], data[parent])) {
            std::swap(data[index], data[parent]);
            index = parent;
        } else {
            break;
        }
    }
}

void MinHeap::heapifyDown(std::size_t index) {
    std::size_t n = data.size();
    while (true) {
        std::size_t smallest = index;
        std::size_t left = 2 * index + 1;
        std::size_t right = 2 * index + 2;
        if (left < n && less(data[left], data[smallest])) smallest = left;
        if (right < n && less(data[right], data[smallest])) smallest = right;
        if (smallest == index) break;
        std::swap(data[index], data[smallest]);
        index = smallest;
    }
}

std::vector<Event> mergeStreamsWithHeap(std::vector<std::vector<Event>> streams) {
    for (auto &stream : streams) {
        mergeSort(stream);
    }

    MinHeap heap;
    std::vector<std::size_t> index(streams.size(), 0);

    for (std::size_t i = 0; i < streams.size(); ++i) {
        if (!streams[i].empty()) {
            heap.push(streams[i][0], i);
            index[i] = 1;
        }
    }

    std::vector<Event> merged;
    while (!heap.empty()) {
        const HeapEntry &entry = heap.top();
        Event nextEvent = entry.event;
        std::size_t s = entry.streamIndex;
        heap.pop();
        merged.push_back(nextEvent);

        if (index[s] < streams[s].size()) {
            heap.push(streams[s][index[s]++], s);
        }
    }

    return merged;
}
