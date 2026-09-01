import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { firebaseAuth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { TRPCClientError } from "@trpc/client";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

type AuthUser = {
  id: number | string;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string;
  role: "user" | "admin";
  photoURL?: string | null;
};

function mapFirebaseUser(user: FirebaseUser): AuthUser {
  return {
    id: user.uid,
    openId: user.uid,
    name: user.displayName,
    email: user.email,
    loginMethod: "google",
    role: "user",
    photoURL: user.photoURL,
  };
}

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const [firebaseUser, setFirebaseUser] = useState<AuthUser | null>(null);
  const [firebaseLoading, setFirebaseLoading] = useState(isFirebaseConfigured);
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !isFirebaseConfigured,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => utils.auth.me.setData(undefined, null),
  });

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth) return;
    return onAuthStateChanged(firebaseAuth, user => {
      setFirebaseUser(user ? mapFirebaseUser(user) : null);
      setFirebaseLoading(false);
    });
  }, []);

  const logout = useCallback(async () => {
    if (isFirebaseConfigured && firebaseAuth) {
      await firebaseSignOut(firebaseAuth);
      setFirebaseUser(null);
      return;
    }
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (!(error instanceof TRPCClientError) || error.data?.code !== "UNAUTHORIZED") throw error;
    } finally {
      try { sessionStorage.removeItem("manus-cookie"); } catch {}
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const signIn = useCallback(async () => {
    if (isFirebaseConfigured && firebaseAuth) {
      await signInWithPopup(firebaseAuth, googleProvider);
      return;
    }
    startLogin();
  }, []);

  const state = useMemo(() => {
    const user = isFirebaseConfigured ? firebaseUser : (meQuery.data ?? null);
    try {
      localStorage.setItem("streamwise-runtime-user-info", JSON.stringify(user));
    } catch {}
    return {
      user,
      loading: isFirebaseConfigured ? firebaseLoading : meQuery.isLoading || logoutMutation.isPending,
      error: isFirebaseConfigured ? null : meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(user),
    };
  }, [firebaseLoading, firebaseUser, logoutMutation.error, logoutMutation.isPending, meQuery.data, meQuery.error, meQuery.isLoading]);

  useEffect(() => {
    if (!redirectOnUnauthenticated || state.loading || state.user || typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;
    if (redirectPath) window.location.href = redirectPath;
    else signIn();
  }, [redirectOnUnauthenticated, redirectPath, signIn, state.loading, state.user]);

  return { ...state, signIn, logout, refresh: () => meQuery.refetch() };
}
