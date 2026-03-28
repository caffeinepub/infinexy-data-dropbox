import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Eye,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Category, Document } from "../backend";
import { useAuth } from "../contexts/AuthContext";

interface DocumentRowProps {
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
  return new Date(ms).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type FileTypeInfo = {
  Icon: typeof FileText;
  bg: string;
  color: string;
  label: string;
};

function getFileTypeInfo(mimeType: string, fileName: string): FileTypeInfo {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (mimeType === "application/pdf" || ext === "pdf")
    return { Icon: FileText, bg: "#FEE2E2", color: "#DC2626", label: "PDF" };
  if (mimeType.includes("wordprocessingml") || ext === "docx" || ext === "doc")
    return { Icon: FileText, bg: "#DBEAFE", color: "#1D4ED8", label: "DOCX" };
  if (mimeType.includes("spreadsheet") || ext === "xlsx" || ext === "xls")
    return {
      Icon: FileSpreadsheet,
      bg: "#DCFCE7",
      color: "#15803D",
      label: "XLSX",
    };
  if (mimeType.startsWith("image/"))
    return {
      Icon: FileImage,
      bg: "#F3E8FF",
      color: "#7E22CE",
      label: ext.toUpperCase() || "IMG",
    };
  if (mimeType === "text/plain" || ext === "txt")
    return { Icon: FileText, bg: "#F1F5F9", color: "#475569", label: "TXT" };
  return {
    Icon: File,
    bg: "#F1F5F9",
    color: "#64748B",
    label: ext.toUpperCase() || "FILE",
  };
}

export default function DocumentRow({
  doc,
  categories,
  index,
  onView,
  onDeleted,
}: DocumentRowProps) {
  const { actor } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const category = categories.find((c) => c.id === doc.categoryId);
  const typeInfo = getFileTypeInfo(doc.mimeType, doc.fileName);
  const { Icon } = typeInfo;

  const handleDelete = async () => {
    if (!actor) return;
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
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
      className={cn(
        "flex items-center gap-4 px-4 py-3 hover:bg-blue-50/60 transition-colors border-b border-slate-100 last:border-b-0 group",
      )}
      data-ocid={`files.item.${index}`}
    >
      {/* File icon */}
      <div
        className="h-9 w-9 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: typeInfo.bg }}
      >
        <Icon
          className="h-4.5 w-4.5"
          style={{ color: typeInfo.color }}
          size={18}
        />
      </div>

      {/* Title + filename */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {doc.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">{doc.fileName}</p>
      </div>

      {/* Category badge */}
      <div className="hidden sm:block w-28 flex-shrink-0">
        {category ? (
          <Badge
            variant="secondary"
            className="text-xs font-normal bg-blue-50 text-blue-700 border border-blue-100"
          >
            {category.name}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Uncategorized</span>
        )}
      </div>

      {/* File type badge */}
      <div className="hidden md:block w-14 flex-shrink-0">
        <span
          className="text-xs font-semibold px-1.5 py-0.5 rounded"
          style={{ background: typeInfo.bg, color: typeInfo.color }}
        >
          {typeInfo.label}
        </span>
      </div>

      {/* Size */}
      <div className="hidden md:block w-16 flex-shrink-0 text-xs text-muted-foreground text-right">
        {formatBytes(doc.fileSize)}
      </div>

      {/* Date */}
      <div className="hidden lg:block w-24 flex-shrink-0 text-xs text-muted-foreground text-right">
        {formatDate(doc.createdAt)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
          onClick={() => onView(doc)}
          title="View"
          data-ocid={`files.view.button.${index}`}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 w-7 p-0 text-muted-foreground hover:text-destructive",
            deleting && "opacity-50",
          )}
          onClick={handleDelete}
          disabled={deleting}
          title="Delete"
          data-ocid={`files.delete_button.${index}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
