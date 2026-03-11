import type { BoardStatus } from "../types/kanban";

export const STATUSES: BoardStatus[] = [
  { id: "do", label: "To do" },
  { id: "doing", label: "Doing" },
  { id: "done", label: "Done" },
];
