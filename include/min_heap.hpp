#ifndef MIN_HEAP_HPP
#define MIN_HEAP_HPP

#include "event.hpp"
#include <vector>

struct HeapEntry {
    Event event;
    std::size_t streamIndex;
    long long sequence;
};

class MinHeap {
public:
    MinHeap() = default;

    bool empty() const;
    std::size_t size() const;
    void push(const Event &event, std::size_t streamIndex);
    void pop();
    const HeapEntry &top() const;

private:
    std::vector<HeapEntry> data;
    long long nextSequence = 0;

    void heapifyUp(std::size_t index);
    void heapifyDown(std::size_t index);
    static bool less(const HeapEntry &a, const HeapEntry &b);
};

std::vector<Event> mergeStreamsWithHeap(std::vector<std::vector<Event>> streams);

#endif
