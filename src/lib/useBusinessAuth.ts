"use client";

import { useEffect, useState } from "react";
import { supabase as supabaseBrowser } from "@/lib/supabaseBrowser";

/** Supabase auth can throw AbortError when the Navigator Lock times out (e.g. multiple tabs). May be Error or DOMException. */
function isAbortError(e: unknown): boolean {
  if (e == null) return false;
  const name = typeof (e as { name?: string }).name === "string" ? (e as { name: string }).name : "";
  return name === "AbortError";
}

type BusinessAuthState = {
  user: { id: string; email?: string | null } | null;
  isBusiness: boolean;
  loading: boolean;
};

export const useBusinessAuth = (): BusinessAuthState => {
  const [user, setUser] = useState<BusinessAuthState["user"]>(null);
  const [isBusiness, setIsBusiness] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSessionAndRole = async () => {
      let data: { session: { user: { id: string; email?: string | null } } | null } | null = null;
      try {
        const result = await supabaseBrowser.auth.getSession();
        data = result.data;
      } catch (e) {
        if (isAbortError(e)) {
          if (isMounted) setLoading(false);
          return;
        }
        throw e;
      }
      const sessionUser = data?.session?.user ?? null;
      
      if (!isMounted) {
        return;
      }
      
      if (!sessionUser) {
        setUser(null);
        setIsBusiness(false);
        setLoading(false);
        return;
      }
      
      setUser({ id: sessionUser.id, email: sessionUser.email });
      
      // Business user = has business_profiles by user id or by email (same email may have profile under another auth id)
      const { data: businessProfileById, error: errById } = await supabaseBrowser
        .from("business_profiles")
        .select("id")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (!isMounted) return;
      if (!errById && businessProfileById) {
        setIsBusiness(true);
        setLoading(false);
        return;
      }

      const emailNorm = sessionUser.email?.trim().toLowerCase();
      let businessProfileByEmail = null;
      if (emailNorm) {
        const { data } = await supabaseBrowser
          .from("business_profiles")
          .select("id")
          .eq("email", emailNorm)
          .maybeSingle();
        businessProfileByEmail = data;
      }
      if (!isMounted) return;

      setIsBusiness(!!businessProfileByEmail);
      setLoading(false);
    };

    loadSessionAndRole();

    const { data: authListener } = supabaseBrowser.auth.onAuthStateChange(
      async (_event, session) => {
        const sessionUser = session?.user ?? null;
        if (!isMounted) {
          return;
        }
        
        if (!sessionUser) {
          setUser(null);
          setIsBusiness(false);
          return;
        }
        
        setUser({ id: sessionUser.id, email: sessionUser.email });
        
        const { data: byId } = await supabaseBrowser
          .from("business_profiles")
          .select("id")
          .eq("id", sessionUser.id)
          .maybeSingle();
        if (!isMounted) return;
        if (byId) {
          setIsBusiness(true);
          return;
        }
        const emailNorm = sessionUser.email?.trim().toLowerCase();
        if (emailNorm) {
          const { data: byEmail } = await supabaseBrowser
            .from("business_profiles")
            .select("id")
            .eq("email", emailNorm)
            .maybeSingle();
          if (!isMounted) return;
          setIsBusiness(!!byEmail);
        } else {
          setIsBusiness(false);
        }
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { user, isBusiness, loading };
};
