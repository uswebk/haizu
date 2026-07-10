import type { OrgRole } from "@haizu/shared";
import { AsyncLocalStorage } from "node:async_hooks";

// サインアップ時に、サーバー側でのみ user へ設定する値（所属組織・権限）を
// databaseHooks へ安全に受け渡すためのリクエストスコープのコンテキスト。
// これによりクライアントからの organizationId / role 注入を不可能にする。
type SignupContext = { organizationId: string; role: OrgRole };

export const signupContext = new AsyncLocalStorage<SignupContext>();
