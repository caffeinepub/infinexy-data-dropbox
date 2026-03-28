import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, FileText, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Document } from "../backend";

interface DocumentViewerModalProps {
  doc: Document | null;
  onClose: () => void;
}

export default function DocumentViewerModal({
  doc,
  onClose,
}: DocumentViewerModalProps) {
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [directUrl, setDirectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // Revoke previous object URL to free memory
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setViewUrl(null);
    setDirectUrl(null);

    if (!doc?.blob) return;

    const url = doc.blob.getDirectURL();
    setDirectUrl(url);

    const isImage = doc.mimeType.startsWith("image/");
    const isPdf = doc.mimeType === "application/pdf";

    if (isImage || isPdf) {
      setLoading(true);
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => {
          const objectUrl = URL.createObjectURL(
            new Blob([blob], { type: doc.mimeType }),
          );
          objectUrlRef.current = objectUrl;
          setViewUrl(objectUrl);
        })
        .catch(() => {
          setViewUrl(url);
        })
        .finally(() => setLoading(false));
    }

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [doc]);

  if (!doc) return null;

  const isImage = doc.mimeType.startsWith("image/");
  const isPdf = doc.mimeType === "application/pdf";

  const handleDownload = () => {
    const url = directUrl || viewUrl;
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.fileName;
    a.click();
  };

  return (
    <Dialog open={!!doc} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-4xl w-full max-h-[90vh] flex flex-col"
        data-ocid="document_viewer.dialog"
      >
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="truncate max-w-xl">{doc.title}</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex-shrink-0 ml-4"
              data-ocid="document_viewer.download.button"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0 rounded-lg bg-muted">
          {loading ? (
            <div className="flex items-center justify-center h-64 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground text-sm">Loading file...</p>
            </div>
          ) : isImage && viewUrl ? (
            <div className="overflow-auto h-full flex items-center justify-center p-4">
              <img
                src={viewUrl}
                alt={doc.title}
                className="max-w-full max-h-full object-contain rounded"
              />
            </div>
          ) : isPdf && viewUrl ? (
            <iframe
              src={viewUrl}
              title={doc.title}
              className="w-full h-full min-h-[600px]"
              style={{ border: "none" }}
            />
          ) : !loading && (isImage || isPdf) ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground text-sm">Loading file...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium text-foreground">{doc.fileName}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Preview not available for this file type
                </p>
              </div>
              <Button
                onClick={handleDownload}
                data-ocid="document_viewer.download2.button"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Download to View
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
