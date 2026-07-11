import type { OrgRole } from "@haizu/shared";
import { AsyncLocalStorage } from "node:async_hooks";

// Request-scoped context for passing values that are set on the user only on the server (organization, role)
// to databaseHooks safely during sign-up.
// This makes it impossible for the client to inject organizationId / role.
type SignupContext = { organizationId: string; role: OrgRole };

export const signupContext = new AsyncLocalStorage<SignupContext>();
