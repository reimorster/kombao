import { AuthenticatedApp } from "./components/AuthenticatedApp";
import { LoginScreen } from "./components/LoginScreen";
import { PasswordResetScreen } from "./components/PasswordResetScreen";
import { useAppPreferences } from "./hooks/useAppPreferences";
import { useBoardState } from "./hooks/useBoardState";
import { useSession } from "./hooks/useSession";

export default function App() {
  const preferences = useAppPreferences();
  const session = useSession();
  const board = useBoardState(
    session.request,
    Boolean(session.token) &&
      session.currentUser !== null &&
      !session.currentUser.must_change_password,
  );

  if (!session.token) {
    return (
      <LoginScreen
        authForm={session.authForm}
        error={session.error}
        loading={session.loading}
        onChange={session.setAuthForm}
        onSubmit={session.login}
      />
    );
  }

  if (session.currentUser?.must_change_password) {
    return (
      <PasswordResetScreen
        user={session.currentUser}
        error={session.error}
        loading={session.loading}
        onSubmit={session.changeRequiredPassword}
      />
    );
  }

  if (session.currentUser === null) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <p className="eyebrow">Sessão</p>
          <h1>Carregando perfil</h1>
          <p className="muted">Validando a sessão persistida no backend.</p>
        </section>
      </main>
    );
  }

  return (
    <AuthenticatedApp
      board={board}
      currentUser={session.currentUser}
      preferences={preferences}
      session={session}
    />
  );
}
