import PhotoExpiryQueue from "./PhotoExpiryQueue";
import { FREE_PLAN_PHOTO_RETENTION_ENABLED } from "@/lib/businessPhotoExpiry";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Photo Expiry · Tellacity Admin",
};

export default function AdminPhotoExpiryPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-1 border-b border-neutral-100 pb-4">
          <h1 className="text-lg font-semibold text-neutral-900">
            Photo Expiry
          </h1>
          {FREE_PLAN_PHOTO_RETENTION_ENABLED ? (
            <p className="text-sm text-neutral-600">
              Free-plan photos are automatically removed 30 calendar days after
              upload. Use this queue to send the 24-hour reminder email to the
              business owner and to sweep any photos that have already crossed
              the retention window. Upgrades clear the list automatically; paid
              plans never expire.
            </p>
          ) : (
            <p className="text-sm text-neutral-600">
              Automatic free-plan photo deletion is <strong>disabled</strong>.
              Photos stay on a business profile until they delete them or hit
              their plan upload cap (4 on Free). This page is kept for legacy
              tooling only; the queue below will stay empty.
            </p>
          )}
        </div>
        <PhotoExpiryQueue />
      </div>
    </div>
  );
}
