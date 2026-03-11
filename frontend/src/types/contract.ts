export type UserRole = "admin" | "user";

export type NamespacePermission = "read" | "write_limited" | "write";

export type DraftActivityStatus =
  | "created"
  | "ongoing"
  | "done"
  | "archived"
  | "postponed"
  | "abandoned";

export type DraftActivityEventType = "created" | "updated" | "status_changed" | "note";

export type DraftActivityEvent = {
  id: string;
  type: DraftActivityEventType;
  occurredAt: string;
  actorLabel: string;
  message: string;
};

export type DraftActivity = {
  id: number;
  namespaceId: number;
  title: string;
  description: string;
  status: DraftActivityStatus;
  boardStatus: "do" | "doing" | "done";
  position: number;
  createdAt: string;
  updatedAt: string;
  history: DraftActivityEvent[];
  permissions: NamespacePermission[];
};

export type DraftActivityUpdate = {
  title?: string;
  description?: string;
  status?: DraftActivityStatus;
};
