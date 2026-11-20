#ifndef EVENT_GRAPH_HPP
#define EVENT_GRAPH_HPP

#include <string>
#include <unordered_map>
#include <vector>

class EventGraph {
public:
    void addEdge(int from, int to);
    bool loadFromFile(const std::string &filename);
    std::vector<int> bfs(int start) const;
    std::vector<int> dfs(int start) const;
    bool empty() const;
    const std::unordered_map<int, std::vector<int>> &adjacency() const;

private:
    std::unordered_map<int, std::vector<int>> adj_;
};

#endif
