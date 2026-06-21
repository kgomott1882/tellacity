"use client";

import ArticleWriterAvatarUpload from "@/components/articles/editor/ArticleWriterAvatarUpload";

type Props = {
  authorName: string;
  authorTitle: string;
  authorAvatarUrl: string | null;
  disabled?: boolean;
  onAuthorNameChange: (value: string) => void;
  onAuthorTitleChange: (value: string) => void;
  onUploadAvatar: (file: File) => Promise<void>;
  onRemoveAvatar: () => void;
};

export default function ArticleWriterSetupFields({
  authorName,
  authorTitle,
  authorAvatarUrl,
  disabled = false,
  onAuthorNameChange,
  onAuthorTitleChange,
  onUploadAvatar,
  onRemoveAvatar,
}: Props) {
  return (
    <>
      <h2 className="text-lg font-semibold text-gray-900">Writer byline</h2>
      <p className="mt-1 text-sm text-gray-500">
        Optional. Add who wrote this piece before you submit. Name, role, and photo appear on the
        published article card.
      </p>

      <div className="mt-6">
        <ArticleWriterAvatarUpload
          imageUrl={authorAvatarUrl}
          writerName={authorName}
          disabled={disabled}
          onUpload={onUploadAvatar}
          onRemove={onRemoveAvatar}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="author-name" className="block text-sm font-medium text-gray-700">
            Writer name
          </label>
          <input
            id="author-name"
            value={authorName}
            onChange={(e) => onAuthorNameChange(e.target.value)}
            disabled={disabled}
            className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
            placeholder="John Smith"
          />
        </div>
        <div>
          <label htmlFor="author-title" className="block text-sm font-medium text-gray-700">
            Occupation
          </label>
          <input
            id="author-title"
            value={authorTitle}
            onChange={(e) => onAuthorTitleChange(e.target.value)}
            disabled={disabled}
            className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
            placeholder="Marketing Director"
          />
        </div>
      </div>
    </>
  );
}
