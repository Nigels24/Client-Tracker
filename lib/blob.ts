import "server-only";
import { del, get, put } from "@vercel/blob";

/**
 * Vercel Blob wrapper for client agreements.
 *
 * Uploads are attempted as `private` first, so an agreement is only ever
 * readable through `/api/documents/[id]/view`, which checks the session. Not
 * every Vercel plan allows private blobs, so a failure falls back to `public`
 * — the resulting URL is unguessable (random suffix) and is still never handed
 * to the browser directly. Which mode was used is recorded per document so the
 * view route knows whether to stream or redirect.
 */

/** Vercel caps a serverless request body at 4.5 MB; stay under it. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const ALLOWED_EXTENSIONS = ".pdf, .png, .jpg, .webp";

export function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export type UploadedBlob = {
  url: string;
  pathname: string;
  access: "private" | "public";
};

export async function uploadBlob(
  pathname: string,
  file: File
): Promise<UploadedBlob> {
  try {
    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: true,
    });
    return { url: blob.url, pathname: blob.pathname, access: "private" };
  } catch (error) {
    console.warn(
      "Private blob upload failed, falling back to public with a random suffix.",
      error
    );
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return { url: blob.url, pathname: blob.pathname, access: "public" };
  }
}

export async function readBlob(pathname: string, access: "private" | "public") {
  return get(pathname, { access });
}

/**
 * Deleting the row must not fail just because the file is already gone, so
 * blob removal is best-effort and logged rather than thrown.
 */
export async function deleteBlob(pathname: string) {
  if (!isBlobConfigured()) return;
  try {
    await del(pathname);
  } catch (error) {
    console.error("Failed to delete blob", pathname, error);
  }
}
