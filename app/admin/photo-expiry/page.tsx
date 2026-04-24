import PhotoExpiryQueue from "./PhotoExpiryQueue";

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
          <p className="text-sm text-neutral-600">
            Free-plan photos are automatically removed 30 calendar days after
            upload. Use this queue to send the 24-hour reminder email to the
            business owner and to sweep any photos that have already crossed
            the retention window. Upgrades clear the list automatically — paid
            plans never expire.
          </p>
        </div>
        <PhotoExpiryQueue />
      </div>
    </div>
  );
}
