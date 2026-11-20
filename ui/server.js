const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const basePort = Number(process.env.PORT) || 8080;
let port = basePort;
const maxPort = basePort + 20;

const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".json": "application/json; charset=utf-8",
};

const server = http.createServer((request, response) => {
    let pathname = decodeURIComponent(
        new URL(request.url, `http://${request.headers.host || "localhost"}`).pathname
    );
    if (pathname === "/") pathname = "/index.html";

    const file = path.resolve(root, `.${pathname}`);
    const allowed = file === root || file.startsWith(root + path.sep);

    if (!allowed) {
        response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Forbidden");
        return;
    }

    fs.readFile(file, (error, data) => {
        if (error) {
            response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            response.end(`404 Not Found: ${pathname}`);
            return;
        }
        response.writeHead(200, {
            "Content-Type": contentTypes[path.extname(file).toLowerCase()] || "application/octet-stream",
        });
        response.end(data);
    });
});

server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && port < maxPort) {
        port += 1;
        console.log(`Port busy, trying ${port}...`);
        server.listen(port, "127.0.0.1");
        return;
    }
    if (error.code === "EADDRINUSE") {
        console.error(`No free port found between ${basePort} and ${maxPort}.`);
    } else {
        console.error(error.message);
    }
    process.exit(1);
});

server.listen(port, "127.0.0.1", () => {
    const actualPort = server.address().port;
    console.log(`ChronoTrace UI running at http://127.0.0.1:${actualPort}/`);
    console.log("Keep this terminal open while using the UI.");
});
