import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Category, Document } from "../backend";
import { useAuth } from "../contexts/AuthContext";

interface DocumentCardProps {
  doc: Document;
  categories: Category[];
  index: number;
  onView: (doc: Document) => void;
  onDeleted: () => void;
}

function formatBytes(bytes: bigint): string {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(time: bigint): string {
  const ms = Number(time / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getFileType(
  mimeType: string,
  fileName: string,
): {
  label: string;
  bg: string;
  text: string;
} {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (mimeType === "application/pdf" || ext === "pdf")
    return { label: "PDF", bg: "#FEE2E2", text: "#DC2626" };
  if (mimeType.includes("wordprocessingml") || ext === "docx" || ext === "doc")
    return { label: "DOCX", bg: "#DBEAFE", text: "#1D4ED8" };
  if (mimeType.includes("spreadsheet") || ext === "xlsx" || ext === "xls")
    return { label: "XLSX", bg: "#DCFCE7", text: "#15803D" };
  if (mimeType.startsWith("image/"))
    return {
      label: ext.toUpperCase() || "IMG",
      bg: "#F3E8FF",
      text: "#7E22CE",
    };
  if (mimeType === "text/plain" || ext === "txt")
    return { label: "TXT", bg: "#F3F4F6", text: "#374151" };
  return { label: ext.toUpperCase() || "FILE", bg: "#F3F4F6", text: "#6B7280" };
}

function getFileIcon(mimeType: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (mimeType === "application/pdf" || ext === "pdf") return "📄";
  if (mimeType.includes("wordprocessingml") || ext === "docx") return "📝";
  if (mimeType.includes("spreadsheet") || ext === "xlsx") return "📊";
  if (mimeType.startsWith("image/")) return "🖼️";
  return "📁";
}

export default function DocumentCard({
  doc,
  categories,
  index,
  onView,
  onDeleted,
}: DocumentCardProps) {
  const { actor } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const category = categories.find((c) => c.id === doc.categoryId);
  const fileType = getFileType(doc.mimeType, doc.fileName);
  const fileIcon = getFileIcon(doc.mimeType, doc.fileName);

  const handleDelete = async () => {
    if (!actor) return;
    if (!confirm(`Delete "${doc.title}"?`)) return;
    setDeleting(true);
    try {
      await actor.deleteDocument(doc.id);
      toast.success("Document deleted");
      onDeleted();
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="bg-card rounded-lg border border-border shadow-card hover:shadow-md transition-shadow flex flex-col"
      data-ocid={`files.item.${index}`}
    >
      {/* File type header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <span className="text-2xl">{fileIcon}</span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded"
            style={{ background: fileType.bg, color: fileType.text }}
          >
            {fileType.label}
          </span>
        </div>
        <h3 className="font-medium text-sm text-foreground leading-snug line-clamp-2 mb-1">
          {doc.title}
        </h3>
        <p className="text-xs text-muted-foreground truncate">{doc.fileName}</p>
      </div>

      {/* Meta */}
      <div className="px-4 pb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatBytes(doc.fileSize)}</span>
        <span>{formatDate(doc.createdAt)}</span>
      </div>

      {/* Category */}
      {category && (
        <div className="px-4 pb-3">
          <Badge variant="secondary" className="text-xs">
            {category.name}
          </Badge>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto border-t border-border px-3 py-2 flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onView(doc)}
          title="View"
          data-ocid={`files.view.button.${index}`}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-7 w-7 p-0", deleting && "opacity-50")}
          onClick={handleDelete}
          disabled={deleting}
          title="Delete"
          data-ocid={`files.delete_button.${index}`}
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
