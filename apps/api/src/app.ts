import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";
import { WEB_ORIGIN } from "./lib/env";
import { accountRoute } from "./routes/account";
import { areasRoute } from "./routes/areas";
import { assignmentsRoute } from "./routes/assignments";
import { authRoute } from "./routes/auth";
import { employeesRoute } from "./routes/employees";
import { invitationsRoute } from "./routes/invitations";
import { membersRoute } from "./routes/members";
import { organizationsRoute } from "./routes/organizations";
import { sitesRoute } from "./routes/sites";
import { tagsRoute } from "./routes/tags";
import { viewerConfigsRoute } from "./routes/viewerConfigs";
import { workPatternsRoute } from "./routes/workPatterns";

export const app = new Hono();

// Allow credentials so session cookies are sent/received cross-origin (allowed origins come from env vars)
app.use("*", cors({ origin: WEB_ORIGIN, credentials: true }));

app.get("/health", (c) => c.json({ status: "ok" }));
app.use("/uploads/*", serveStatic({ root: "./" }));

// Better Auth's standard handlers (login, logout, session, etc.)
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
// Custom sign-up that also creates an organization from the company name
app.route("/auth", authRoute);
// Accepting an invitation (only requires holding the token; no auth needed)
app.route("/invitations", invitationsRoute);

// Auth and site-scoping are applied per route via requireAuth / siteScope
app.route("/account", accountRoute);
app.route("/organizations", organizationsRoute);
app.route("/sites", sitesRoute);
app.route("/areas", areasRoute);
app.route("/assignments", assignmentsRoute);
app.route("/employees", employeesRoute);
app.route("/members", membersRoute);
app.route("/tags", tagsRoute);
app.route("/work-pattern", workPatternsRoute);
app.route("/viewer-configs", viewerConfigsRoute);

export type AppType = typeof app;
