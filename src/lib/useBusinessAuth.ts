"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { isAbortError } from "@/lib/authErrors";
import { ensureSessionFresh } from "@/lib/ensureSessionFresh";

type BusinessAuthState = {
  user: { id: string; email?: string | null } | null;
  /** @deprecated Unused; business access is resolved in `useBusinesses`. Kept for call-site compatibility. */
  isBusiness: boolean;
  loading: boolean;
};

const SESSION_READ_TIMEOUT_MS = 12_000;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

export const useBusinessAuth = (): BusinessAuthState => {
  const [user, setUser] = useState<BusinessAuthState["user"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const applySession = (sessionUser: { id: string; email?: string | null } | null) => {
      if (!isMounted) return;
      if (!sessionUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      setUser({ id: sessionUser.id, email: sessionUser.email });
      setLoading(false);
      void ensureSessionFresh();
    };

    const loadSession = async () => {
      let data: { session: { user: { id: string; email?: string | null } } | null } | null =
        null;
      try {
        const result = await withTimeout(
          supabaseBrowser().auth.getSession(),
          SESSION_READ_TIMEOUT_MS,
          "getSession",
        );
        data = result.data;
      } catch (e) {
        if (isAbortError(e)) {
          if (!isMounted) return;
          try {
            await new Promise((r) => setTimeout(r, 200));
            const retry = await supabaseBrowser().auth.getSession();
            data = retry.data;
          } catch {
            if (isMounted) {
              setUser(null);
              setLoading(false);
            }
            return;
          }
          if (!isMounted) return;
        } else {
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }
      }

      const sessionUser = data?.session?.user ?? null;
      applySession(sessionUser);
    };

    void loadSession();

    const { data: authListener } = supabaseBrowser().auth.onAuthStateChange(
      (_event, session) => {
        const sessionUser = session?.user ?? null;
        if (!isMounted) return;
        applySession(sessionUser);
      },
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { user, isBusiness: false, loading };
};
