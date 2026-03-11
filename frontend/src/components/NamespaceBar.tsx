import type { Namespace } from "../types/kanban";

type ContextMenuState = {
  x: number;
  y: number;
  namespaceId: number;
};

type NamespaceBarProps = {
  namespaces: Namespace[];
  selectedNamespaceId: number | null;
  renamingId: number | null;
  renameValue: string;
  onSelect: (namespaceId: number) => void;
  onRenameValueChange: (value: string) => void;
  onRenameStart: (namespaceId: number) => void;
  onRenameCancel: () => void;
  onRenameSubmit: (namespaceId: number, name: string) => Promise<void>;
  onCreateNamespace: () => void;
  onContextMenu: (contextMenu: ContextMenuState) => void;
};

export function NamespaceBar({
  namespaces,
  selectedNamespaceId,
  renamingId,
  renameValue,
  onSelect,
  onRenameValueChange,
  onRenameStart,
  onRenameCancel,
  onRenameSubmit,
  onCreateNamespace,
  onContextMenu,
}: NamespaceBarProps) {
  return (
    <footer className="namespace-bar">
      <div className="namespace-tabs">
        {namespaces.map((namespace) =>
          renamingId === namespace.id ? (
            <div
              key={namespace.id}
              className={`namespace-tab active namespace-tab-editing`}
              onContextMenu={(event) => {
                event.preventDefault();
                onContextMenu({
                  x: event.clientX,
                  y: event.clientY,
                  namespaceId: namespace.id,
                });
              }}
            >
              <input
                autoFocus
                value={renameValue}
                onChange={(event) => onRenameValueChange(event.target.value)}
                onBlur={() => {
                  if (renameValue.trim()) {
                    void onRenameSubmit(namespace.id, renameValue);
                  } else {
                    onRenameCancel();
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && renameValue.trim()) {
                    void onRenameSubmit(namespace.id, renameValue);
                  }
                  if (event.key === "Escape") {
                    onRenameCancel();
                  }
                }}
              />
            </div>
          ) : (
            <button
              key={namespace.id}
              type="button"
              className={`namespace-tab ${namespace.id === selectedNamespaceId ? "active" : ""}`}
              onClick={() => onSelect(namespace.id)}
              onContextMenu={(event) => {
                event.preventDefault();
                onContextMenu({
                  x: event.clientX,
                  y: event.clientY,
                  namespaceId: namespace.id,
                });
              }}
            >
              <span onDoubleClick={() => onRenameStart(namespace.id)}>{namespace.name}</span>
            </button>
          ),
        )}
      </div>
      <button type="button" className="ghost namespace-create-button" onClick={onCreateNamespace}>
        Novo namespace
      </button>
    </footer>
  );
}
