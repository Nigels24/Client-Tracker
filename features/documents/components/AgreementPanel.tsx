"use client";

import { useRef, useState } from "react";
import { format } from "date-fns";
import { FileText, Trash2, Upload } from "lucide-react";
import Button from "@/components/ui/Button";
import AlertBanner from "@/components/ui/AlertBanner";
import EmptyState from "@/components/ui/EmptyState";
import {
  useDeleteDocument,
  useUploadDocument,
} from "@/features/documents/hooks/use-documents";
import { documentViewUrl } from "@/features/documents/services/documents.api";
import type { Client } from "@/features/clients/types";

const ACCEPT = "application/pdf,image/png,image/jpeg,image/webp";
const ALLOWED_TYPES = ACCEPT.split(",");
/** Matches MAX_UPLOAD_BYTES on the server; checked here too so the user hears about it instantly. */
const MAX_BYTES = 4 * 1024 * 1024;

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AgreementPanel({ client }: { client: Client }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const uploadDocument = useUploadDocument(client.id);
  const deleteDocument = useDeleteDocument(client.id);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLocalError(null);
    uploadDocument.reset();

    const reject = (message: string) => {
      setLocalError(message);
      if (inputRef.current) inputRef.current.value = "";
    };

    if (!ALLOWED_TYPES.includes(file.type)) {
      return reject("Only PDF, JPG, PNG or WebP files can be uploaded.");
    }
    if (file.size > MAX_BYTES) {
      return reject(`That file is ${formatSize(file.size)} — the limit is 4.0 MB.`);
    }

    try {
      await uploadDocument.mutateAsync({ file });
    } catch {
      // Surfaced through the mutation's error state below.
    } finally {
      // Let the same file be re-picked after a failure.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (id: number, fileName: string) => {
    if (!window.confirm(`Delete ${fileName}?`)) return;
    await deleteDocument.mutateAsync(id);
  };

  const error =
    localError ??
    (uploadDocument.isError ? (uploadDocument.error as Error).message : null) ??
    (deleteDocument.isError ? (deleteDocument.error as Error).message : null);

  return (
    <div className="rounded-2xl border border-card-border bg-card-bg p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Agreement
        </h2>
        <Button
          label={uploadDocument.isPending ? "Uploading..." : "Upload"}
          variant="outline"
          size="sm"
          icon={<Upload size={14} />}
          onClick={() => inputRef.current?.click()}
          loading={uploadDocument.isPending}
          type="button"
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <div className="mb-4">
          <AlertBanner variant="error">{error}</AlertBanner>
        </div>
      )}

      {client.documents.length > 0 ? (
        <div className="space-y-2">
          {client.documents.map((document) => (
            <div
              key={document.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-card-border p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText size={18} className="flex-shrink-0 text-muted" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {document.fileName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatSize(document.size)} ·{" "}
                    {format(new Date(document.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={documentViewUrl(document.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-[9px] border border-card-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background"
                >
                  View
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(document.id, document.fileName)}
                  aria-label="Delete file"
                  className="rounded-full p-1.5 text-overdue-text hover:bg-overdue-bg cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No agreement uploaded"
          description="Upload a scan or photo of the signed agreement — PDF, JPG, PNG or WebP, up to 4 MB."
        />
      )}
    </div>
  );
}
