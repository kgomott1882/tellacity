import { permanentRedirect } from "next/navigation";

/** Merged into /for-business, keep route for bookmarks and external links. */
export default function ReputationPlatformRedirectPage() {
  permanentRedirect("/for-business");
}
