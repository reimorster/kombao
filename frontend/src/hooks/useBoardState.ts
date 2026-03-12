import { useCallback, useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";

import { STATUSES } from "../constants/board";
import type { ContextMenuState } from "../types/app";
import type { DraftActivityUpdate } from "../types/contract";
import type { Card, CardStatus, Namespace } from "../types/kanban";
import { apiCardToDraftActivity, draftUpdateToApiUpdate } from "../utils/contractAdapters";
import { groupCards } from "../utils/groupCards";

type RequestFn = <T>(path: string, options?: RequestInit) => Promise<T>;

export function useBoardState(request: RequestFn, enabled: boolean) {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [selectedNamespaceId, setSelectedNamespaceId] = useState<number | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isNamespaceModalOpen, setIsNamespaceModalOpen] = useState(false);
  const [cardModalStatus, setCardModalStatus] = useState<CardStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedNamespace = useMemo(
    () => namespaces.find((namespace) => namespace.id === selectedNamespaceId) ?? namespaces[0] ?? null,
    [namespaces, selectedNamespaceId],
  );

  const selectedCard =
    selectedNamespace?.cards.find((card) => card.id === selectedCardId) ??
    namespaces.flatMap((namespace) => namespace.cards).find((card) => card.id === selectedCardId) ??
    null;

  const groupedCards = useMemo(() => groupCards(selectedNamespace?.cards ?? []), [selectedNamespace]);
  const selectedDraftCard = useMemo(
    () => (selectedCard ? apiCardToDraftActivity(selectedCard) : null),
    [selectedCard],
  );

  const reset = useCallback(() => {
    setNamespaces([]);
    setSelectedNamespaceId(null);
    setSelectedCardId(null);
    setContextMenu(null);
    setRenamingId(null);
    setRenameValue("");
    setIsNamespaceModalOpen(false);
    setCardModalStatus(null);
    setError("");
  }, []);

  const fetchNamespaces = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await request<Namespace[]>("/namespaces");
      setNamespaces(data);
      if (data.length > 0 && selectedNamespaceId === null) {
        setSelectedNamespaceId(data[0].id);
      }
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }, [enabled, request, selectedNamespaceId]);

  useEffect(() => {
    if (!enabled) {
      reset();
      return;
    }
    void fetchNamespaces();
  }, [enabled, fetchNamespaces, reset]);

  useEffect(() => {
    if (!selectedNamespace && namespaces.length > 0) {
      setSelectedNamespaceId(namespaces[0].id);
    }
  }, [namespaces, selectedNamespace]);

  async function createNamespace(name: string) {
    setLoading(true);
    setError("");
    try {
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
      setIsNamespaceModalOpen(false);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function renameNamespace(namespaceId: number, name: string) {
    setLoading(true);
    setError("");
    try {
      const data = await request<Namespace[]>(`/namespaces/${namespaceId}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      setNamespaces(data);
      setRenamingId(null);
      setRenameValue("");
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
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

    setLoading(true);
    setError("");
    try {
      const data = await request<Namespace[]>(`/namespaces/${namespaceId}`, { method: "DELETE" });
      setNamespaces(data);
      setSelectedNamespaceId(data[0]?.id ?? null);
      setSelectedCardId(null);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function createCard(status: CardStatus, title: string, description: string) {
    if (!selectedNamespace) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      await request<Card>(`/namespaces/${selectedNamespace.id}/cards`, {
        method: "POST",
        body: JSON.stringify({ title, description, status }),
      });
      await fetchNamespaces();
      setCardModalStatus(null);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function saveCard(cardId: number, payload: Partial<Card>, selectAfterSave = false) {
    const updatedCard = await request<Card>(`/cards/${cardId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    await fetchNamespaces();
    if (selectAfterSave) {
      setSelectedCardId(updatedCard.id);
    }
  }

  async function saveDraftCard(cardId: number, payload: DraftActivityUpdate) {
    setLoading(true);
    setError("");
    try {
      await saveCard(cardId, draftUpdateToApiUpdate(payload), true);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function removeCard(cardId: number) {
    setLoading(true);
    setError("");
    try {
      await request<null>(`/cards/${cardId}`, { method: "DELETE" });
      await fetchNamespaces();
      setSelectedCardId(null);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
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
    const siblings = groupedCards[status].filter((item) => item.id !== card.id);
    let position = siblings.length;

    if (cardElement && laneElement?.contains(cardElement)) {
      const targetId = Number(cardElement.getAttribute("data-card-id"));
      const targetIndex = siblings.findIndex((item) => item.id === targetId);
      if (targetIndex >= 0) {
        position = targetIndex;
      }
    }

    setLoading(true);
    setError("");
    try {
      await saveCard(card.id, {
        namespace_id: selectedNamespace.id,
        position,
        status,
      } as Partial<Card>);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function openNamespaceModal() {
    setContextMenu(null);
    setIsNamespaceModalOpen(true);
  }

  function openCardModal(status: CardStatus) {
    setCardModalStatus(status);
  }

  function startRenamingNamespace(namespaceId: number) {
    const namespace = namespaces.find((item) => item.id === namespaceId);
    setRenamingId(namespaceId);
    setRenameValue(namespace?.name ?? "");
  }

  function selectNamespace(namespaceId: number) {
    setSelectedNamespaceId(namespaceId);
    setSelectedCardId(null);
  }

  type BackupPreferences = {
    theme: string;
    accentColor: string;
    showFullDescriptions: boolean;
  };

  async function exportBackup(preferences: BackupPreferences) {
    setLoading(true);
    setError("");
    try {
      const data = await request<{ version: string; namespaces: unknown[] }>("/backup");
      const backup = { ...data, preferences };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `kombao-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function importBackup(
    file: File,
    applyPreferences: (prefs: BackupPreferences) => void,
  ) {
    setLoading(true);
    setError("");
    try {
      const text = await file.text();
      const text = await file.text();
      let payload;
      try {
        payload = JSON.parse(text);
      } catch (parseError) {
        throw new Error("Arquivo de backup inválido. Certifique-se de que é um JSON válido.");
      }
      const data = await request<Namespace[]>("/restore", {
        method: "POST",
        body: JSON.stringify({ version: payload.version, namespaces: payload.namespaces }),
      });
      setNamespaces(data);
      setSelectedNamespaceId(data[0]?.id ?? null);
      setSelectedCardId(null);
      if (payload.preferences) {
        applyPreferences(payload.preferences);
      }
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return {
    cardModalStatus,
    closeCardModal: () => setCardModalStatus(null),
    closeNamespaceModal: () => setIsNamespaceModalOpen(false),
    contextMenu,
    createCard,
    createNamespace,
    deleteNamespace,
    error,
    exportBackup,
    fetchNamespaces,
    groupedCards,
    importBackup,
    isNamespaceModalOpen,
    loading,
    namespaces,
    onCardDragStart,
    onCardDrop,
    openCardModal,
    openNamespaceModal,
    removeCard,
    renameNamespace,
    renameValue,
    renamingId,
    saveDraftCard,
    selectedDraftCard,
    selectedNamespace,
    selectNamespace,
    selectedNamespaceId,
    setContextMenu,
    setRenameValue,
    setSelectedCardId,
    startRenamingNamespace,
    STATUSES,
    reset,
    cancelRenaming: () => {
      setRenamingId(null);
      setRenameValue("");
    },
  };
}
