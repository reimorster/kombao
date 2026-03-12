import { useState } from "react";
import type { FormEvent } from "react";
import type { AuthUser } from "../types/auth";

type PasswordResetScreenProps = {
  error: string;
  loading: boolean;
  user: AuthUser;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
};

export function PasswordResetScreen({
  error,
  loading,
  user,
  onSubmit,
}: PasswordResetScreenProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentPassword || newPassword.trim().length < 8) {
      return;
    }
    await onSubmit(currentPassword, newPassword.trim());
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div>
          <p className="eyebrow">Primeiro acesso</p>
          <h1>Troca de senha obrigatória</h1>
          <p className="muted">
            O usuário <strong>{user.username}</strong> foi criado a partir do bootstrap do backend.
            Antes de usar o sistema, defina uma nova senha.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Senha atual
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          <label>
            Nova senha
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" disabled={loading || currentPassword.length === 0 || newPassword.length < 8}>
            {loading ? "Atualizando..." : "Atualizar senha"}
          </button>
        </form>
      </section>
    </main>
  );
}
