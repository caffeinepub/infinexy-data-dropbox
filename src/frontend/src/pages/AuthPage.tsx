import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Smartphone,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regAdminCode, setRegAdminCode] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword) {
      toast.error("Please enter username and password");
      return;
    }
    setLoading(true);
    try {
      const result = await login(loginUsername.trim(), loginPassword);
      if ("err" in result) {
        toast.error(result.err);
      } else {
        toast.success("Welcome back!");
      }
    } catch {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regPassword) {
      toast.error("Please fill all fields");
      return;
    }
    if (regPassword !== regConfirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (regPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const result = await register(
        regUsername.trim(),
        regPassword,
        regAdminCode.trim() || undefined,
      );
      if ("err" in result) {
        toast.error(result.err);
      } else {
        toast.success("Account created! Please login.");
      }
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - navy branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[42%] p-10"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.22 0.09 250) 0%, oklch(0.18 0.07 255) 100%)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className="flex items-center gap-4 mb-16">
            <img
              src="/assets/uploads/whatsapp_image_2026-03-29_at_12.26.17_am-019d35d9-7cec-72dd-a6c0-a1c5fffcbe53-1.jpeg"
              alt="Infinexy"
              className="h-12 w-auto object-contain"
            />
            <p className="text-white/50 text-xs tracking-wider uppercase">
              Data Dropbox
            </p>
          </div>

          {/* Tagline */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white leading-tight mb-3">
              Secure. Simple.
              <br />
              <span style={{ color: "oklch(0.72 0.18 250)" }}>Official.</span>
            </h1>
            <p className="text-white/60 text-base leading-relaxed">
              A professional document management platform for storing,
              organizing and accessing your important files anywhere.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-4">
            {[
              { icon: ShieldCheck, text: "100% secure encrypted storage" },
              {
                icon: Smartphone,
                text: "Access your documents from any device",
              },
              {
                icon: CheckCircle2,
                text: "Government-grade document management",
              },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "oklch(0.55 0.18 250 / 0.25)" }}
                >
                  <Icon
                    className="h-4 w-4"
                    style={{ color: "oklch(0.72 0.18 250)" }}
                  />
                </div>
                <span className="text-white/75 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="text-white/25 text-xs">
          &copy; {new Date().getFullYear()} Infinexy Solution. All rights
          reserved.
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-10">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <img
            src="/assets/uploads/whatsapp_image_2026-03-29_at_12.26.17_am-019d35d9-7cec-72dd-a6c0-a1c5fffcbe53-1.jpeg"
            alt="Infinexy"
            className="h-10 w-auto object-contain"
          />
          <p className="text-muted-foreground text-xs">Data Dropbox</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="mb-7">
            <h2
              className="text-2xl font-bold"
              style={{ color: "oklch(0.18 0.025 255)" }}
            >
              Welcome Back
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Sign in to access your documents
            </p>
          </div>

          <Tabs defaultValue="login">
            <TabsList className="w-full mb-6 rounded-md bg-slate-100 p-1 h-10">
              <TabsTrigger
                value="login"
                className="flex-1 rounded text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                data-ocid="auth.login.tab"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="flex-1 rounded text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                data-ocid="auth.register.tab"
              >
                Create Account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="login-username"
                    className="text-sm font-medium text-foreground"
                  >
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-username"
                      placeholder="Enter your username"
                      className="pl-9 h-10 border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      autoComplete="username"
                      data-ocid="auth.login.input"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="login-password"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-9 h-10 border-slate-200"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      autoComplete="current-password"
                      data-ocid="auth.password.input"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-10 font-semibold text-sm mt-2"
                  style={{ background: "oklch(0.28 0.09 250)", color: "white" }}
                  disabled={loading}
                  data-ocid="auth.login.submit_button"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="reg-username"
                    className="text-sm font-medium text-foreground"
                  >
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-username"
                      placeholder="Choose a username"
                      className="pl-9 h-10 border-slate-200"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      autoComplete="username"
                      data-ocid="auth.register.input"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="reg-password"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      className="pl-9 h-10 border-slate-200"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      autoComplete="new-password"
                      data-ocid="auth.reg_password.input"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="reg-confirm"
                    className="text-sm font-medium text-foreground"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-confirm"
                      type="password"
                      placeholder="Confirm your password"
                      className="pl-9 h-10 border-slate-200"
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      autoComplete="new-password"
                      data-ocid="auth.confirm_password.input"
                    />
                  </div>
                </div>

                {/* Admin code collapsible */}
                <div className="border border-slate-200 rounded-md">
                  <button
                    type="button"
                    onClick={() => setShowAdminCode(!showAdminCode)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound className="h-3.5 w-3.5" />
                      Have an admin code?
                    </span>
                    <span className="text-xs">
                      {showAdminCode ? "Hide" : "Show"}
                    </span>
                  </button>
                  {showAdminCode && (
                    <div className="px-3 pb-3 border-t border-slate-100 pt-2">
                      <Input
                        type="password"
                        placeholder="Enter admin code"
                        className="h-9 border-slate-200 text-sm"
                        value={regAdminCode}
                        onChange={(e) => setRegAdminCode(e.target.value)}
                        autoComplete="off"
                        data-ocid="auth.admin_code.input"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Leave blank to register as a regular user
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 font-semibold text-sm"
                  style={{ background: "oklch(0.28 0.09 250)", color: "white" }}
                  disabled={loading}
                  data-ocid="auth.register.submit_button"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Multi-device access — use the same credentials on any device
          </p>
        </motion.div>
      </div>
    </div>
  );
}
