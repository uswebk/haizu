import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { areasRoute } from "./routes/areas";

const app = new Hono();

app.use("*", cors({ origin: "http://localhost:3000" }));

app.get("/health", (c) => c.json({ status: "ok" }));
app.use("/uploads/*", serveStatic({ root: "./" }));
app.route("/areas", areasRoute);

serve({ fetch: app.fetch, port: 3001 }, (info) => {
	console.log(`API server running on http://localhost:${info.port}`);
});

export type AppType = typeof app;
