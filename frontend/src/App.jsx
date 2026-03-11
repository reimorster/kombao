import { useEffect, useMemo, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
const STATUSES = [
  { id: "do", label: "Do" },
  { id: "doing", label: "Doing" },
  { id: "done", label: "Done" },
];

function groupCards(cards) {
  return STATUSES.reduce((acc, status) => {
    acc[status.id] = cards
      .filter((card) => card.status === status.id)
      .sort((a, b) => a.position - b.position);
    return acc;
  }, {});
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("kanban_token") ?? "");
  const [authForm, setAuthForm] = useState({ username: "", password: "" });
  const [theme, setTheme] = useState(localStorage.getItem("kanban_theme") ?? "system");
  const [namespaces, setNamespaces] = useState([]);
  const [selectedNamespaceId, setSelectedNamespaceId] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const contextMenuRef = useRef(null);

  const selectedNamespace = useMemo(
    () => namespaces.find((namespace) => namespace.id === selectedNamespaceId) ?? namespaces[0] ?? null,
    [namespaces, selectedNamespaceId],
  );
  const selectedCard =
    selectedNamespace?.cards.find((card) => card.id === selectedCardId) ??
    namespaces.flatMap((namespace) => namespace.cards).find((card) => card.id === selectedCardId) ??
    null;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("kanban_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!token) {
      return;
    }
    fetchNamespaces();
  }, [token]);

  useEffect(() => {
    if (!selectedNamespace && namespaces.length > 0) {
      setSelectedNamespaceId(namespaces[0].id);
    }
  }, [namespaces, selectedNamespace]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu(null);
      }
    }

    function handleEscape(event) {
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

  async function request(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
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
        const payload = await response.json();
        message = payload.detail ?? message;
      } catch {
        message = response.statusText || message;
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  async function fetchNamespaces() {
    setLoading(true);
    setError("");
    try {
      const data = await request("/namespaces");
      setNamespaces(data);
      if (data.length > 0 && !selectedNamespaceId) {
        setSelectedNamespaceId(data[0].id);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
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
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.detail ?? "Falha no login.");
        }
        return response.json();
      });

      localStorage.setItem("kanban_token", data.token);
      setToken(data.token);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("kanban_token");
    setToken("");
    setNamespaces([]);
    setSelectedNamespaceId(null);
    setSelectedCardId(null);
  }

  async function createNamespace() {
    const name = window.prompt("Nome do novo namespace:", "Novo projeto");
    if (!name?.trim()) {
      return;
    }
    const data = await request("/namespaces", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    setNamespaces(data);
    const created = data[data.length - 1];
    if (created) {
      setSelectedNamespaceId(created.id);
    }
  }

  async function renameNamespace(namespaceId, name) {
    const data = await request(`/namespaces/${namespaceId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    setNamespaces(data);
    setRenamingId(null);
    setRenameValue("");
  }

  async function deleteNamespace(namespaceId) {
    const namespace = namespaces.find((item) => item.id === namespaceId);
    if (!namespace) {
      return;
    }
    const confirmed = window.confirm(`Apagar o namespace "${namespace.name}"?`);
    if (!confirmed) {
      return;
    }
    const data = await request(`/namespaces/${namespaceId}`, { method: "DELETE" });
    setNamespaces(data);
    setSelectedNamespaceId(data[0]?.id ?? null);
    setSelectedCardId(null);
  }

  async function createCard(status) {
    if (!selectedNamespace) {
      return;
    }
    const title = window.prompt(`Nova atividade em ${status.toUpperCase()}:`, "");
    if (!title?.trim()) {
      return;
    }
    await request(`/namespaces/${selectedNamespace.id}/cards`, {
      method: "POST",
      body: JSON.stringify({ title, description: "", status }),
    });
    await fetchNamespaces();
  }

  async function saveCard(cardId, payload) {
    const updatedCard = await request(`/cards/${cardId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    await fetchNamespaces();
    setSelectedCardId(updatedCard.id);
  }

  async function removeCard(cardId) {
    await request(`/cards/${cardId}`, { method: "DELETE" });
    await fetchNamespaces();
    setSelectedCardId(null);
  }

  function onCardDragStart(event, card) {
    event.dataTransfer.setData("application/json", JSON.stringify(card));
    event.dataTransfer.effectAllowed = "move";
  }

  async function onCardDrop(event, status) {
    event.preventDefault();
    if (!selectedNamespace) {
      return;
    }

    const rawCard = event.dataTransfer.getData("application/json");
    if (!rawCard) {
      return;
    }

    const card = JSON.parse(rawCard);
    const laneElement = event.target.closest("[data-lane]");
    const cardElement = event.target.closest("[data-card-id]");
    const grouped = groupCards(selectedNamespace.cards);
    const siblings = grouped[status].filter((item) => item.id !== card.id);
    let position = siblings.length;

    if (cardElement && laneElement?.contains(cardElement)) {
      const targetId = Number(cardElement.dataset.cardId);
      const targetIndex = siblings.findIndex((item) => item.id === targetId);
      if (targetIndex >= 0) {
        position = targetIndex;
      }
    }

    await saveCard(card.id, {
      namespace_id: selectedNamespace.id,
      status,
      position,
    });
  }

  if (!token) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <div>
            <p className="eyebrow">Simple Kanban</p>
            <h1>Controle visual de tarefas por namespace.</h1>
            <p className="muted">
              Login com credenciais definidas no environment do backend.
            </p>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            <label>
              Usuario
              <input
                value={authForm.username}
                onChange={(event) =>
                  setAuthForm((current) => ({ ...current, username: event.target.value }))
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
                  setAuthForm((current) => ({ ...current, password: event.target.value }))
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

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Namespace atual</p>
          <h1>{selectedNamespace?.name ?? "Sem namespace"}</h1>
        </div>
        <div className="toolbar">
          <button
            type="button"
            className="ghost"
            onClick={() =>
              setTheme((current) =>
                current === "light" ? "dark" : current === "dark" ? "system" : "light",
              )
            }
          >
            Tema: {theme}
          </button>
          <button type="button" className="ghost" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      {error ? <p className="error banner">{error}</p> : null}

      <section className="board-shell">
        <div className="board">
          {STATUSES.map((status) => {
            const cards = groupCards(selectedNamespace?.cards ?? [])[status.id] ?? [];
            return (
              <section
                key={status.id}
                className="lane"
                data-lane={status.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => onCardDrop(event, status.id)}
              >
                <div className="lane-header">
                  <div>
                    <p className="lane-title">{status.label}</p>
                    <span className="lane-count">{cards.length}</span>
                  </div>
                  <button type="button" className="ghost small" onClick={() => createCard(status.id)}>
                    Nova
                  </button>
                </div>
                <div className="lane-cards">
                  {cards.map((card) => (
                    <article
                      key={card.id}
                      data-card-id={card.id}
                      draggable
                      onDragStart={(event) => onCardDragStart(event, card)}
                      className={`card ${selectedCardId === card.id ? "selected" : ""}`}
                      onClick={() => setSelectedCardId(card.id)}
                    >
                      <h3>{card.title}</h3>
                      <p>{card.description || "Sem detalhes adicionais."}</p>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <aside className={`sidebar ${selectedCard ? "open" : ""}`}>
          {selectedCard ? (
            <CardDetails
              card={selectedCard}
              onSave={saveCard}
              onDelete={removeCard}
              onClose={() => setSelectedCardId(null)}
            />
          ) : (
            <div className="empty-sidebar">
              <p className="eyebrow">Detalhes</p>
              <h2>Selecione uma atividade</h2>
              <p className="muted">
                O painel lateral mostra descricao, status e permite ajustes imediatos.
              </p>
            </div>
          )}
        </aside>
      </section>

      <footer className="namespace-bar">
        <div className="namespace-tabs">
          {namespaces.map((namespace) => (
            <button
              key={namespace.id}
              type="button"
              className={`namespace-tab ${namespace.id === selectedNamespace?.id ? "active" : ""}`}
              onClick={() => {
                setSelectedNamespaceId(namespace.id);
                setSelectedCardId(null);
              }}
              onContextMenu={(event) => {
                event.preventDefault();
                setContextMenu({
                  x: event.clientX,
                  y: event.clientY,
                  namespaceId: namespace.id,
                });
              }}
            >
              {renamingId === namespace.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                  onBlur={() => {
                    if (renameValue.trim()) {
                      renameNamespace(namespace.id, renameValue);
                    } else {
                      setRenamingId(null);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && renameValue.trim()) {
                      renameNamespace(namespace.id, renameValue);
                    }
                    if (event.key === "Escape") {
                      setRenamingId(null);
                      setRenameValue("");
                    }
                  }}
                />
              ) : (
                <span>{namespace.name}</span>
              )}
            </button>
          ))}
        </div>
        <button type="button" className="ghost" onClick={createNamespace}>
          Novo namespace
        </button>

        {contextMenu ? (
          <div
            ref={contextMenuRef}
            className="context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              type="button"
              onClick={async () => {
                setContextMenu(null);
                await createNamespace();
              }}
            >
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
      </footer>
    </main>
  );
}

function CardDetails({ card, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(card);

  useEffect(() => {
    setDraft(card);
  }, [card]);

  return (
    <div className="details">
      <div className="details-header">
        <div>
          <p className="eyebrow">Atividade</p>
          <h2>Editar detalhes</h2>
        </div>
        <button type="button" className="ghost" onClick={onClose}>
          Fechar
        </button>
      </div>

      <label>
        Titulo
        <input
          value={draft.title}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
        />
      </label>

      <label>
        Etapa
        <select
          value={draft.status}
          onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
        >
          {STATUSES.map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Descricao
        <textarea
          rows="10"
          value={draft.description}
          onChange={(event) =>
            setDraft((current) => ({ ...current, description: event.target.value }))
          }
        />
      </label>

      <div className="details-actions">
        <button type="button" onClick={() => onSave(card.id, draft)}>
          Salvar
        </button>
        <button type="button" className="danger" onClick={() => onDelete(card.id)}>
          Apagar atividade
        </button>
      </div>
    </div>
  );
}
