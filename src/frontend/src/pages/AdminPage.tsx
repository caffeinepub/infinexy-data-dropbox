import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import {
  KeyRound,
  Loader2,
  Lock,
  Shield,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import { useAuth } from "../contexts/AuthContext";

async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function formatDate(time: bigint): string {
  const ms = Number(time / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminPage() {
  const { actor } = useAuth();

  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [changingPass, setChangingPass] = useState(false);

  const [newAdminCode, setNewAdminCode] = useState("");
  const [updatingCode, setUpdatingCode] = useState(false);

  const { data: users = [], isFetching: usersFetching } = useQuery<
    UserProfile[]
  >({
    queryKey: ["admin-users", actor ? "authed" : "anon"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllUsers();
    },
    enabled: !!actor,
  });

  const adminCount = users.filter((u) => u.role === "admin").length;
  const regularCount = users.length - adminCount;

  const handleDeleteUser = async (user: UserProfile) => {
    if (!actor) return;
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`))
      return;
    try {
      toast.info(
        "User deletion requires principal lookup. Feature coming soon.",
      );
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
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
    setChangingPass(true);
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
      setChangingPass(false);
    }
  };

  const handleUpdateAdminCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    if (!newAdminCode.trim()) {
      toast.error("Please enter a new admin code");
      return;
    }
    setUpdatingCode(true);
    try {
      const result = (await (actor as any).updateAdminCode(
        newAdminCode.trim(),
      )) as { ok: null } | { err: string };
      if ("ok" in result) {
        toast.success("Admin code updated successfully!");
        setNewAdminCode("");
      } else if ("err" in result) {
        toast.error(result.err);
      }
    } catch {
      toast.error("Failed to update admin code");
    } finally {
      setUpdatingCode(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div
        className="flex items-center gap-4 p-5 rounded-md mb-6 border border-border"
        style={{ background: "oklch(0.22 0.07 250)" }}
      >
        <div
          className="h-11 w-11 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: "oklch(0.55 0.18 250 / 0.3)" }}
        >
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
          <p className="text-white/50 text-sm">
            Manage users, settings, and system configuration
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Total Users",
            value: users.length,
            icon: Users,
            color: "oklch(0.55 0.18 250)",
            bg: "oklch(0.93 0.04 250)",
          },
          {
            label: "Administrators",
            value: adminCount,
            icon: Shield,
            color: "oklch(0.55 0.18 30)",
            bg: "oklch(0.94 0.04 35)",
          },
          {
            label: "Regular Users",
            value: regularCount,
            icon: User,
            color: "oklch(0.55 0.18 145)",
            bg: "oklch(0.93 0.04 145)",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-card rounded-md border border-border px-5 py-4 flex items-center gap-4 shadow-sm"
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
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList className="mb-5 bg-slate-100">
          <TabsTrigger
            value="users"
            className="gap-2 text-sm"
            data-ocid="admin.users.tab"
          >
            <Users className="h-3.5 w-3.5" />
            Users
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="gap-2 text-sm"
            data-ocid="admin.settings.tab"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden">
            <div
              className="px-4 py-3 border-b border-border flex items-center justify-between"
              style={{ background: "oklch(0.97 0.005 250)" }}
            >
              <h2 className="font-semibold text-sm text-foreground">
                Registered Users
              </h2>
              <Badge
                variant="secondary"
                className="text-xs bg-blue-50 text-blue-700 border border-blue-100"
              >
                {users.length} total
              </Badge>
            </div>
            {usersFetching ? (
              <div
                className="p-4 space-y-2"
                data-ocid="admin.users.loading_state"
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <Table data-ocid="admin.users.table">
                <TableHeader>
                  <TableRow className="bg-slate-50/70">
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Username
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Role
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Joined
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-10 text-sm"
                        data-ocid="admin.users.empty_state"
                      >
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user, i) => (
                      <TableRow
                        key={user.username}
                        className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                        data-ocid={`admin.users.item.${i + 1}`}
                      >
                        <TableCell className="font-medium text-sm">
                          {user.username}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "admin" ? "default" : "secondary"
                            }
                            className={`text-xs ${
                              user.role === "admin"
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteUser(user)}
                            data-ocid={`admin.users.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-5 max-w-lg">
            {/* Change Password */}
            <div className="bg-card rounded-md border border-border shadow-sm">
              <div
                className="px-5 py-3.5 border-b border-border flex items-center gap-2"
                style={{ background: "oklch(0.97 0.005 250)" }}
              >
                <Lock
                  className="h-4 w-4"
                  style={{ color: "oklch(0.55 0.18 250)" }}
                />
                <h2 className="font-semibold text-sm text-foreground">
                  Change Password
                </h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-muted-foreground mb-4">
                  Update your account password. Changes apply across all
                  devices.
                </p>
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="old-pass" className="text-sm font-medium">
                      Current Password
                    </Label>
                    <Input
                      id="old-pass"
                      type="password"
                      value={oldPass}
                      onChange={(e) => setOldPass(e.target.value)}
                      placeholder="Enter current password"
                      className="h-9 border-slate-200"
                      data-ocid="admin.old_password.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-pass" className="text-sm font-medium">
                      New Password
                    </Label>
                    <Input
                      id="new-pass"
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="Enter new password"
                      className="h-9 border-slate-200"
                      data-ocid="admin.new_password.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="confirm-pass"
                      className="text-sm font-medium"
                    >
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm-pass"
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Confirm new password"
                      className="h-9 border-slate-200"
                      data-ocid="admin.confirm_password.input"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={changingPass}
                    className="h-9 text-sm font-semibold"
                    style={{
                      background: "oklch(0.28 0.09 250)",
                      color: "white",
                    }}
                    data-ocid="admin.change_password.submit_button"
                  >
                    {changingPass ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {changingPass ? "Updating..." : "Change Password"}
                  </Button>
                </form>
              </div>
            </div>

            <Separator />

            {/* Admin Code */}
            <div className="bg-card rounded-md border border-border shadow-sm">
              <div
                className="px-5 py-3.5 border-b border-border flex items-center gap-2"
                style={{ background: "oklch(0.97 0.005 250)" }}
              >
                <KeyRound
                  className="h-4 w-4"
                  style={{ color: "oklch(0.55 0.18 250)" }}
                />
                <h2 className="font-semibold text-sm text-foreground">
                  Admin Code
                </h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-muted-foreground mb-4">
                  Set the secret code required to register new admin accounts.
                </p>
                <form onSubmit={handleUpdateAdminCode} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="new-admin-code"
                      className="text-sm font-medium"
                    >
                      New Admin Code
                    </Label>
                    <Input
                      id="new-admin-code"
                      type="password"
                      value={newAdminCode}
                      onChange={(e) => setNewAdminCode(e.target.value)}
                      placeholder="Enter new admin code"
                      className="h-9 border-slate-200"
                      data-ocid="admin.admin_code.input"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={updatingCode}
                    variant="outline"
                    className="h-9 text-sm font-semibold border-slate-300"
                    data-ocid="admin.admin_code.submit_button"
                  >
                    {updatingCode ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {updatingCode ? "Updating..." : "Update Admin Code"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
