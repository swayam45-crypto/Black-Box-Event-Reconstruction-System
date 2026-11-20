cmake_minimum_required(VERSION 3.16)

project(ChronoTrace LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(chronotrace
    src/main.cpp
    src/event.cpp
    src/file_handler.cpp
    src/merge_sort.cpp
    src/min_heap.cpp
    src/search.cpp
    src/validation.cpp
    src/event_graph.cpp
    src/report.cpp
)

target_include_directories(chronotrace PRIVATE include)

enable_testing()

add_executable(test_sort tests/test_sort.cpp src/event.cpp src/merge_sort.cpp)
target_include_directories(test_sort PRIVATE include)
add_test(NAME test_sort COMMAND test_sort)

add_executable(test_search tests/test_search.cpp src/event.cpp src/search.cpp src/merge_sort.cpp)
target_include_directories(test_search PRIVATE include)
add_test(NAME test_search COMMAND test_search)

add_executable(test_validation tests/test_validation.cpp src/event.cpp src/validation.cpp)
target_include_directories(test_validation PRIVATE include)
add_test(NAME test_validation COMMAND test_validation)
