import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { createHash } from "node:crypto";
import { exportBlog } from "./scripts/export-records.mjs";

// Keep Blender's stable source/export paths, while production URLs identify
// exact bytes and can be cached without revalidation across deployments.
const models = ["archive-cassette", "archive-assembly"].map(name => {
  const source = readFileSync(`public/assets/${name}.glb`);
  const hash = createHash("sha256").update(source).digest("hex").slice(0,16);
  return { key:`assets/${name}.glb`, fileName:`assets/${name}.${hash}.glb`, source };
});
export default defineConfig({
  configFile: false,
  define: { __RHINE_MODELS__: JSON.stringify(Object.fromEntries(models.map(model => [model.key,model.fileName]))) },
  plugins: [{
    name: "blog-markdown",
    configureServer(server) {
      // Keep the local frame-by-frame review pages available after the Astro migration.
      const referenceRoot = resolve("reference");
      server.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
        if (!pathname.startsWith("/reference/") || /\.(?:ts|js|mjs)$/.test(pathname)) return next();
        try {
          const file = resolve("." + decodeURIComponent(pathname));
          if (!file.startsWith(referenceRoot + sep)) return next();
          const extension = extname(file);
          const types: Record<string, string> = { ".html": "text/html", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".glb": "model/gltf-binary", ".json": "application/json" };
          const bytes = await readFile(file);
          res.setHeader("Content-Type", types[extension] ?? "application/octet-stream");
          res.end(extension === ".html" ? await server.transformIndexHtml(pathname, bytes.toString()) : bytes);
        } catch { next(); }
      });
      let timer: ReturnType<typeof setTimeout>;
      let pending = Promise.resolve();
      server.watcher.add("content/posts");
      const changed = (path: string) => {
        if (!path.replaceAll("\\", "/").includes("content/posts/") || !path.endsWith(".md")) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          pending = pending.then(() => exportBlog()).then(() => { server.ws.send({ type: "full-reload" }); }).catch(error => { server.config.logger.error(String(error)); });
        }, 100);
      };
      server.watcher.on("add", changed).on("change", changed).on("unlink", changed);
      server.httpServer?.once("close", () => { clearTimeout(timer); server.watcher.off("add", changed).off("change", changed).off("unlink", changed); });
    },
  }, {
    name: "versioned-model-assets", apply: "build",
    buildStart() { for (const model of models) this.emitFile({type:"asset",fileName:model.fileName,source:model.source}); },
  }],
});
