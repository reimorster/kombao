import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

import type { LoginResponse as AuthLoginResponse, AuthUser } from "../types/auth";
import type { AuthFormState } from "../types/app";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
const TOKEN_STORAGE_KEY = "kanban_token";

export function useSession() {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_STORAGE_KEY) ?? "");
  const [authForm, setAuthForm] = useState<AuthFormState>({ username: "", password: "" });
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const clearError = useCallback(() => {
    setError("");
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken("");
    setCurrentUser(null);
    setError("");
  }, []);

  const request = useCallback(
    async function request<T>(path: string, options: RequestInit = {}) {
      const headers = new Headers(options.headers ?? {});
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        logout();
        throw new Error("Sessão expirada.");
      }

      if (!response.ok) {
        let message = "Erro inesperado.";
        try {
          const payload = (await response.json()) as { detail?: string | Array<{ msg: string }> };
          if (typeof payload.detail === "string") {
            message = payload.detail;
          } else if (Array.isArray(payload.detail)) {
            message = payload.detail.map((e) => e.msg).join("; ");
          }
        } catch {
          message = response.statusText || message;
        }
        throw new Error(message);
      }

      if (response.status === 204) {
        return null as T;
      }

      return (await response.json()) as T;
    },
    [logout, token],
  );

  const fetchCurrentUser = useCallback(async () => {
    setLoading(true);
    clearError();
    try {
      const user = await request<AuthUser>("/auth/me");
      setCurrentUser(user);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }, [clearError, request]);

  useEffect(() => {
    if (!token) {
      return;
    }
    void fetchCurrentUser();
  }, [fetchCurrentUser, token]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    clearError();

    try {
      const data = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(authForm),
      }).then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { detail?: string };
          throw new Error(payload.detail ?? "Falha no login.");
        }
        return (await response.json()) as AuthLoginResponse;
      });

      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setToken(data.token);
      setCurrentUser(data.user);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function changeRequiredPassword(currentPassword: string, newPassword: string) {
    setLoading(true);
    clearError();
    try {
      const user = await request<AuthUser>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setCurrentUser(user);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(displayName: string, email: string) {
    setLoading(true);
    clearError();
    try {
      const user = await request<AuthUser>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          display_name: displayName,
          email: email || null,
        }),
      });
      setCurrentUser(user);
      return true;
    } catch (requestError) {
      setError((requestError as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  return {
    authForm,
    changeRequiredPassword,
    clearError,
    currentUser,
    error,
    loading,
    login,
    logout,
    request,
    setAuthForm,
    token,
    updateProfile,
  };
}
