import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
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
  define: { __RHINE_MODELS__: JSON.stringify(Object.fromEntries(models.map(model => [model.key,model.fileName]))) },
  plugins: [{
    name: "blog-markdown",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        if (/^\/(blog|posts\/[a-z0-9-]+)\/?$/.test(url.pathname)) {
          req.url = url.pathname.replace(/\/?$/, "/index.html") + url.search;
        }
        next();
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
