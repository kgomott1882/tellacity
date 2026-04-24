import PhotoUploadsQueue from "./PhotoUploadsQueue";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Photo Uploads · Tellacity Admin",
};

export default function AdminPhotoUploadsPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-1 border-b border-neutral-100 pb-4">
          <h1 className="text-lg font-semibold text-neutral-900">
            Photo Uploads
          </h1>
          <p className="text-sm text-neutral-600">
            Central review queue for every business photo awaiting an admin
            decision. Photos are live on the public page the moment the owner
            publishes them — approving a photo keeps it live, rejecting pulls
            it down and emails the owner. Opening this page doesn&apos;t clear
            the sidebar notification; only approving or rejecting does.
          </p>
        </div>
        <PhotoUploadsQueue />
      </div>
    </div>
  );
}
