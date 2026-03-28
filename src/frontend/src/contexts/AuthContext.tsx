import { Ed25519KeyIdentity } from "@dfinity/identity";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { UserProfile, backendInterface } from "../backend";
import { createActorWithConfig } from "../config";

interface AuthState {
  username: string | null;
  profile: UserProfile | null;
  identity: Ed25519KeyIdentity | null;
  actor: backendInterface | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isInitializing: boolean;
}

interface AuthContextType extends AuthState {
  login: (
    username: string,
    password: string,
  ) => Promise<{ ok: UserProfile } | { err: string }>;
  register: (
    username: string,
    password: string,
    adminCode?: string,
  ) => Promise<{ ok: null } | { err: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function createIdentityFromUsername(
  username: string,
): Promise<Ed25519KeyIdentity> {
  const encoded = new TextEncoder().encode(username);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const seed = new Uint8Array(hashBuffer);
  return Ed25519KeyIdentity.generate(seed);
}

const STORAGE_KEY = "infinexy_session";

interface StoredSession {
  username: string;
  passwordHash: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    username: null,
    profile: null,
    identity: null,
    actor: null,
    isLoggedIn: false,
    isAdmin: false,
    isInitializing: true,
  });

  const buildAuthenticatedActor = useCallback(
    async (identity: Ed25519KeyIdentity) => {
      return createActorWithConfig({ agentOptions: { identity } });
    },
    [],
  );

  const initFromSession = useCallback(
    async (session: StoredSession) => {
      try {
        const identity = await createIdentityFromUsername(session.username);
        const actor = await buildAuthenticatedActor(identity);
        const result = await actor.verifyLogin(
          session.username,
          session.passwordHash,
        );
        if ("ok" in result) {
          const profile = result.ok;
          setState({
            username: session.username,
            profile,
            identity,
            actor,
            isLoggedIn: true,
            isAdmin: profile.role === "admin",
            isInitializing: false,
          });
          return true;
        }
      } catch (e) {
        console.error("Auto-login failed:", e);
      }
      setState((prev) => ({ ...prev, isInitializing: false }));
      return false;
    },
    [buildAuthenticatedActor],
  );

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const session = JSON.parse(stored) as StoredSession;
        initFromSession(session);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setState((prev) => ({ ...prev, isInitializing: false }));
      }
    } else {
      setState((prev) => ({ ...prev, isInitializing: false }));
    }
  }, [initFromSession]);

  const login = useCallback(
    async (username: string, password: string) => {
      const passwordHash = await sha256Hex(password);
      const identity = await createIdentityFromUsername(username);
      const actor = await buildAuthenticatedActor(identity);
      const result = await actor.verifyLogin(username, passwordHash);
      if ("ok" in result) {
        const profile = result.ok;
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ username, passwordHash }),
        );
        setState({
          username,
          profile,
          identity,
          actor,
          isLoggedIn: true,
          isAdmin: profile.role === "admin",
          isInitializing: false,
        });
        return result;
      }
      return result;
    },
    [buildAuthenticatedActor],
  );

  const register = useCallback(
    async (username: string, password: string, adminCode?: string) => {
      const passwordHash = await sha256Hex(password);
      const identity = await createIdentityFromUsername(username);
      const actor = await buildAuthenticatedActor(identity);
      const result = await actor.register(
        username,
        passwordHash,
        adminCode ?? null,
      );
      return result;
    },
    [buildAuthenticatedActor],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      username: null,
      profile: null,
      identity: null,
      actor: null,
      isLoggedIn: false,
      isAdmin: false,
      isInitializing: false,
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!state.actor) return;
    const profile = await state.actor.getCallerUserProfile();
    if (profile) {
      setState((prev) => ({
        ...prev,
        profile,
        isAdmin: profile.role === "admin",
      }));
    }
  }, [state.actor]);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export async function sha256HexPublic(input: string): Promise<string> {
  return sha256Hex(input);
}
