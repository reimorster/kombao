import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, FormEvent } from "react";
import { BoardLane } from "./components/BoardLane";
import { CardDetails } from "./components/CardDetails";
import { CardModal } from "./components/CardModal";
import { LoginScreen } from "./components/LoginScreen";
import { Modal } from "./components/Modal";
import { NamespaceBar } from "./components/NamespaceBar";
import { NamespaceModal } from "./components/NamespaceModal";
import { PasswordResetScreen } from "./components/PasswordResetScreen";
import { TopBar } from "./components/TopBar";
import type { LoginResponse as AuthLoginResponse, AuthUser } from "./types/auth";
import { STATUSES } from "./constants/board";
import type { DraftActivityUpdate } from "./types/contract";
import type { Card, CardStatus, Namespace } from "./types/kanban";
import { deriveAccentTokens } from "./utils/colorTheme";
import { apiCardToDraftActivity, draftUpdateToApiUpdate } from "./utils/contractAdapters";
import { groupCards } from "./utils/groupCards";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

type ContextMenuState = {
  x: number;
  y: number;
  namespaceId: number;
};

type AuthFormState = {
  username: string;
  password: string;
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("kanban_token") ?? "");
  const [authForm, setAuthForm] = useState<AuthFormState>({ username: "", password: "" });
  const [theme, setTheme] = useState(localStorage.getItem("kanban_theme") ?? "system");
  const [accentColor, setAccentColor] = useState(localStorage.getItem("kanban_accent") ?? "#305252");
  const [showFullDescriptions, setShowFullDescriptions] = useState(
    localStorage.getItem("kanban_show_all_descriptions") === "true",
  );
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [selectedNamespaceId, setSelectedNamespaceId] = useState<number | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isNamespaceModalOpen, setIsNamespaceModalOpen] = useState(false);
  const [cardModalStatus, setCardModalStatus] = useState<CardStatus | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const appShellRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);

  const selectedNamespace = useMemo(
    () => namespaces.find((namespace) => namespace.id === selectedNamespaceId) ?? namespaces[0] ?? null,
    [namespaces, selectedNamespaceId],
  );

  const selectedCard =
    selectedNamespace?.cards.find((card) => card.id === selectedCardId) ??
    namespaces.flatMap((namespace) => namespace.cards).find((card) => card.id === selectedCardId) ??
    null;
  const selectedDraftCard = useMemo(
    () => (selectedCard ? apiCardToDraftActivity(selectedCard) : null),
    [selectedCard],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("kanban_theme", theme);
  }, [theme]);

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = theme === "dark" || (theme === "system" && prefersDark);
    const {
      bg,
      bgStrong,
      panel,
      panelStrong,
      border,
      shadow,
      accent,
      accentSoft,
      accentContrast,
      accentGlow,
      accentWash,
    } = deriveAccentTokens(accentColor, isDark);
    document.documentElement.style.setProperty("--bg", bg);
    document.documentElement.style.setProperty("--bg-strong", bgStrong);
    document.documentElement.style.setProperty("--panel", panel);
    document.documentElement.style.setProperty("--panel-strong", panelStrong);
    document.documentElement.style.setProperty("--border", border);
    document.documentElement.style.setProperty("--shadow", shadow);
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--accent-soft", accentSoft);
    document.documentElement.style.setProperty("--accent-contrast", accentContrast);
    document.documentElement.style.setProperty("--accent-glow", accentGlow);
    document.documentElement.style.setProperty("--accent-wash", accentWash);
    localStorage.setItem("kanban_accent", accent);
  }, [accentColor, theme]);

  useEffect(() => {
    localStorage.setItem("kanban_show_all_descriptions", String(showFullDescriptions));
  }, [showFullDescriptions]);

  useEffect(() => {
    if (!token) {
      return;
    }
    void fetchCurrentUser();
  }, [token]);

  useEffect(() => {
    if (!token || currentUser?.must_change_password || currentUser === null) {
      return;
    }
    void fetchNamespaces();
  }, [token, currentUser]);

  useEffect(() => {
    if (!selectedNamespace && namespaces.length > 0) {
      setSelectedNamespaceId(namespaces[0].id);
    }
  }, [namespaces, selectedNamespace]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    }

    window.addEventListener("click", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const shell = appShellRef.current;
    const header = headerRef.current;
    const footer = footerRef.current;

    if (!shell || !header || !footer) {
      return;
    }

    function syncShellLayout() {
      shell.style.setProperty("--app-header-height", `${header.offsetHeight}px`);
      shell.style.setProperty("--app-footer-height", `${footer.offsetHeight}px`);
    }

    syncShellLayout();

    const observer = new ResizeObserver(() => syncShellLayout());
    observer.observe(header);
    observer.observe(footer);
    window.addEventListener("resize", syncShellLayout);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncShellLayout);
    };
  }, [error, namespaces.length, renamingId]);

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
      handleLogout();
      throw new Error("Sessao expirada.");
    }

    if (!response.ok) {
      let message = "Erro inesperado.";
      try {
        const payload = (await response.json()) as { detail?: string };
        message = payload.detail ?? message;
      } catch {
        message = response.statusText || message;
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return null as T;
    }

    return (await response.json()) as T;
  }

  async function fetchNamespaces() {
    setLoading(true);
    setError("");
    try {
      const data = await request<Namespace[]>("/namespaces");
      setNamespaces(data);
      if (data.length > 0 && !selectedNamespaceId) {
        setSelectedNamespaceId(data[0].id);
      }
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCurrentUser() {
    setLoading(true);
    setError("");
    try {
      const user = await request<AuthUser>("/auth/me");
      setCurrentUser(user);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

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

      localStorage.setItem("kanban_token", data.token);
      setToken(data.token);
      setCurrentUser(data.user);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("kanban_token");
    setToken("");
    setCurrentUser(null);
    setNamespaces([]);
    setSelectedNamespaceId(null);
    setSelectedCardId(null);
  }

  async function handleRequiredPasswordChange(currentPassword: string, newPassword: string) {
    setLoading(true);
    setError("");
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

  async function createNamespace(name: string) {
    const data = await request<Namespace[]>("/namespaces", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    setNamespaces(data);
    const created = data[data.length - 1];
    if (created) {
      setSelectedNamespaceId(created.id);
      setSelectedCardId(null);
    }
  }

  async function renameNamespace(namespaceId: number, name: string) {
    const data = await request<Namespace[]>(`/namespaces/${namespaceId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    setNamespaces(data);
    setRenamingId(null);
    setRenameValue("");
  }

  async function deleteNamespace(namespaceId: number) {
    const namespace = namespaces.find((item) => item.id === namespaceId);
    if (!namespace) {
      return;
    }
    const confirmed = window.confirm(`Apagar o namespace "${namespace.name}"?`);
    if (!confirmed) {
      return;
    }
    const data = await request<Namespace[]>(`/namespaces/${namespaceId}`, { method: "DELETE" });
    setNamespaces(data);
    setSelectedNamespaceId(data[0]?.id ?? null);
    setSelectedCardId(null);
  }

  async function createCard(status: CardStatus, title: string, description: string) {
    if (!selectedNamespace) {
      return;
    }
    await request<Card>(`/namespaces/${selectedNamespace.id}/cards`, {
      method: "POST",
      body: JSON.stringify({ title, description, status }),
    });
    await fetchNamespaces();
  }

  async function saveCard(cardId: number, payload: Partial<Card>) {
    const updatedCard = await request<Card>(`/cards/${cardId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    await fetchNamespaces();
    setSelectedCardId(updatedCard.id);
  }

  async function saveDraftCard(cardId: number, payload: DraftActivityUpdate) {
    const apiPayload = draftUpdateToApiUpdate(payload);
    await saveCard(cardId, apiPayload);
  }

  async function removeCard(cardId: number) {
    await request<null>(`/cards/${cardId}`, { method: "DELETE" });
    await fetchNamespaces();
    setSelectedCardId(null);
  }

  function onCardDragStart(event: DragEvent<HTMLElement>, card: Card) {
    event.dataTransfer.setData("application/json", JSON.stringify(card));
    event.dataTransfer.effectAllowed = "move";
  }

  async function onCardDrop(event: DragEvent<HTMLElement>, status: CardStatus) {
    event.preventDefault();
    if (!selectedNamespace) {
      return;
    }

    const rawCard = event.dataTransfer.getData("application/json");
    if (!rawCard) {
      return;
    }

    const card = JSON.parse(rawCard) as Card;
    const laneElement = (event.target as HTMLElement).closest("[data-lane]");
    const cardElement = (event.target as HTMLElement).closest("[data-card-id]");
    const grouped = groupCards(selectedNamespace.cards);
    const siblings = grouped[status].filter((item) => item.id !== card.id);
    let position = siblings.length;

    if (cardElement && laneElement?.contains(cardElement)) {
      const targetId = Number(cardElement.getAttribute("data-card-id"));
      const targetIndex = siblings.findIndex((item) => item.id === targetId);
      if (targetIndex >= 0) {
        position = targetIndex;
      }
    }

    await saveCard(card.id, {
      namespace_id: selectedNamespace.id,
      status,
      position,
    } as Partial<Card>);
  }

  function openNamespaceModal() {
    setContextMenu(null);
    setIsNamespaceModalOpen(true);
  }

  function openCardModal(status: CardStatus) {
    setCardModalStatus(status);
  }

  if (!token) {
    return (
      <LoginScreen
        authForm={authForm}
        error={error}
        loading={loading}
        onChange={setAuthForm}
        onSubmit={handleLogin}
      />
    );
  }

  if (token && currentUser?.must_change_password) {
    return (
      <PasswordResetScreen
        user={currentUser}
        error={error}
        loading={loading}
        onSubmit={handleRequiredPasswordChange}
      />
    );
  }

  if (token && currentUser === null) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <p className="eyebrow">Sessao</p>
          <h1>Carregando perfil</h1>
          <p className="muted">Validando a sessao persistida no backend.</p>
        </section>
      </main>
    );
  }

  const groupedCards = groupCards(selectedNamespace?.cards ?? []);

  return (
    <main ref={appShellRef} className="app-shell">
      <div ref={headerRef} className="app-header">
        <TopBar
          namespaceName={selectedNamespace?.name ?? "Sem namespace"}
          theme={theme}
          accentColor={accentColor}
          showFullDescriptions={showFullDescriptions}
          onThemeToggle={() =>
            setTheme((current) =>
              current === "light" ? "dark" : current === "dark" ? "system" : "light",
            )
          }
          onToggleDescriptions={() => setShowFullDescriptions((current) => !current)}
          onAccentColorChange={setAccentColor}
          onLogout={handleLogout}
        />

        {error ? <p className="error banner">{error}</p> : null}
      </div>

      <section className="board-shell">
        <div className="board">
          {STATUSES.map((status) => (
            <BoardLane
              key={status.id}
              status={status}
              cards={groupedCards[status.id] ?? []}
              canCreateCard={status.id === "do"}
              showFullDescriptions={showFullDescriptions}
              onCreateCard={() => openCardModal(status.id)}
              onCardOpen={setSelectedCardId}
              onCardDragStart={onCardDragStart}
              onCardDrop={onCardDrop}
            />
          ))}
        </div>
      </section>

      <div ref={footerRef} className="app-footer">
        <NamespaceBar
          namespaces={namespaces}
          selectedNamespaceId={selectedNamespace?.id ?? null}
          renamingId={renamingId}
          renameValue={renameValue}
          onSelect={(namespaceId) => {
            setSelectedNamespaceId(namespaceId);
            setSelectedCardId(null);
          }}
          onRenameValueChange={setRenameValue}
          onRenameStart={(namespaceId) => {
            const namespace = namespaces.find((item) => item.id === namespaceId);
            setRenamingId(namespaceId);
            setRenameValue(namespace?.name ?? "");
          }}
          onRenameCancel={() => {
            setRenamingId(null);
            setRenameValue("");
          }}
          onRenameSubmit={renameNamespace}
          onCreateNamespace={openNamespaceModal}
          onContextMenu={(menuState) => setContextMenu(menuState)}
        />
      </div>

      {contextMenu ? (
        <div
          ref={contextMenuRef}
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y, transform: "translateY(calc(-100% - 10px))" }}
        >
          <button type="button" onClick={openNamespaceModal}>
            Novo namespace
          </button>
          <button
            type="button"
            onClick={() => {
              const namespace = namespaces.find((item) => item.id === contextMenu.namespaceId);
              setContextMenu(null);
              setRenamingId(contextMenu.namespaceId);
              setRenameValue(namespace?.name ?? "");
            }}
          >
            Renomear
          </button>
          <button
            type="button"
            onClick={async () => {
              setContextMenu(null);
              await deleteNamespace(contextMenu.namespaceId);
            }}
          >
            Apagar
          </button>
        </div>
      ) : null}

      <NamespaceModal
        isOpen={isNamespaceModalOpen}
        loading={loading}
        onClose={() => setIsNamespaceModalOpen(false)}
        onSubmit={async (name) => {
          setLoading(true);
          setError("");
          try {
            await createNamespace(name);
            setIsNamespaceModalOpen(false);
          } catch (requestError) {
            setError((requestError as Error).message);
          } finally {
            setLoading(false);
          }
        }}
      />

      <CardModal
        isOpen={cardModalStatus !== null}
        loading={loading}
        status={cardModalStatus}
        onClose={() => setCardModalStatus(null)}
        onSubmit={async (title, description, status) => {
          setLoading(true);
          setError("");
          try {
            await createCard(status, title, description);
            setCardModalStatus(null);
          } catch (requestError) {
            setError((requestError as Error).message);
          } finally {
            setLoading(false);
          }
        }}
      />

      <Modal
        isOpen={selectedDraftCard !== null}
        onClose={() => setSelectedCardId(null)}
        title="Detalhes da atividade"
      >
        {selectedDraftCard ? (
          <CardDetails
            card={selectedDraftCard}
            onSave={saveDraftCard}
            onDelete={removeCard}
            onClose={() => setSelectedCardId(null)}
          />
        ) : null}
      </Modal>
    </main>
  );
}
