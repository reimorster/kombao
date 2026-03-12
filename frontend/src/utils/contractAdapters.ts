import type { Card, CardStatus } from "../types/kanban";
import type {
  DraftActivity,
  DraftActivityEvent,
  DraftActivityStatus,
  DraftActivityUpdate,
} from "../types/contract";

type DraftStatusMeta = {
  id: DraftActivityStatus;
  label: string;
  description: string;
  apiReady: boolean;
};

export const DRAFT_ACTIVITY_STATUSES: DraftStatusMeta[] = [
  {
    id: "created",
    label: "Created",
    description: "Atividade criada e pronta para entrar no fluxo operacional.",
    apiReady: true,
  },
  {
    id: "ongoing",
    label: "Ongoing",
    description: "Atividade em execução no quadro principal.",
    apiReady: true,
  },
  {
    id: "done",
    label: "Done",
    description: "Atividade concluída dentro do fluxo principal.",
    apiReady: true,
  },
  {
    id: "archived",
    label: "Archived",
    description: "Estado de encerramento fora do board operacional.",
    apiReady: false,
  },
  {
    id: "postponed",
    label: "Postponed",
    description: "Atividade adiada, mas ainda relevante.",
    apiReady: false,
  },
  {
    id: "abandoned",
    label: "Abandoned",
    description: "Atividade descartada e fora do fluxo ativo.",
    apiReady: false,
  },
];

export function apiStatusToDraftStatus(status: CardStatus): DraftActivityStatus {
  switch (status) {
    case "do":
      return "created";
    case "doing":
      return "ongoing";
    case "done":
      return "done";
  }
}

export function draftStatusToApiStatus(status: DraftActivityStatus): CardStatus | null {
  switch (status) {
    case "created":
      return "do";
    case "ongoing":
      return "doing";
    case "done":
      return "done";
    case "archived":
    case "postponed":
    case "abandoned":
      return null;
  }
}

function buildDraftHistory(card: Card): DraftActivityEvent[] {
  const history: DraftActivityEvent[] = [
    {
      id: `created-${card.id}`,
      type: "created",
      occurredAt: card.created_at,
      actorLabel: "Sistema atual",
      message: "Atividade criada no contrato legado.",
    },
  ];

  if (card.updated_at !== card.created_at) {
    history.unshift({
      id: `updated-${card.id}`,
      type: "updated",
      occurredAt: card.updated_at,
      actorLabel: "Sistema atual",
      message: "Última atualização registrada pela API atual.",
    });
  }

  return history;
}

export function apiCardToDraftActivity(card: Card): DraftActivity {
  return {
    id: card.id,
    namespaceId: card.namespace_id,
    title: card.title,
    description: card.description,
    status: apiStatusToDraftStatus(card.status),
    boardStatus: card.status,
    position: card.position,
    createdAt: card.created_at,
    updatedAt: card.updated_at,
    history: buildDraftHistory(card),
    permissions: ["write"],
  };
}

export function draftUpdateToApiUpdate(update: DraftActivityUpdate): Partial<Card> {
  const next: Partial<Card> = {};

  if (update.title !== undefined) {
    next.title = update.title;
  }

  if (update.description !== undefined) {
    next.description = update.description;
  }

  if (update.status !== undefined) {
    const apiStatus = draftStatusToApiStatus(update.status);
    if (apiStatus === null) {
      throw new Error("Este estado do draft ainda não é suportado pela API atual.");
    }
    next.status = apiStatus;
  }

  return next;
}
