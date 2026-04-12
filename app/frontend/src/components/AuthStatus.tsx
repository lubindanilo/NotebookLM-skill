import { useEffect, useState } from "react";
import { getAuthStatus } from "../api";
import type { AuthStatus as AuthStatusType } from "../types";

export default function AuthStatus() {
  const [auth, setAuth] = useState<AuthStatusType | null>(null);

  useEffect(() => {
    getAuthStatus().then(setAuth).catch(() => setAuth({ authenticated: false }));
  }, []);

  if (!auth) return null;

  if (!auth.authenticated) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-400">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        Not authenticated — run <code className="bg-gray-800 px-1 rounded">notebooklm login</code>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`w-2 h-2 rounded-full ${auth.warning ? "bg-yellow-500" : "bg-green-500"}`} />
      <span className={auth.warning ? "text-yellow-400" : "text-green-400"}>
        Authenticated{auth.age_days != null ? ` (${auth.age_days}d)` : ""}
      </span>
      {auth.warning && <span className="text-yellow-500 text-xs">— {auth.warning}</span>}
    </div>
  );
}
