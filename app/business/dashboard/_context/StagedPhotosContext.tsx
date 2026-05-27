"use client";

/**
 * Dashboard-scoped React state for the "Upload more photos" staging area.
 *
 * Why it lives above the route boundary:
 *   The staging page `/business/dashboard/settings/photos/more` lets Free-plan
 *   users queue up to 21 additional photos before upgrading. When the user
 *   clicks "Upgrade plan" we route them to the checkout screen. If state lived
 *   inside the staging page itself, navigating to checkout (and back) would
 *   unmount everything and discard the queue. Hoisting the state into a
 *   provider that wraps the whole dashboard keeps the queue alive for the
 *   entire session, SPA navigations preserve it, and the only paths that
 *   destroy it are the ones the user explicitly triggers (Cancel + confirm,
 *   successful upgrade, full page reload / sign-out).
 *
 * The provider is intentionally memory-only: `File` handles can't be cleanly
 * serialized to sessionStorage and we don't want to persist photos across
 * sessions anyway. That's the same contract the page already advertised.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

export type StagedSectionDef = {
  slug: string;
  title: string;
  isBuiltin: boolean;
};

export type StagedPhoto = {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  sizeKb: number;
  /** Slug of the section this photo is classified under. */
  section: string;
};

export const DEFAULT_STAGED_SECTION_SLUG = "gallery" as const;

type Ctx = {
  /** Business the queue belongs to. Swapping businesses resets the queue. */
  businessId: string | null;
  setBusinessId: (id: string | null) => void;

  staged: StagedPhoto[];
  setStaged: React.Dispatch<React.SetStateAction<StagedPhoto[]>>;

  customSections: StagedSectionDef[];
  setCustomSections: React.Dispatch<React.SetStateAction<StagedSectionDef[]>>;

  activeSection: string;
  setActiveSection: React.Dispatch<React.SetStateAction<string>>;

  /** Drop all queued photos + custom categories (revokes object URLs). */
  discardAll: () => void;
};

const StagedPhotosContext = createContext<Ctx | null>(null);

export function StagedPhotosProvider({ children }: { children: React.ReactNode }) {
  const [businessId, setBusinessIdState] = useState<string | null>(null);
  const [staged, setStaged] = useState<StagedPhoto[]>([]);
  const [customSections, setCustomSections] = useState<StagedSectionDef[]>([]);
  const [activeSection, setActiveSection] = useState<string>(
    DEFAULT_STAGED_SECTION_SLUG
  );

  /** Latest staged array for the unmount-time revoke path (avoids stale refs). */
  const stagedRef = useRef(staged);
  stagedRef.current = staged;

  const discardAll = useCallback(() => {
    setStaged((prev) => {
      prev.forEach((p) => {
        try {
          URL.revokeObjectURL(p.previewUrl);
        } catch {
          /* noop */
        }
      });
      return [];
    });
    setCustomSections([]);
    setActiveSection(DEFAULT_STAGED_SECTION_SLUG);
  }, []);

  const setBusinessId = useCallback(
    (id: string | null) => {
      setBusinessIdState((current) => {
        // If the user switches workspaces we can't keep the queue, it was
        // gathered in the context of a specific business.
        if (current && id && current !== id) {
          stagedRef.current.forEach((p) => {
            try {
              URL.revokeObjectURL(p.previewUrl);
            } catch {
              /* noop */
            }
          });
          setStaged([]);
          setCustomSections([]);
          setActiveSection(DEFAULT_STAGED_SECTION_SLUG);
        }
        return id;
      });
    },
    []
  );

  const value = useMemo<Ctx>(
    () => ({
      businessId,
      setBusinessId,
      staged,
      setStaged,
      customSections,
      setCustomSections,
      activeSection,
      setActiveSection,
      discardAll,
    }),
    [
      businessId,
      setBusinessId,
      staged,
      customSections,
      activeSection,
      discardAll,
    ]
  );

  return (
    <StagedPhotosContext.Provider value={value}>
      {children}
    </StagedPhotosContext.Provider>
  );
}

export function useStagedPhotos() {
  const ctx = useContext(StagedPhotosContext);
  if (!ctx) {
    throw new Error(
      "useStagedPhotos must be used inside StagedPhotosProvider (dashboard scope)."
    );
  }
  return ctx;
}
