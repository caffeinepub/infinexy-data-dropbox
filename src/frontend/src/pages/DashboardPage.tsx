import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CloudUpload,
  FolderOpen,
  HardDrive,
  KeyRound,
  Loader2,
  Menu,
  Search,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Category, Document } from "../backend";
import { ExternalBlob } from "../backend";
import AddCategoryModal from "../components/AddCategoryModal";
import DocumentRow from "../components/DocumentRow";
import DocumentViewerModal from "../components/DocumentViewerModal";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";
import AdminPage from "./AdminPage";

const DEFAULT_CATEGORIES = [
  { name: "Aadhar Card", color: "blue" },
  { name: "Pan Card", color: "yellow" },
  { name: "Passport", color: "purple" },
  { name: "Voter ID", color: "green" },
  { name: "Driving Licence", color: "red" },
  { name: "Insurance", color: "pink" },
  { name: "Bank Statement", color: "blue" },
  { name: "Education Certificate", color: "green" },
];

async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function ChangePasswordPanel() {
  const { actor } = useAuth();
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    if (!oldPass || !newPass || !confirmPass) {
      toast.error("Please fill all fields");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPass.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const oldHash = await sha256Hex(oldPass);
      const newHash = await sha256Hex(newPass);
      const result = (await (actor as any).changePassword(oldHash, newHash)) as
        | { ok: null }
        | { err: string };
      if ("ok" in result) {
        const stored = localStorage.getItem("infinexy_session");
        if (stored) {
          const session = JSON.parse(stored);
          localStorage.setItem(
            "infinexy_session",
            JSON.stringify({ ...session, passwordHash: newHash }),
          );
        }
        toast.success("Password changed successfully!");
        setOldPass("");
        setNewPass("");
        setConfirmPass("");
      } else if ("err" in result) {
        toast.error(result.err);
      }
    } catch {
      toast.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          Account Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account security settings
        </p>
      </div>
      <div
        className="rounded-xl border border-white/10 p-4 sm:p-6"
        style={{ background: "oklch(0.22 0.07 250)" }}
        data-ocid="settings.panel"
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="rounded-lg p-2.5"
            style={{ background: "oklch(0.30 0.09 250)" }}
          >
            <KeyRound className="h-5 w-5 text-blue-300" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              Change Password
            </h2>
            <p className="text-xs text-white/50">Update your login password</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="old-pass"
              className="text-xs font-medium text-white/70"
            >
              Current Password
            </label>
            <Input
              id="old-pass"
              type="password"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              placeholder="Enter current password"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-blue-400/50"
              data-ocid="settings.old_password.input"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="new-pass"
              className="text-xs font-medium text-white/70"
            >
              New Password
            </label>
            <Input
              id="new-pass"
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Enter new password (min. 6 characters)"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-blue-400/50"
              data-ocid="settings.new_password.input"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="confirm-pass"
              className="text-xs font-medium text-white/70"
            >
              Confirm New Password
            </label>
            <Input
              id="confirm-pass"
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Re-enter new password"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-blue-400/50"
              data-ocid="settings.confirm_password.input"
            />
          </div>
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 w-full sm:w-auto"
              style={{ background: "oklch(0.50 0.18 250)" }}
              data-ocid="settings.change_password.submit_button"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {loading ? "Updating..." : "Change Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { actor, username } = useAuth();
  const queryClient = useQueryClient();

  const [activeView, setActiveView] = useState("files");
  const [activeCategoryId, setActiveCategoryId] = useState<bigint | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const defaultCategoriesSeeded = useRef(false);

  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategoryId, setUploadCategoryId] = useState<string>("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: categories = [],
    refetch: refetchCategories,
    isFetched: categoriesFetched,
  } = useQuery<Category[]>({
    queryKey: ["categories", actor ? "authed" : "anon"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCategories();
    },
    enabled: !!actor,
  });

  useEffect(() => {
    if (!actor || !categoriesFetched || defaultCategoriesSeeded.current) return;
    if (categories.length === 0) {
      defaultCategoriesSeeded.current = true;
      const seed = async () => {
        try {
          await Promise.all(
            DEFAULT_CATEGORIES.map((cat) =>
              actor.createCategory({ name: cat.name, color: cat.color }),
            ),
          );
          refetchCategories();
          queryClient.invalidateQueries({ queryKey: ["categories"] });
        } catch {
          // silently ignore seeding errors
        }
      };
      seed();
    } else {
      defaultCategoriesSeeded.current = true;
    }
  }, [
    actor,
    categoriesFetched,
    categories.length,
    refetchCategories,
    queryClient,
  ]);

  const {
    data: documents = [],
    isFetching: docsFetching,
    refetch: refetchDocs,
  } = useQuery<Document[]>({
    queryKey: [
      "documents",
      activeCategoryId?.toString() ?? "all",
      actor ? "authed" : "anon",
    ],
    queryFn: async () => {
      if (!actor) return [];
      if (activeCategoryId !== null) {
        return actor.getDocumentsByCategory(activeCategoryId);
      }
      return actor.getAllDocuments();
    },
    enabled: !!actor,
  });

  const filteredDocs = documents.filter((doc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.fileName.toLowerCase().includes(q)
    );
  });

  const recentDocs = [...documents]
    .sort((a, b) => Number(b.createdAt - a.createdAt))
    .slice(0, 10);

  const displayDocs = activeView === "recent" ? recentDocs : filteredDocs;

  const totalStorage = documents.reduce(
    (sum, d) => sum + Number(d.fileSize),
    0,
  );
  const formatTotalStorage = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadFile(file);
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !actor) return;
    if (!uploadTitle.trim()) {
      toast.error("Please enter a document title");
      return;
    }
    if (!uploadCategoryId) {
      toast.error("Please select a category");
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      const bytes = new Uint8Array(await uploadFile.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });
      await actor.saveDocument({
        categoryId: BigInt(uploadCategoryId),
        title: uploadTitle.trim(),
        blob,
        mimeType: uploadFile.type || "application/octet-stream",
        fileName: uploadFile.name,
        fileSize: BigInt(uploadFile.size),
      });
      toast.success("Document uploaded!");
      setUploadFile(null);
      setUploadTitle("");
      setUploadCategoryId("");
      refetchDocs();
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCategoryCreated = () => {
    refetchCategories();
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const handleDeleteCategory = async (categoryId: bigint) => {
    if (!actor) return;
    try {
      await actor.deleteCategory(categoryId);
      toast.success("Category deleted");
      if (activeCategoryId === categoryId) setActiveCategoryId(null);
      refetchCategories();
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch {
      toast.error(
        "Cannot delete category with documents. Move or delete documents first.",
      );
    }
  };

  const sidebarProps = {
    activeView,
    onViewChange: setActiveView,
    activeCategoryId,
    onCategorySelect: setActiveCategoryId,
    categories,
    onAddCategory: () => setShowAddCategory(true),
    onDeleteCategory: handleDeleteCategory,
    isOpen: sidebarOpen,
    onClose: () => setSidebarOpen(false),
  };

  if (activeView === "settings") {
    return (
      <div className="flex h-screen">
        <Sidebar {...sidebarProps} />
        <main className="lg:ml-[240px] flex-1 overflow-y-auto bg-background">
          <MobileHeader
            username={username}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onMenuOpen={() => setSidebarOpen(true)}
          />
          <ChangePasswordPanel />
        </main>
        <AddCategoryModal
          open={showAddCategory}
          onClose={() => setShowAddCategory(false)}
          onCreated={handleCategoryCreated}
        />
      </div>
    );
  }

  if (activeView === "admin") {
    return (
      <div className="flex h-screen">
        <Sidebar {...sidebarProps} />
        <main className="lg:ml-[240px] flex-1 overflow-y-auto bg-background">
          <MobileHeader
            username={username}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onMenuOpen={() => setSidebarOpen(true)}
          />
          <AdminPage />
        </main>
        <AddCategoryModal
          open={showAddCategory}
          onClose={() => setShowAddCategory(false)}
          onCreated={handleCategoryCreated}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar {...sidebarProps} />

      <main className="lg:ml-[240px] flex-1 overflow-y-auto bg-background flex flex-col">
        {/* Top navbar */}
        <header
          className="sticky top-0 z-20 flex items-center gap-3 px-3 sm:px-6 py-0 h-14 border-b border-white/10"
          style={{ background: "oklch(0.22 0.07 250)" }}
        >
          {/* Hamburger for mobile */}
          <button
            type="button"
            className="lg:hidden text-white/60 hover:text-white transition-colors p-1"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
            <Input
              placeholder="Search..."
              className="pl-9 w-36 sm:w-52 text-sm h-8 bg-white/10 border-white/15 text-white placeholder:text-white/35 focus:bg-white/15 focus:border-white/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-ocid="header.search.input"
            />
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: "oklch(0.55 0.18 250)" }}
            >
              {username?.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block text-white/85 text-sm font-medium">
              {username}
            </span>
          </div>
        </header>

        <div className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              {
                label: "Total Documents",
                value: documents.length,
                icon: CloudUpload,
                color: "oklch(0.55 0.18 250)",
                bg: "oklch(0.93 0.04 250)",
              },
              {
                label: "Categories",
                value: categories.length,
                icon: FolderOpen,
                color: "oklch(0.55 0.18 135)",
                bg: "oklch(0.93 0.04 145)",
              },
              {
                label: "Storage Used",
                value:
                  totalStorage > 0 ? formatTotalStorage(totalStorage) : "0 KB",
                icon: HardDrive,
                color: "oklch(0.55 0.18 50)",
                bg: "oklch(0.94 0.04 60)",
              },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="bg-card rounded-md border border-border px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-4 shadow-sm"
              >
                <div
                  className="h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: bg }}
                >
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground leading-none">
                    {value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Upload Zone */}
          {activeView === "files" && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={onFileSelect}
                accept="*/*"
              />
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={cn(
                  "bg-card border-2 border-dashed rounded-md transition-all cursor-pointer",
                  isDragging
                    ? "border-primary/60 bg-primary/5"
                    : "border-slate-200 hover:border-primary/40 hover:bg-blue-50/30",
                  uploadFile ? "cursor-default" : "",
                )}
                data-ocid="files.dropzone"
              >
                {!uploadFile ? (
                  <button
                    type="button"
                    className="flex flex-col items-center justify-center py-6 sm:py-8 gap-2 w-full border-none bg-transparent cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center"
                      style={{ background: "oklch(0.93 0.04 250)" }}
                    >
                      <CloudUpload
                        className="h-6 w-6"
                        style={{ color: "oklch(0.55 0.18 250)" }}
                      />
                    </div>
                    <div className="text-center px-4">
                      <p className="font-semibold text-sm text-foreground">
                        <span className="hidden sm:inline">
                          Drag &amp; drop files here or{" "}
                        </span>
                        <span style={{ color: "oklch(0.55 0.18 250)" }}>
                          Tap to browse files
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Max 200 MB per file
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3 sm:gap-4 mb-4">
                      <div
                        className="h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: "oklch(0.93 0.04 250)" }}
                      >
                        <Upload
                          className="h-5 w-5"
                          style={{ color: "oklch(0.55 0.18 250)" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {uploadFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadFile(null);
                          setUploadTitle("");
                        }}
                        className="text-muted-foreground hover:text-foreground p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="upload-title"
                          className="text-xs font-medium text-foreground mb-1 block"
                        >
                          Document Title
                        </label>
                        <Input
                          id="upload-title"
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          placeholder="Enter document title"
                          onClick={(e) => e.stopPropagation()}
                          className="h-9"
                          data-ocid="upload.title.input"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="upload-category"
                          className="text-xs font-medium text-foreground mb-1 block"
                        >
                          Category
                        </label>
                        <Select
                          value={uploadCategoryId}
                          onValueChange={setUploadCategoryId}
                        >
                          <SelectTrigger
                            id="upload-category"
                            onClick={(e) => e.stopPropagation()}
                            className="h-9"
                            data-ocid="upload.category.select"
                          >
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem
                                key={cat.id.toString()}
                                value={cat.id.toString()}
                              >
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {uploading && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${uploadProgress}%`,
                              background: "oklch(0.55 0.18 250)",
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end mt-4">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpload();
                        }}
                        disabled={uploading || !uploadCategoryId}
                        className="h-9 text-sm font-semibold w-full sm:w-auto"
                        style={{
                          background: "oklch(0.28 0.09 250)",
                          color: "white",
                        }}
                        data-ocid="upload.submit_button"
                      >
                        {uploading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {uploading ? "Uploading..." : "Upload Document"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents section */}
          <div>
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-base font-bold text-foreground truncate">
                  {activeView === "recent"
                    ? "Recent Documents"
                    : activeCategoryId
                      ? (categories.find((c) => c.id === activeCategoryId)
                          ?.name ?? "Documents")
                      : "All Documents"}
                </h2>
                <Badge
                  variant="secondary"
                  className="text-xs font-normal bg-blue-50 text-blue-700 border border-blue-100 flex-shrink-0"
                >
                  {displayDocs.length}
                </Badge>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-semibold"
                  style={{ background: "oklch(0.28 0.09 250)", color: "white" }}
                  onClick={() => {
                    setActiveView("files");
                    fileInputRef.current?.click();
                  }}
                  data-ocid="header.upload.button"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Upload</span>
                </Button>
              </div>
            </div>

            {/* Category filter pills - horizontally scrollable on mobile */}
            {activeView === "files" && categories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-hide">
                <button
                  type="button"
                  onClick={() => setActiveCategoryId(null)}
                  className={cn(
                    "text-xs px-3 py-1 rounded-full border transition-all font-medium whitespace-nowrap flex-shrink-0",
                    activeCategoryId === null
                      ? "text-white border-transparent"
                      : "border-slate-200 text-muted-foreground hover:border-primary/50",
                  )}
                  style={
                    activeCategoryId === null
                      ? { background: "oklch(0.28 0.09 250)" }
                      : {}
                  }
                  data-ocid="files.filter.tab"
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    type="button"
                    key={cat.id.toString()}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={cn(
                      "text-xs px-3 py-1 rounded-full border transition-all font-medium whitespace-nowrap flex-shrink-0",
                      activeCategoryId === cat.id
                        ? "text-white border-transparent"
                        : "border-slate-200 text-muted-foreground hover:border-primary/50",
                    )}
                    style={
                      activeCategoryId === cat.id
                        ? { background: "oklch(0.28 0.09 250)" }
                        : {}
                    }
                    data-ocid="files.category.tab"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Document list */}
            <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden">
              {/* List header - hidden on mobile */}
              <div className="hidden sm:flex items-center gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                <div className="w-9 flex-shrink-0" />
                <div className="flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Document
                </div>
                <div className="hidden sm:block w-28 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-shrink-0">
                  Category
                </div>
                <div className="hidden md:block w-14 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-shrink-0">
                  Type
                </div>
                <div className="hidden md:block w-16 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-shrink-0 text-right">
                  Size
                </div>
                <div className="hidden lg:block w-24 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-shrink-0 text-right">
                  Date
                </div>
                <div className="w-20 flex-shrink-0" />
              </div>

              {docsFetching ? (
                <div className="p-4 space-y-3" data-ocid="files.loading_state">
                  {Array.from({ length: 5 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : displayDocs.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-12 sm:py-16 text-center"
                  data-ocid="files.empty_state"
                >
                  <div
                    className="h-14 w-14 rounded-full flex items-center justify-center mb-3"
                    style={{ background: "oklch(0.93 0.04 250)" }}
                  >
                    <CloudUpload
                      className="h-7 w-7"
                      style={{ color: "oklch(0.55 0.18 250)" }}
                    />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">
                    {searchQuery
                      ? "No documents match your search"
                      : "No documents yet"}
                  </h3>
                  <p className="text-xs text-muted-foreground px-4">
                    {searchQuery
                      ? "Try a different search term"
                      : "Upload your first document using the upload area above"}
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {displayDocs.map((doc, i) => (
                    <motion.div
                      key={doc.id.toString()}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12, delay: i * 0.02 }}
                    >
                      <DocumentRow
                        doc={doc}
                        categories={categories}
                        index={i + 1}
                        onView={setViewingDoc}
                        onDeleted={() => {
                          refetchDocs();
                          queryClient.invalidateQueries({
                            queryKey: ["documents"],
                          });
                        }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer
          className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs border-t"
          style={{
            background: "oklch(0.22 0.07 250)",
            borderColor: "oklch(0.28 0.07 250)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-white/60 font-medium">Infinexy Solution</span>
            <span className="text-white/25">—</span>
            <span className="text-white/35">Secure Document Storage</span>
          </div>
          <div className="text-white/30">
            &copy; {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/55 transition-colors"
            >
              Built with love using caffeine.ai
            </a>
          </div>
        </footer>
      </main>

      <AddCategoryModal
        open={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onCreated={handleCategoryCreated}
      />

      <DocumentViewerModal
        doc={viewingDoc}
        onClose={() => setViewingDoc(null)}
      />
    </div>
  );
}

function MobileHeader({
  username,
  searchQuery,
  onSearchChange,
  onMenuOpen,
}: {
  username: string | null;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onMenuOpen: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-3 sm:px-6 py-0 h-14 border-b border-white/10"
      style={{ background: "oklch(0.22 0.07 250)" }}
    >
      <button
        type="button"
        className="lg:hidden text-white/60 hover:text-white transition-colors p-1"
        onClick={onMenuOpen}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
        <Input
          placeholder="Search..."
          className="pl-9 w-36 sm:w-52 text-sm h-8 bg-white/10 border-white/15 text-white placeholder:text-white/35 focus:bg-white/15 focus:border-white/30"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: "oklch(0.55 0.18 250)" }}
        >
          {username?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
