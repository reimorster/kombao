import { STATUSES } from "../constants/board";
import type { Card, CardStatus } from "../types/kanban";

export function groupCards(cards: Card[]) {
  return STATUSES.reduce(
    (acc, status) => {
      acc[status.id] = cards
        .filter((card) => card.status === status.id)
        .sort((a, b) => a.position - b.position);
      return acc;
    },
    {
      do: [],
      doing: [],
      done: [],
    } as Record<CardStatus, Card[]>,
  );
}
