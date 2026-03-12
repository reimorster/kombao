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
          <h2>Dead simple self-hosted Kanban</h2>
          <p className="muted">Insira suas credenciais</p>
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
            <input
              type="password"
              value={authForm.password}
              onChange={(event) =>
                onChange((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="senha"
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
