import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";
import { WEB_ORIGIN } from "./lib/env";
import { areasRoute } from "./routes/areas";
import { assignmentsRoute } from "./routes/assignments";
import { authRoute } from "./routes/auth";
import { employeesRoute } from "./routes/employees";
import { invitationsRoute } from "./routes/invitations";
import { membersRoute } from "./routes/members";
import { sitesRoute } from "./routes/sites";
import { tagsRoute } from "./routes/tags";
import { viewerConfigsRoute } from "./routes/viewerConfigs";
import { workPatternsRoute } from "./routes/workPatterns";

const app = new Hono();

// セッションCookieをクロスオリジンで送受信するため credentials を許可（許可オリジンは環境変数）
app.use("*", cors({ origin: WEB_ORIGIN, credentials: true }));

app.get("/health", (c) => c.json({ status: "ok" }));
app.use("/uploads/*", serveStatic({ root: "./" }));

// Better Auth の標準ハンドラ（ログイン・ログアウト・セッション等）
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
// 会社名→組織作成を伴うカスタムサインアップ
app.route("/auth", authRoute);
// 招待の受け入れ（トークン所持のみで認証不要）
app.route("/invitations", invitationsRoute);

// 認証・拠点スコープは各ルート内で requireAuth / siteScope を適用している
app.route("/sites", sitesRoute);
app.route("/areas", areasRoute);
app.route("/assignments", assignmentsRoute);
app.route("/employees", employeesRoute);
app.route("/members", membersRoute);
app.route("/tags", tagsRoute);
app.route("/work-pattern", workPatternsRoute);
app.route("/viewer-configs", viewerConfigsRoute);

serve({ fetch: app.fetch, port: 3001 }, (info) => {
	console.log(`API server running on http://localhost:${info.port}`);
});

export type AppType = typeof app;
