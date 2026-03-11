export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { isAbortError } from "@/lib/authErrors";

type ClaimRequest = {
  id: string;
  business_id: string;
  requester_user_id: string;
  requester_email: string;
  requester_business_name: string | null;
  status: string;
  created_at: string;
};

type BusinessInfo = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  website_display: string | null;
  country_code: string | null;
  city: string | null;
};

const cleanDomain = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  return value.replace(/^https?:\/\//, "").replace(/^www\./, "");
};

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [businessMap, setBusinessMap] = useState<Record<string, BusinessInfo>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );

  const adminEmails = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";
    return raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }, []);

  const isAdmin = useMemo(() => {
    if (!userEmail) {
      return false;
    }
    return adminEmails.includes(userEmail.toLowerCase());
  }, [adminEmails, userEmail]);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      let data: { session: { user: { email?: string | null } } | null } | null = null;
      try {
        const result = await supabaseBrowser().auth.getSession();
        data = result.data;
      } catch (e) {
        if (isAbortError(e)) {
          if (isMounted) setUserEmail(null);
          return;
        }
        throw e;
      }
      const email = data?.session?.user?.email ?? null;
      if (!isMounted) {
        return;
      }
      setUserEmail(email);
    };

    loadSession();

    const { data: authListener } = supabaseBrowser().auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) {
          return;
        }
        setUserEmail(session?.user?.email ?? null);
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadClaims = async () => {
      if (!isAdmin) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("business_claim_requests")
        .select(
          "id, business_id, requester_user_id, requester_email, requester_business_name, status, created_at"
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!isMounted) {
        return;
      }

      if (error) {
        setClaims([]);
        setBusinessMap({});
        setLoading(false);
        return;
      }

      const claimRows = data ?? [];
      setClaims(claimRows);

      const businessIds = [...new Set(claimRows.map((claim) => claim.business_id))];
      if (businessIds.length === 0) {
        setBusinessMap({});
        setLoading(false);
        return;
      }

      const { data: businessData } = await supabase
        .from("businesses")
        .select("id, name, slug, website, website_display, country_code, city")
        .in("id", businessIds);

      if (!isMounted) {
        return;
      }

      const mapped = (businessData ?? []).reduce<Record<string, BusinessInfo>>(
        (acc, business) => {
          acc[business.id] = business;
          return acc;
        },
        {}
      );

      setBusinessMap(mapped);
      setLoading(false);
    };

    loadClaims();

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  const handleReject = async (claim: ClaimRequest) => {
    if (actionLoading[claim.id]) {
      return;
    }
    setActionLoading((prev) => ({ ...prev, [claim.id]: true }));
    setRowError((prev) => ({ ...prev, [claim.id]: "" }));

    const supabase = supabaseBrowser();
    const { error } = await supabase
      .from("business_claim_requests")
      .update({ status: "rejected" })
      .eq("id", claim.id);

    if (error) {
      setRowError((prev) => ({
        ...prev,
        [claim.id]: "Unable to reject. Please try again.",
      }));
    } else {
      setClaims((prev) => prev.filter((item) => item.id !== claim.id));
    }

    setActionLoading((prev) => ({ ...prev, [claim.id]: false }));
  };

  const handleApprove = async (claim: ClaimRequest) => {
    if (actionLoading[claim.id]) {
      return;
    }
    setActionLoading((prev) => ({ ...prev, [claim.id]: true }));
    setRowError((prev) => ({ ...prev, [claim.id]: "" }));
    setStatusMessage(null);

    const supabase = supabaseBrowser();
    const { data: existingOwner } = await supabase
      .from("business_owners")
      .select("business_id")
      .eq("business_id", claim.business_id)
      .maybeSingle();

    if (existingOwner) {
      setRowError((prev) => ({
        ...prev,
        [claim.id]: "This business is already owned.",
      }));
      setActionLoading((prev) => ({ ...prev, [claim.id]: false }));
      return;
    }

    const { error: approveError } = await supabase
      .from("business_claim_requests")
      .update({ status: "approved" })
      .eq("id", claim.id);

    if (approveError) {
      setRowError((prev) => ({
        ...prev,
        [claim.id]: "Unable to approve. Please try again.",
      }));
      setActionLoading((prev) => ({ ...prev, [claim.id]: false }));
      return;
    }

    const { error: ownerError } = await supabase
      .from("business_owners")
      .insert({
        business_id: claim.business_id,
        owner_user_id: claim.requester_user_id,
      });

    if (ownerError) {
      await supabase
        .from("business_claim_requests")
        .update({ status: "pending" })
        .eq("id", claim.id);
      setRowError((prev) => ({
        ...prev,
        [claim.id]: "Ownership link failed. Please try again.",
      }));
      setActionLoading((prev) => ({ ...prev, [claim.id]: false }));
      return;
    }

    setClaims((prev) => prev.filter((item) => item.id !== claim.id));
    setStatusMessage("Claim approved");
    setActionLoading((prev) => ({ ...prev, [claim.id]: false }));
  };

  if (!userEmail) {
    return (
      <main className="bg-white">
        <section className="mx-auto w-full max-w-7xl px-6 py-16">
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">
            Admin login required
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            Please sign in with an admin account to continue.
          </p>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="bg-white">
        <section className="mx-auto w-full max-w-7xl px-6 py-16">
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">
            Access denied
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            You do not have access to this page.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-white">
      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <div>
          <h1 className="text-3xl font-semibold text-[#0E0E0E]">
            Claim moderation
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            Review pending business claim requests.
          </p>
        </div>

        {statusMessage && (
          <p className="mt-4 text-sm font-medium text-[#1FAF9E]">
            {statusMessage}
          </p>
        )}

        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading claims...</div>
          ) : claims.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              No pending claims.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {claims.map((claim) => {
                const business = businessMap[claim.business_id];
                const domain = cleanDomain(
                  business?.website_display ?? business?.website ?? ""
                );
                return (
                  <div key={claim.id} className="p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-semibold text-[#0E0E0E]">
                            {business?.name ?? "Unknown business"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {domain || "No domain"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {[business?.city, business?.country_code]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                            {claim.requester_email}
                          </p>
                          <p className="text-xs text-gray-500">
                            {claim.requester_business_name ?? "—"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(claim.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleApprove(claim)}
                          disabled={actionLoading[claim.id]}
                          className="rounded-full bg-[#1FAF9E] px-5 py-2 text-xs font-semibold text-white hover:bg-[#169786]"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(claim)}
                          disabled={actionLoading[claim.id]}
                          className="rounded-full border border-gray-200 px-5 py-2 text-xs font-semibold text-gray-600"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                    {rowError[claim.id] && (
                      <p className="mt-3 text-xs text-red-500">
                        {rowError[claim.id]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
