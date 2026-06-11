type Props = {
  name: string;
  avatarUrl?: string | null;
  className?: string;
};

function writerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export default function WriterBylineAvatar({ name, avatarUrl, className = "" }: Props) {
  const trimmedUrl = avatarUrl?.trim() ?? "";
  const base =
    "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1FAF9E]/15 text-base font-semibold text-[#0E4E45]";

  if (trimmedUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={trimmedUrl}
        alt=""
        className={`h-14 w-14 shrink-0 rounded-full border border-gray-100 object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`${base} ${className}`} aria-hidden>
      {writerInitials(name)}
    </div>
  );
}
