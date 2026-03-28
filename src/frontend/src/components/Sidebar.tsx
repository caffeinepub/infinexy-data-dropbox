import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Clock,
  Files,
  FolderPlus,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Category } from "../backend";
import { useAuth } from "../contexts/AuthContext";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  activeCategoryId: bigint | null;
  onCategorySelect: (id: bigint | null) => void;
  categories: Category[];
  onAddCategory: () => void;
  onDeleteCategory: (id: bigint) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "files", label: "My Documents", icon: Files },
  { id: "recent", label: "Recent", icon: Clock },
  { id: "trash", label: "Deleted", icon: Trash2 },
];

const CATEGORY_COLORS: Record<string, string> = {
  blue: "#3B82F6",
  green: "#22C55E",
  red: "#EF4444",
  yellow: "#F59E0B",
  purple: "#A855F7",
  pink: "#EC4899",
};

export default function Sidebar({
  activeView,
  onViewChange,
  activeCategoryId,
  onCategorySelect,
  categories,
  onAddCategory,
  onDeleteCategory,
  isOpen = true,
  onClose,
}: SidebarProps) {
  const { username, isAdmin, logout } = useAuth();
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);
  const [hoveredCatId, setHoveredCatId] = useState<bigint | null>(null);

  const handleNav = (view: string) => {
    onViewChange(view);
    onCategorySelect(null);
    onClose?.();
  };

  const handleCategorySelect = (id: bigint) => {
    onCategorySelect(id);
    onViewChange("files");
    onClose?.();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
          onKeyDown={onClose}
          role="button"
          tabIndex={-1}
          aria-label="Close menu"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-[240px] flex flex-col z-30 border-r transition-transform duration-300",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{
          background: "oklch(0.22 0.07 250)",
          borderColor: "oklch(0.28 0.07 250)",
        }}
      >
        {/* Brand */}
        <div
          className="flex items-center gap-3 px-4 py-4 border-b"
          style={{ borderColor: "oklch(0.30 0.07 250)" }}
        >
          <img
            src="/assets/uploads/whatsapp_image_2026-03-29_at_12.26.17_am-019d35d9-7cec-72dd-a6c0-a1c5fffcbe53-1.jpeg"
            alt="Infinexy"
            className="h-9 w-auto object-contain flex-shrink-0 max-w-[140px]"
          />
          <p className="text-white/40 text-[10px] tracking-wider uppercase flex-1">
            Data Dropbox
          </p>
          {/* Mobile close button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden text-white/40 hover:text-white/80 transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 pt-3 pb-2">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeView === item.id && activeCategoryId === null;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-all text-left",
                    isActive
                      ? "text-white font-medium border-l-2"
                      : "text-white/55 hover:text-white/90 hover:bg-white/5",
                  )}
                  style={
                    isActive
                      ? {
                          background: "oklch(0.30 0.09 250)",
                          borderLeftColor: "oklch(0.65 0.2 250)",
                        }
                      : {}
                  }
                  data-ocid={`nav.${item.id}.link`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}

            {isAdmin && (
              <button
                type="button"
                onClick={() => handleNav("admin")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-all text-left",
                  activeView === "admin"
                    ? "text-white font-medium border-l-2"
                    : "text-white/55 hover:text-white/90 hover:bg-white/5",
                )}
                style={
                  activeView === "admin"
                    ? {
                        background: "oklch(0.30 0.09 250)",
                        borderLeftColor: "oklch(0.65 0.2 250)",
                      }
                    : {}
                }
                data-ocid="nav.admin.link"
              >
                <Shield className="h-4 w-4 flex-shrink-0" />
                Admin Panel
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setCategoriesExpanded(!categoriesExpanded)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/30 hover:text-white/50 transition-colors"
            >
              <span>Categories</span>
              <ChevronRight
                className={cn(
                  "h-3 w-3 transition-transform",
                  categoriesExpanded && "rotate-90",
                )}
              />
            </button>

            {categoriesExpanded && (
              <div className="mt-1 space-y-0.5">
                {categories.map((cat) => {
                  const isActive = activeCategoryId === cat.id;
                  const color = cat.color
                    ? (CATEGORY_COLORS[cat.color] ?? cat.color)
                    : "#3B82F6";
                  const isHovered = hoveredCatId === cat.id;
                  return (
                    <div
                      key={cat.id.toString()}
                      className="relative group"
                      onMouseEnter={() => setHoveredCatId(cat.id)}
                      onMouseLeave={() => setHoveredCatId(null)}
                    >
                      <button
                        type="button"
                        onClick={() => handleCategorySelect(cat.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-all text-left pr-8",
                          isActive
                            ? "text-white font-medium border-l-2"
                            : "text-white/55 hover:text-white/90 hover:bg-white/5",
                        )}
                        style={
                          isActive
                            ? {
                                background: "oklch(0.30 0.09 250)",
                                borderLeftColor: "oklch(0.65 0.2 250)",
                              }
                            : {}
                        }
                        data-ocid="sidebar.category.link"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-sm flex-shrink-0"
                          style={{ background: color }}
                        />
                        <span className="truncate">{cat.name}</span>
                      </button>
                      {isHovered && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCategory(cat.id);
                          }}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/15 transition-colors"
                          title="Delete category"
                          data-ocid="sidebar.category.delete_button"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    onAddCategory();
                    onClose?.();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-white/35 hover:text-white/60 hover:bg-white/5 transition-colors text-left"
                  data-ocid="sidebar.add_category.button"
                >
                  <FolderPlus className="h-4 w-4" />
                  <span>Add Category</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* User / Logout */}
        <div
          className="px-2 py-3 border-t"
          style={{ borderColor: "oklch(0.30 0.07 250)" }}
        >
          <div className="flex items-center gap-2.5 px-3 py-2 rounded mb-1">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
              style={{ background: "oklch(0.55 0.18 250)" }}
            >
              {username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">
                {username}
              </p>
              <p className="text-white/40 text-[10px]">
                {isAdmin ? "Administrator" : "User"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start gap-2 text-white/45 hover:text-white hover:bg-white/5 text-xs h-8"
            data-ocid="nav.logout.button"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </Button>
          <button
            type="button"
            onClick={() => handleNav("settings")}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs text-white/35 hover:text-white/60 hover:bg-white/5 transition-colors"
            data-ocid="nav.settings.link"
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleNav("admin")}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs text-white/35 hover:text-white/60 hover:bg-white/5 transition-colors"
              data-ocid="nav.admin.panel.link"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin Panel
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
