import { useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";

type LoginScreenProps = {
  authForm: {
    username: string;
    password: string;
  };
  error: string;
  loading: boolean;
  onChange: Dispatch<
    SetStateAction<{
      username: string;
      password: string;
    }>
  >;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function LoginScreen({ authForm, error, loading, onChange, onSubmit }: LoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-header">
          <p className="eyebrow">Kombão</p>
          <h2>Dead simple<br />self-hosted Kanban</h2>
          <p className="muted">Insira suas credenciais para continuar</p>
        </div>
        <form onSubmit={onSubmit} className="login-form">
          <label>
            Usuário
            <input
              value={authForm.username}
              onChange={(event) =>
                onChange((current) => ({ ...current, username: event.target.value }))
              }
              placeholder="nome de usuário"
              autoComplete="username"
            />
          </label>
          <label>
            Senha
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={authForm.password}
                onChange={(event) =>
                  onChange((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="senha"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"} />
              </button>
            </div>
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
