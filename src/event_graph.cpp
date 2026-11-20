#include "event_graph.hpp"
#include <fstream>
#include <queue>
#include <set>
#include <sstream>
#include <stack>

void EventGraph::addEdge(int from, int to) {
    adj_[from].push_back(to);
    adj_[to]; // ensure target nodes exist in the adjacency map
}

bool EventGraph::loadFromFile(const std::string &filename) {
    std::ifstream file(filename);
    if (!file.is_open()) return false;

    std::string line;
    bool first = true;
    while (std::getline(file, line)) {
        if (line.empty()) continue;
        if (first) {
            first = false;
            if (line.find("from") != std::string::npos) continue;
        }
        std::stringstream ss(line);
        std::string fromText, toText;
        if (!std::getline(ss, fromText, ',') || !std::getline(ss, toText, ',')) continue;
        try {
            int from = std::stoi(fromText);
            int to = std::stoi(toText);
            addEdge(from, to);
        } catch (...) {
            continue;
        }
    }
    return true;
}

std::vector<int> EventGraph::bfs(int start) const {
    std::vector<int> order;
    auto it = adj_.find(start);
    if (it == adj_.end()) return order;

    std::set<int> visited;
    std::queue<int> pending;

    visited.insert(start);
    pending.push(start);

    while (!pending.empty()) {
        int current = pending.front();
        pending.pop();
        order.push_back(current);

        auto neighbours = adj_.find(current);
        if (neighbours == adj_.end()) continue;
        for (int next : neighbours->second) {
            if (visited.insert(next).second) {
                pending.push(next);
            }
        }
    }
    return order;
}

std::vector<int> EventGraph::dfs(int start) const {
    std::vector<int> order;
    auto it = adj_.find(start);
    if (it == adj_.end()) return order;

    std::set<int> visited;
    std::stack<int> pending;

    pending.push(start);

    while (!pending.empty()) {
        int current = pending.top();
        pending.pop();
        if (!visited.insert(current).second) continue;
        order.push_back(current);

        auto neighbours = adj_.find(current);
        if (neighbours == adj_.end()) continue;
        for (auto rit = neighbours->second.rbegin(); rit != neighbours->second.rend(); ++rit) {
            if (visited.find(*rit) == visited.end()) {
                pending.push(*rit);
            }
        }
    }
    return order;
}

bool EventGraph::empty() const {
    return adj_.empty();
}

const std::unordered_map<int, std::vector<int>> &EventGraph::adjacency() const {
    return adj_;
}
