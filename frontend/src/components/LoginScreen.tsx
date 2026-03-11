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
  return (
    <main className="login-shell">
      <section className="login-panel">
        <div>
          <p className="eyebrow">Kombão</p>
          <h1>Dead simple self-hosted Kanban</h1>
          <p className="muted">Inserir suas credenciais</p>
        </div>
        <form onSubmit={onSubmit} className="login-form">
          <label>
            Usuario
            <input
              value={authForm.username}
              onChange={(event) =>
                onChange((current) => ({ ...current, username: event.target.value }))
              }
              placeholder="admin"
              autoComplete="username"
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={authForm.password}
              onChange={(event) =>
                onChange((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="admin"
              autoComplete="current-password"
            />
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
