"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { isAbortError } from "@/lib/authErrors";
import { ensureSessionFresh } from "@/lib/ensureSessionFresh";

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
        const result = await supabaseBrowser().auth.getSession();
        data = result.data;
      } catch (e) {
        if (isAbortError(e)) {
          if (!isMounted) return;
          try {
            await new Promise((r) => setTimeout(r, 200));
            const retry = await supabaseBrowser().auth.getSession();
            data = retry.data;
          } catch (retryErr) {
            if (isMounted) setLoading(false);
            return;
          }
          if (!isMounted) return;
        } else {
          if (isMounted) setLoading(false);
          return;
        }
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

      await ensureSessionFresh();

      const supabase = supabaseBrowser();
      const uid = sessionUser.id;

      const { data: ownedRow } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", uid)
        .limit(1)
        .maybeSingle();
      if (!isMounted) return;
      if (ownedRow) {
        setIsBusiness(true);
        setLoading(false);
        return;
      }

      const { data: ownerLinks } = await supabase
        .from("business_owners")
        .select("business_id")
        .eq("owner_user_id", uid)
        .limit(1);
      if (!isMounted) return;
      setIsBusiness(Boolean(ownerLinks?.length));
      setLoading(false);
    };

    loadSessionAndRole();

    const { data: authListener } = supabaseBrowser().auth.onAuthStateChange(
      async (_event, session) => {
        const sessionUser = session?.user ?? null;
        if (!isMounted) {
          return;
        }
        
        if (!sessionUser) {
          setUser(null);
          setIsBusiness(false);
          if (isMounted) setLoading(false);
          return;
        }
        
        setUser({ id: sessionUser.id, email: sessionUser.email });

        await ensureSessionFresh();

        const supabase = supabaseBrowser();
        const uid = sessionUser.id;

        const { data: ownedRow } = await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", uid)
          .limit(1)
          .maybeSingle();
        if (!isMounted) return;
        if (ownedRow) {
          setIsBusiness(true);
          if (isMounted) setLoading(false);
          return;
        }

        const { data: ownerLinks } = await supabase
          .from("business_owners")
          .select("business_id")
          .eq("owner_user_id", uid)
          .limit(1);
        if (!isMounted) return;
        setIsBusiness(Boolean(ownerLinks?.length));
        if (isMounted) setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { user, isBusiness, loading };
};
