import { buildSync } from "esbuild";
import { join } from "path";
import React from "react";
import { renderToString } from "react-dom/server";
import { readFileSync, writeFileSync } from "fs";

const dirName = join(import.meta.dirname, "..");

buildSync({
    entryPoints: [join(dirName, "src/ui/react/App.tsx")],
    outfile: join(dirName, "node_modules/.cache/ssr-html.js"),
    bundle: true,
    packages: "external",
    sourcemap: true,
    format: "esm",
    platform: "node",
    target: "es2022",
});

process.env.NODE_OPTIONS = "--enable-source-maps";

const ssrReact = await import("../node_modules/.cache/ssr-html.js");

const html = renderToString(React.createElement(ssrReact.default));

const file = readFileSync(join(dirName, "ui-dist/index.html"), "utf8");
const newFile = file.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
writeFileSync(join(dirName, "ui-dist/index.html"), newFile);

console.log("SSR HTML generated");
