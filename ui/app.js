const $ = (id) => document.getElementById(id);

const SAMPLE_EVENTS_CSV = `id,timestamp,source,description
104,1792900805,ENGINE,Engine reading recorded
101,1792900801,SENSOR,Monitoring started
103,1792900803,CABIN,Pressure warning
102,1792900802,FLIGHT,Altitude reading
105,1792900807,COMM,Signal lost
`;

const SAMPLE_DEPENDENCIES_CSV = `from,to
101,102
102,103
103,104
104,105
201,202
202,203
`;

const VIEW_META = {
    load: {
        title: "Load event log",
        subtitle: "Import a CSV file or use the sample dataset.",
    },
    original: {
        title: "Original events",
        subtitle: "Records exactly as loaded, before reconstruction.",
    },
    timeline: {
        title: "Reconstruct timeline",
        subtitle: "Stable Merge Sort by timestamp, O(n log n).",
    },
    "search-id": {
        title: "Search by ID",
        subtitle: "Linear search across the loaded records, O(n).",
    },
    "search-range": {
        title: "Search time range",
        subtitle: "Inclusive range using binary search, O(log n + m).",
    },
    validate: {
        title: "Validate records",
        subtitle: "Duplicate IDs, repeated timestamps, and possible ID gaps.",
    },
    merge: {
        title: "Merge sources",
        subtitle: "Sort each stream, then merge pairwise without a heap.",
    },
    graph: {
        title: "Dependencies",
        subtitle: "Explicit dependency edges explored with BFS and DFS.",
    },
    export: {
        title: "Export timeline",
        subtitle: "Download the reconstructed timeline as CSV.",
    },
    report: {
        title: "Analysis report",
        subtitle: "Dataset totals, validation details, timeline, and edges.",
    },
};

const state = {
    events: [],
    timeline: [],
    graph: new Map(),
    edges: [],
    report: "",
    mergeFiles: [],
    sourceColors: new Map(),
};

const SIGNAL_LOSS_PATTERN =
    /\b(signal|communication|comm|radio|telemetry|transponder|gps|link)\b[^.]*\b(lost|lose|loses|loss|down|failed|failure|interrupted|interrupt|disconnected|disconnect|dropped|drop)\b|\b(lost|lose|loses|loss|down|failed|failure|interrupted|interrupt|disconnected|disconnect|dropped|drop)\b[^.]*\b(signal|communication|comm|radio|telemetry|transponder|gps|link)\b/i;

const SOURCE_PALETTE = [
    "#37d5c8",
    "#5aa9ff",
    "#f2b84b",
    "#ff7eb6",
    "#9d8cff",
    "#5ee0a0",
    "#ff9f5a",
    "#7bd1ff",
];

const colorForSource = (source) => {
    if (!state.sourceColors.has(source)) {
        state.sourceColors.set(
            source,
            SOURCE_PALETTE[state.sourceColors.size % SOURCE_PALETTE.length]
        );
    }
    return state.sourceColors.get(source);
};

const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (character) => {
        const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
        return map[character];
    });

const parseInteger = (value) => {
    const text = String(value).trim();
    if (!/^-?\d+$/.test(text)) return null;
    const number = Number(text);
    return Number.isSafeInteger(number) ? number : null;
};

const parseCsv = (text) => {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
        const character = text[index];
        if (inQuotes) {
            if (character === '"') {
                if (text[index + 1] === '"') {
                    field += '"';
                    index += 1;
                } else {
                    inQuotes = false;
                }
            } else {
                field += character;
            }
        } else if (character === '"') {
            inQuotes = true;
        } else if (character === ",") {
            row.push(field);
            field = "";
        } else if (character === "\n") {
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        } else if (character !== "\r") {
            field += character;
        }
    }

    row.push(field);
    rows.push(row);
    return rows;
};

const parseEvents = (text) => {
    const rows = parseCsv(text.replace(/^\uFEFF/, ""));
    const events = [];
    const errors = [];

    rows.forEach((row, index) => {
        if (row.every((cell) => !cell.trim())) return;
        if (row[0].trim().toLowerCase() === "id") return;
        if (row.length < 4) {
            errors.push(`Row ${index + 1}: expected 4 fields, found ${row.length}.`);
            return;
        }
        const id = parseInteger(row[0]);
        const timestamp = parseInteger(row[1]);
        const source = row[2].trim();
        const description = row[3].trim();
        if (id === null || timestamp === null) {
            errors.push(`Row ${index + 1}: id and timestamp must be integers.`);
            return;
        }
        if (id <= 0 || timestamp <= 0 || !source || !description) {
            errors.push(`Row ${index + 1}: invalid event fields.`);
            return;
        }
        events.push({ id, timestamp, source, description });
    });

    return { events, errors };
};

const parseDependencies = (text) => {
    const rows = parseCsv(text.replace(/^\uFEFF/, ""));
    const edges = [];
    const errors = [];

    rows.forEach((row, index) => {
        if (row.every((cell) => !cell.trim())) return;
        if (row[0].trim().toLowerCase() === "from") return;
        if (row.length < 2) {
            errors.push(`Row ${index + 1}: expected from and to columns.`);
            return;
        }
        const from = parseInteger(row[0]);
        const to = parseInteger(row[1]);
        if (from === null || to === null || from <= 0 || to <= 0) {
            errors.push(`Row ${index + 1}: dependency IDs must be positive integers.`);
            return;
        }
        edges.push([from, to]);
    });

    return { edges, errors };
};

const mergeSorted = (left, right) => {
    const merged = [];
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
        if (left[i].timestamp <= right[j].timestamp) merged.push(left[i++]);
        else merged.push(right[j++]);
    }
    while (i < left.length) merged.push(left[i++]);
    while (j < right.length) merged.push(right[j++]);
    return merged;
};

const mergeSort = (events) => {
    if (events.length <= 1) return events.slice();
    const middle = Math.floor(events.length / 2);
    return mergeSorted(mergeSort(events.slice(0, middle)), mergeSort(events.slice(middle)));
};

const mergeMany = (streams) => {
    if (!streams.length) return [];
    let pending = streams.map((stream) => mergeSort(stream));
    while (pending.length > 1) {
        const next = [];
        for (let index = 0; index < pending.length; index += 2) {
            if (index + 1 < pending.length) {
                next.push(mergeSorted(pending[index], pending[index + 1]));
            } else {
                next.push(pending[index]);
            }
        }
        pending = next;
    }
    return pending[0];
};

const lowerBound = (events, value) => {
    let low = 0;
    let high = events.length;
    while (low < high) {
        const middle = (low + high) >> 1;
        if (events[middle].timestamp < value) low = middle + 1;
        else high = middle;
    }
    return low;
};

const upperBound = (events, value) => {
    let low = 0;
    let high = events.length;
    while (low < high) {
        const middle = (low + high) >> 1;
        if (events[middle].timestamp <= value) low = middle + 1;
        else high = middle;
    }
    return low;
};

const validateEvents = (events) => {
    const idCounts = new Map();
    const timestampCounts = new Map();
    events.forEach((event) => {
        idCounts.set(event.id, (idCounts.get(event.id) || 0) + 1);
        timestampCounts.set(event.timestamp, (timestampCounts.get(event.timestamp) || 0) + 1);
    });

    const duplicateIds = [...idCounts.entries()]
        .filter(([, count]) => count > 1)
        .map(([id]) => id)
        .sort((a, b) => a - b);
    const repeatedTimestamps = [...timestampCounts.entries()]
        .filter(([, count]) => count > 1)
        .map(([timestamp]) => timestamp)
        .sort((a, b) => a - b);

    const ids = [...idCounts.keys()].sort((a, b) => a - b);
    const idGaps = [];
    for (let index = 1; index < ids.length; index += 1) {
        if (ids[index] - ids[index - 1] > 1) idGaps.push([ids[index - 1], ids[index]]);
    }

    return { duplicateIds, repeatedTimestamps, idGaps };
};

const buildGraph = (edges) => {
    const graph = new Map();
    edges.forEach(([from, to]) => {
        if (!graph.has(from)) graph.set(from, []);
        if (!graph.has(to)) graph.set(to, []);
        if (!graph.get(from).includes(to)) graph.get(from).push(to);
    });
    return graph;
};

const bfs = (start) => {
    if (!state.graph.has(start)) return [];
    const order = [];
    const visited = new Set([start]);
    const queue = [start];
    while (queue.length) {
        const current = queue.shift();
        order.push(current);
        (state.graph.get(current) || []).forEach((neighbour) => {
            if (!visited.has(neighbour)) {
                visited.add(neighbour);
                queue.push(neighbour);
            }
        });
    }
    return order;
};

const dfs = (start) => {
    if (!state.graph.has(start)) return [];
    const order = [];
    const visited = new Set();
    const stack = [start];
    while (stack.length) {
        const current = stack.pop();
        if (visited.has(current)) continue;
        visited.add(current);
        order.push(current);
        const neighbours = state.graph.get(current) || [];
        for (let index = neighbours.length - 1; index >= 0; index -= 1) {
            if (!visited.has(neighbours[index])) stack.push(neighbours[index]);
        }
    }
    return order;
};

const ensureTimeline = () => {
    if (!state.timeline.length && state.events.length) state.timeline = mergeSort(state.events);
    return state.timeline;
};

const renderTable = (container, events, emptyMessage) => {
    if (!events || !events.length) {
        container.innerHTML = `<p class="empty">${escapeHtml(emptyMessage)}</p>`;
        return;
    }
    const rows = events
        .map(
            (event) => `<tr>
                <td class="mono">${event.id}</td>
                <td class="mono">${event.timestamp}</td>
                <td><span class="badge">${escapeHtml(event.source)}</span></td>
                <td>${escapeHtml(event.description)}</td>
            </tr>`
        )
        .join("");
    container.innerHTML = `<table>
        <thead><tr><th>ID</th><th>Timestamp</th><th>Source</th><th>Description</th></tr></thead>
        <tbody>${rows}</tbody>
    </table>`;
};

const truncate = (text, limit) => (text.length > limit ? `${text.slice(0, limit - 3)}...` : text);

const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    if (Number.isNaN(date.getTime())) return String(timestamp);
    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
};

const formatSpan = (seconds) => {
    const span = Math.abs(seconds);
    if (span < 60) return `${span}s`;
    if (span < 3600) return `${Math.floor(span / 60)}m ${span % 60}s`;
    if (span < 86400) return `${Math.floor(span / 3600)}h ${Math.floor((span % 3600) / 60)}m`;
    return `${Math.floor(span / 86400)}d ${Math.floor((span % 86400) / 3600)}h`;
};

const renderFlowGraph = (svgId, legendId, noteId, events) => {
    const svg = $(svgId);
    const legend = $(legendId);
    const note = $(noteId);
    legend.innerHTML = "";

    if (!events.length) {
        svg.style.width = "100%";
        svg.setAttribute("viewBox", "0 0 900 360");
        svg.innerHTML =
            '<text class="flow-empty" x="450" y="180">No events connected yet.</text>';
        note.textContent = "Reconstruct or merge events to visualize the flow.";
        return;
    }

    const count = events.length;
    const height = 360;
    const padding = 90;
    const width = Math.max(900, padding * 2 + (count - 1) * 150);
    const step = count > 1 ? (width - padding * 2) / (count - 1) : 0;
    const centerY = 190;
    const amplitude = 34;
    const positions = events.map((event, index) => [
        padding + step * index,
        centerY + (index % 2 === 0 ? -amplitude : amplitude),
    ]);
    const colors = events.map((event) => colorForSource(event.source));

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.style.width = `${width}px`;

    const markerId = `${svgId}Arrow`;
    const parts = [
        `<defs><marker id="${markerId}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#6b91b5"></path></marker></defs>`,
    ];

    for (let index = 0; index < count - 1; index += 1) {
        const [x1, y1] = positions[index];
        const [x2, y2] = positions[index + 1];
        const startX = x1 + 36;
        const endX = x2 - 38;
        const delta = endX - startX;
        const path = `M ${startX.toFixed(1)} ${y1.toFixed(1)} C ${(startX + delta * 0.35).toFixed(1)} ${y1.toFixed(1)}, ${(endX - delta * 0.35).toFixed(1)} ${y2.toFixed(1)}, ${endX.toFixed(1)} ${y2.toFixed(1)}`;
        const color = colors[index + 1];
        const delay = (index * 0.07).toFixed(2);
        parts.push(
            `<path class="flow-edge-glow" d="${path}" stroke="${color}" style="--delay:${delay}s"></path>`
        );
        parts.push(
            `<path class="flow-edge" d="${path}" stroke="${color}" marker-end="url(#${markerId})" style="--delay:${delay}s"></path>`
        );
    }

    events.forEach((event, index) => {
        const [x, y] = positions[index];
        const color = colors[index];
        const time = formatTime(event.timestamp);
        const source = escapeHtml(truncate(event.source, 16));
        const description = escapeHtml(truncate(event.description, 24));
        const title = escapeHtml(
            `Event ${event.id} | ${event.source} | ${event.timestamp} | ${event.description}`
        );
        const delay = (0.15 + index * 0.08).toFixed(2);
        parts.push(
            `<g class="flow-node" style="--delay:${delay}s" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">` +
                `<title>${title}</title>` +
                `<circle class="node-halo" cx="0" cy="0" r="37" fill="${color}"></circle>` +
                `<circle class="node-core" cx="0" cy="0" r="25" stroke="${color}"></circle>` +
                `<text class="node-id" x="0" y="1">${event.id}</text>` +
                `<text class="node-time" x="0" y="-46">${time}</text>` +
                `<text class="node-source" x="0" y="49" fill="${color}">${source}</text>` +
                `<text class="node-description" x="0" y="65">${description}</text>` +
                "</g>"
        );
    });

    svg.innerHTML = parts.join("");

    const sources = [...new Set(events.map((event) => event.source))];
    legend.innerHTML = sources
        .map(
            (source) =>
                `<span class="legend-item"><span class="legend-dot" style="background:${colorForSource(source)}"></span>${escapeHtml(source)}</span>`
        )
        .join("");

    const span = events[count - 1].timestamp - events[0].timestamp;
    note.textContent = `${count} event${count === 1 ? "" : "s"} connected across ${sources.length} source${sources.length === 1 ? "" : "s"}, spanning ${formatSpan(span)}.`;
};

let toastTimer = null;
const showToast = (message, type = "success") => {
    const toast = $("toast");
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.className = "toast";
    }, 3200);
};

const animateValue = (element, target) => {
    const previous = Number(element.dataset.value ?? element.textContent ?? 0) || 0;
    element.dataset.value = String(target);
    if (previous === target) {
        element.textContent = String(target);
        return;
    }
    const run = (element.counterAnimation = (element.counterAnimation || 0) + 1);
    const start = performance.now();
    const duration = 520;
    const tick = (now) => {
        if (element.counterAnimation !== run) return;
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = String(Math.round(previous + (target - previous) * eased));
        if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};

const updateDataset = () => {
    const count = state.events.length;
    const sources = new Set(state.events.map((event) => event.source));
    const sorted = [...state.events].sort((a, b) => a.timestamp - b.timestamp);

    animateValue($("statEvents"), count);
    animateValue($("statSources"), sources.size);
    $("statEarliest").textContent = sorted.length ? String(sorted[0].timestamp) : "-";
    $("statLatest").textContent = sorted.length ? String(sorted[sorted.length - 1].timestamp) : "-";
    $("datasetBadge").textContent = `${count} event${count === 1 ? "" : "s"}`;

    const dot = $("statusDot");
    const status = $("statusText");
    if (count) {
        dot.className = "dot live";
        status.textContent = `${count} event${count === 1 ? "" : "s"} loaded`;
        $("loadNote").textContent = "Dataset ready. Reconstruction and analysis are available.";
    } else {
        dot.className = "dot";
        status.textContent = "No data loaded";
        $("loadNote").textContent = "Upload a file to populate the dataset.";
    }
    renderTable($("loadPreview"), state.events, "No dataset loaded yet.");
};

const loadEventsText = (text, label) => {
    const { events, errors } = parseEvents(text);
    if (!events.length) {
        showToast(errors[0] || "No valid events found in the file.", "error");
        return;
    }
    state.events = events;
    state.timeline = [];
    state.report = "";
    updateDataset();
    renderFlowGraph("timelineSvg", "timelineLegend", "timelineGraphNote", []);
    renderFlowGraph("mergeSvg", "mergeLegend", "mergeGraphNote", []);
    showToast(`Loaded ${events.length} event(s) from ${label}.`);
    if (errors.length) showToast(`${errors.length} row(s) skipped: ${errors[0]}`, "error");
};

const loadDependencyText = (text, label) => {
    const { edges, errors } = parseDependencies(text);
    if (!edges.length) {
        showToast(errors[0] || "No dependency edges found.", "error");
        return;
    }
    state.edges = edges;
    state.graph = buildGraph(edges);
    drawGraph([]);
    renderAdjacency();
    $("traversalResult").className = "result-box muted";
    $("traversalResult").textContent = `Loaded ${edges.length} edge(s) from ${label}.`;
    showToast(`Loaded ${edges.length} dependency edge(s).`);
    if (errors.length) showToast(`${errors.length} row(s) skipped: ${errors[0]}`, "error");
};

const showView = (view) => {
    const meta = VIEW_META[view] || VIEW_META.load;
    document.querySelectorAll(".view").forEach((section) => {
        section.classList.toggle("active", section.id === `view-${view}`);
    });
    document.querySelectorAll(".nav-item").forEach((button) => {
        button.classList.toggle("active", button.dataset.view === view);
    });
    $("viewTitle").textContent = meta.title;
    $("viewSubtitle").textContent = meta.subtitle;

    if (view === "original") renderTable($("originalTable"), state.events, "No events loaded.");
    if (view === "timeline") {
        renderTable($("timelineTable"), state.timeline, "Click Reconstruct to build the timeline.");
        renderFlowGraph("timelineSvg", "timelineLegend", "timelineGraphNote", state.timeline);
    }
    if (view === "export") {
        const timeline = ensureTimeline();
        renderTable($("exportPreview"), timeline.slice(0, 60), "No events loaded.");
    }
    if (view === "report" && state.report) $("reportOutput").textContent = state.report;
};

const renderAdjacency = () => {
    const container = $("adjacencyTable");
    if (!state.graph.size) {
        container.innerHTML = '<p class="empty">No dependency edges loaded.</p>';
        return;
    }
    const rows = [...state.graph.keys()]
        .sort((a, b) => a - b)
        .map((source) => {
            const targets = state.graph.get(source) || [];
            const targetMarkup = targets.length
                ? targets.map((target) => `<span class="chip">${target}</span>`).join(" ")
                : '<span class="muted">(none)</span>';
            return `<tr><td class="mono">${source}</td><td>${targetMarkup}</td></tr>`;
        })
        .join("");
    container.innerHTML = `<table>
        <thead><tr><th>Event</th><th>Depends on / leads to</th></tr></thead>
        <tbody>${rows}</tbody>
    </table>`;
};

const drawGraph = (highlight = []) => {
    const svg = $("graphSvg");
    if (!state.graph.size) {
        svg.innerHTML =
            '<text x="320" y="210" fill="#8ea3bc" font-size="14" text-anchor="middle">No dependency edges loaded</text>';
        return;
    }

    const nodes = [...state.graph.keys()].sort((a, b) => a - b);
    const active = new Set(highlight);
    const width = 640;
    const height = 420;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = nodes.length > 1 ? 150 : 0;
    const positions = new Map();
    nodes.forEach((node, index) => {
        const angle = (2 * Math.PI * index) / nodes.length - Math.PI / 2;
        positions.set(node, [
            centerX + radius * Math.cos(angle),
            centerY + radius * Math.sin(angle),
        ]);
    });

    const parts = [
        '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#5f89ad"></path></marker></defs>',
    ];

    state.graph.forEach((targets, source) => {
        targets.forEach((target) => {
            const [x1, y1] = positions.get(source);
            const [x2, y2] = positions.get(target);
            const css = active.has(source) && active.has(target) ? "edge active" : "edge";
            parts.push(
                `<line class="${css}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" marker-end="url(#arrow)"></line>`
            );
        });
    });

    nodes.forEach((node) => {
        const [x, y] = positions.get(node);
        const event = state.events.find((item) => item.id === node);
        const color = event ? colorForSource(event.source) : "#5aa9ff";
        const isActive = active.has(node);
        const css = isActive ? "node active" : "node";
        const fill = isActive ? `${color}33` : "#142438";
        const stroke = isActive ? color : "#3d6286";
        const label = escapeHtml(
            event
                ? `${event.id} | ${event.source} | ${event.description}`
                : `Event ${node}`
        );
        parts.push(
            `<g class="${css}"><title>${label}</title><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="21" style="fill:${fill};stroke:${stroke}"></circle><text x="${x.toFixed(1)}" y="${y.toFixed(1)}">${node}</text></g>`
        );
    });

    svg.innerHTML = parts.join("");
};

const runTraversal = (kind) => {
    const start = parseInteger($("graphStart").value);
    if (start === null) {
        showToast("Enter a valid event ID to start traversal.", "error");
        return;
    }
    const order = kind === "bfs" ? bfs(start) : dfs(start);
    if (!order.length) {
        showToast(`Event ID ${start} has no dependency edges.`, "error");
        return;
    }
    drawGraph(order);
    const chips = order
        .map((node, index) => `<span class="chip ${index === 0 ? "start" : ""}">${node}</span>`)
        .join(" ");
    $("traversalResult").className = "result-box";
    $("traversalResult").innerHTML = `<p class="muted" style="margin:0 0 8px">${kind.toUpperCase()} order from ${start}</p><div class="chips">${chips}</div>`;
};

const renderValidation = () => {
    const result = validateEvents(state.events);
    const stats = [
        ["Duplicate IDs", result.duplicateIds.length],
        ["Repeated timestamps", result.repeatedTimestamps.length],
        ["Possible ID gaps", result.idGaps.length],
    ];
    $("validationStats").innerHTML = stats
        .map(
            ([label, value]) =>
                `<div class="stat ${value ? "bad" : "good"}"><span class="stat-label">${label}</span><strong data-target="${value}">0</strong></div>`
        )
        .join("");
    $("validationStats")
        .querySelectorAll("strong[data-target]")
        .forEach((element) => animateValue(element, Number(element.dataset.target)));

    const details = [];
    if (result.duplicateIds.length) {
        details.push(
            `<div><strong>Duplicate IDs</strong><div class="chips">${result.duplicateIds
                .map((id) => `<span class="chip">${id}</span>`)
                .join("")}</div></div>`
        );
    }
    if (result.repeatedTimestamps.length) {
        details.push(
            `<div><strong>Repeated timestamps</strong><div class="chips">${result.repeatedTimestamps
                .map((timestamp) => `<span class="chip">${timestamp}</span>`)
                .join("")}</div></div>`
        );
    }
    if (result.idGaps.length) {
        details.push(
            `<div><strong>Possible ID gaps</strong><div class="chips">${result.idGaps
                .map(([from, to]) => `<span class="chip">${from} -&gt; ${to}</span>`)
                .join("")}</div></div>`
        );
    }

    const box = $("validationDetails");
    if (!details.length) {
        box.className = "result-box";
        box.innerHTML =
            '<p class="empty" style="border-color:rgba(94,224,160,.35)">No data-quality issues detected.</p>';
    } else {
        box.className = "result-box";
        box.innerHTML = details.join("");
    }
};

const csvCell = (value) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const eventsToCsv = (events) => {
    const lines = ["id,timestamp,source,description"];
    events.forEach((event) => {
        lines.push(
            [event.id, event.timestamp, event.source, event.description].map(csvCell).join(",")
        );
    });
    return `${lines.join("\n")}\n`;
};

const downloadFile = (filename, content, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const buildReport = () => {
    const timeline = ensureTimeline();
    const validation = validateEvents(state.events);
    const lines = [];
    lines.push("ChronoTrace Analysis Report");
    lines.push("===========================");
    lines.push("");
    lines.push(`Loaded events: ${state.events.length}`);
    lines.push(`Timeline events: ${timeline.length}`);
    lines.push(`Duplicate IDs: ${validation.duplicateIds.length}`);
    lines.push(`Repeated timestamps: ${validation.repeatedTimestamps.length}`);
    lines.push(`Possible ID gaps: ${validation.idGaps.length}`);
    lines.push(`Dependency edges: ${state.edges.length}`);
    lines.push("");
    lines.push("Reconstructed timeline");
    lines.push("----------------------");
    if (timeline.length) {
        timeline.forEach((event) => {
            lines.push(`${event.timestamp}  [${event.id}]  ${event.source} : ${event.description}`);
        });
    } else {
        lines.push("No timeline generated.");
    }
    lines.push("");
    lines.push("Data-quality details");
    lines.push("--------------------");
    lines.push(
        `Duplicate IDs: ${validation.duplicateIds.join(", ") || "none"}`
    );
    lines.push(
        `Repeated timestamps: ${validation.repeatedTimestamps.join(", ") || "none"}`
    );
    lines.push(
        `Possible ID gaps: ${validation.idGaps.map(([a, b]) => `${a}->${b}`).join(", ") || "none"}`
    );
    lines.push("");
    lines.push("Dependency graph (adjacency list)");
    lines.push("---------------------------------");
    if (!state.graph.size) {
        lines.push("No dependency edges loaded.");
    } else {
        [...state.graph.keys()]
            .sort((a, b) => a - b)
            .forEach((source) => {
                const targets = state.graph.get(source) || [];
                lines.push(`${source} -> ${targets.join(", ") || "(none)"}`);
            });
    }
    return `${lines.join("\n")}\n`;
};

const readFileText = async (file) => {
    try {
        return await file.text();
    } catch (error) {
        showToast(`Could not read ${file.name}.`, "error");
        return null;
    }
};

const setupDropzone = (zone, input, handler) => {
    ["dragenter", "dragover"].forEach((name) => {
        zone.addEventListener(name, (event) => {
            event.preventDefault();
            zone.classList.add("drag");
        });
    });
    ["dragleave", "drop"].forEach((name) => {
        zone.addEventListener(name, (event) => {
            event.preventDefault();
            zone.classList.remove("drag");
        });
    });
    zone.addEventListener("drop", (event) => {
        const files = [...(event.dataTransfer?.files || [])];
        if (files.length) handler(files);
    });
};

const initialize = () => {
    document.querySelectorAll(".nav-item").forEach((button) => {
        button.addEventListener("click", () => showView(button.dataset.view));
    });

    $("loadSample").addEventListener("click", () => {
        loadEventsText(SAMPLE_EVENTS_CSV, "the sample dataset");
    });

    $("eventFile").addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const text = await readFileText(file);
        if (text !== null) loadEventsText(text, file.name);
        event.target.value = "";
    });
    setupDropzone($("eventDrop"), $("eventFile"), async (files) => {
        const text = await readFileText(files[0]);
        if (text !== null) loadEventsText(text, files[0].name);
    });

    $("previewRefresh").addEventListener("click", () => {
        renderTable($("loadPreview"), state.events, "No dataset loaded yet.");
    });

    $("originalRefresh").addEventListener("click", () => {
        renderTable($("originalTable"), state.events, "No events loaded.");
    });

    $("reconstruct").addEventListener("click", () => {
        if (!state.events.length) {
            showToast("Load an event log first.", "error");
            return;
        }
        state.timeline = mergeSort(state.events);
        state.report = "";
        renderTable($("timelineTable"), state.timeline, "No events loaded.");
        renderFlowGraph("timelineSvg", "timelineLegend", "timelineGraphNote", state.timeline);
        showToast(`Reconstructed ${state.timeline.length} event(s).`);
    });

    $("searchIdButton").addEventListener("click", () => {
        const id = parseInteger($("searchIdInput").value);
        const box = $("searchIdResult");
        if (id === null) {
            showToast("Enter a valid event ID.", "error");
            return;
        }
        const found = state.events.find((event) => event.id === id);
        if (!found) {
            box.className = "result-box missing";
            box.textContent = `No event found with ID ${id}.`;
            return;
        }
        box.className = "result-box found";
        box.innerHTML = `<div class="result-line">
            <span><strong>ID</strong>${found.id}</span>
            <span><strong>Timestamp</strong><span class="mono">${found.timestamp}</span></span>
            <span><strong>Source</strong>${escapeHtml(found.source)}</span>
            <span><strong>Description</strong>${escapeHtml(found.description)}</span>
        </div>`;
    });

    $("searchIdInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") $("searchIdButton").click();
    });

    $("rangeButton").addEventListener("click", () => {
        const start = parseInteger($("rangeStart").value);
        const end = parseInteger($("rangeEnd").value);
        if (start === null || end === null) {
            showToast("Enter valid start and end timestamps.", "error");
            return;
        }
        const timeline = ensureTimeline();
        const low = Math.min(start, end);
        const high = Math.max(start, end);
        const matches = timeline.slice(lowerBound(timeline, low), upperBound(timeline, high));
        renderTable(
            $("rangeTable"),
            matches,
            `No events between ${low} and ${high}.`
        );
    });

    $("rangeBounds").addEventListener("click", () => {
        if (!state.events.length) {
            showToast("Load an event log first.", "error");
            return;
        }
        const bounds = state.events.reduce(
            (result, event) => ({
                min: Math.min(result.min, event.timestamp),
                max: Math.max(result.max, event.timestamp),
            }),
            { min: Infinity, max: -Infinity }
        );
        $("rangeStart").value = String(bounds.min);
        $("rangeEnd").value = String(bounds.max);
    });

    $("validateButton").addEventListener("click", () => {
        if (!state.events.length) {
            showToast("Load an event log first.", "error");
            return;
        }
        renderValidation();
        showToast("Validation complete.");
    });

    $("mergeFiles").addEventListener("change", (event) => {
        state.mergeFiles = [...(event.target.files || [])];
        $("mergeNote").textContent = state.mergeFiles.length
            ? `${state.mergeFiles.length} file(s) selected.`
            : "No files selected.";
    });
    setupDropzone($("mergeDrop"), $("mergeFiles"), (files) => {
        state.mergeFiles = files;
        $("mergeNote").textContent = `${files.length} file(s) selected.`;
    });

    $("mergeButton").addEventListener("click", async () => {
        const files = state.mergeFiles.length
            ? state.mergeFiles
            : [...($("mergeFiles").files || [])];
        if (!files.length) {
            showToast("Select at least one CSV source.", "error");
            return;
        }
        const streams = [];
        for (const file of files) {
            const text = await readFileText(file);
            if (text === null) continue;
            const { events } = parseEvents(text);
            if (events.length) streams.push(events);
        }
        if (!streams.length) {
            showToast("No valid events found in the selected files.", "error");
            return;
        }
        state.timeline = mergeMany(streams);
        state.events = state.timeline.slice();
        state.report = "";
        updateDataset();
        renderTable($("mergeTable"), state.timeline, "No events merged.");
        renderFlowGraph("mergeSvg", "mergeLegend", "mergeGraphNote", state.timeline);
        renderFlowGraph("timelineSvg", "timelineLegend", "timelineGraphNote", state.timeline);
        showToast(`Merged ${streams.length} source(s) without a heap.`);
    });

    $("loadDepsSample").addEventListener("click", () => {
        loadDependencyText(SAMPLE_DEPENDENCIES_CSV, "the sample edges");
    });

    $("depsFile").addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const text = await readFileText(file);
        if (text !== null) loadDependencyText(text, file.name);
        event.target.value = "";
    });

    $("bfsButton").addEventListener("click", () => runTraversal("bfs"));
    $("dfsButton").addEventListener("click", () => runTraversal("dfs"));

    $("exportTimeline").addEventListener("click", () => {
        if (!state.events.length) {
            showToast("Load an event log first.", "error");
            return;
        }
        const timeline = ensureTimeline();
        downloadFile("reconstructed_timeline.csv", eventsToCsv(timeline), "text/csv");
        showToast("Timeline downloaded.");
    });

    $("generateReport").addEventListener("click", () => {
        if (!state.events.length) {
            showToast("Load an event log first.", "error");
            return;
        }
        state.report = buildReport();
        $("reportOutput").textContent = state.report;
        showToast("Report generated.");
    });

    $("downloadReport").addEventListener("click", () => {
        if (!state.events.length) {
            showToast("Load an event log first.", "error");
            return;
        }
        if (!state.report) state.report = buildReport();
        downloadFile("analysis_report.txt", state.report, "text/plain");
        showToast("Report downloaded.");
    });

    updateDataset();
    renderTable($("originalTable"), state.events, "No events loaded.");
    renderTable($("timelineTable"), state.timeline, "Click Reconstruct to build the timeline.");
    renderTable($("exportPreview"), state.timeline, "No events loaded.");
    renderFlowGraph("timelineSvg", "timelineLegend", "timelineGraphNote", []);
    renderFlowGraph("mergeSvg", "mergeLegend", "mergeGraphNote", []);
    drawGraph([]);
    renderAdjacency();
};

initialize();
