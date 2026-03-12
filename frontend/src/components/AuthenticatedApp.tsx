import { useState } from "react";

import { BoardLane } from "./BoardLane";
import { CardDetails } from "./CardDetails";
import { CardModal } from "./CardModal";
import { Modal } from "./Modal";
import { NamespaceBar } from "./NamespaceBar";
import { NamespaceModal } from "./NamespaceModal";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import { TopBar } from "./TopBar";
import { useDismissibleLayer } from "../hooks/useDismissibleLayer";
import { useShellLayout } from "../hooks/useShellLayout";
import type { useAppPreferences } from "../hooks/useAppPreferences";
import type { useBoardState } from "../hooks/useBoardState";
import type { useSession } from "../hooks/useSession";
import type { AuthUser } from "../types/auth";

type AuthenticatedAppProps = {
  board: ReturnType<typeof useBoardState>;
  currentUser: AuthUser;
  preferences: ReturnType<typeof useAppPreferences>;
  session: Pick<ReturnType<typeof useSession>, "error" | "loading" | "logout" | "updateProfile">;
};

export function AuthenticatedApp({
  board,
  currentUser,
  preferences,
  session,
}: AuthenticatedAppProps) {
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const shellLayout = useShellLayout([
    board.error,
    board.namespaces.length,
    board.renamingId,
  ]);
  const contextMenuRef = useDismissibleLayer<HTMLDivElement>(
    board.contextMenu !== null,
    () => board.setContextMenu(null),
  );
  const error = session.error || board.error;
  const loading = board.loading || session.loading;

  return (
    <main ref={shellLayout.appShellRef} className="app-shell">
      <div ref={shellLayout.headerRef} className="app-header">
        <TopBar
          namespaceName={board.selectedNamespace?.name ?? "Sem namespace"}
          currentUserLabel={currentUser.display_name || currentUser.username}
          theme={preferences.theme}
          accentColor={preferences.accentColor}
          showFullDescriptions={preferences.showFullDescriptions}
          onThemeChange={(t) => preferences.setTheme(t)}
          onToggleDescriptions={() =>
            preferences.setShowFullDescriptions((current) => !current)
          }
          onAccentColorChange={preferences.setAccentColor}
          onOpenProfileSettings={() => setIsProfileSettingsOpen(true)}
          onLogout={() => {
            setIsProfileSettingsOpen(false);
            session.logout();
          }}
        />

        {error && board.cardModalStatus === null ? <p className="error banner">{error}</p> : null}
      </div>

      <section className="board-shell">
        <div className="board">
          {board.STATUSES.map((status) => (
            <BoardLane
              key={status.id}
              status={status}
              cards={board.groupedCards[status.id] ?? []}
              canCreateCard={status.id === "do"}
              showFullDescriptions={preferences.showFullDescriptions}
              onCreateCard={() => board.openCardModal(status.id)}
              onCardOpen={board.setSelectedCardId}
              onCardDragStart={board.onCardDragStart}
              onCardDrop={board.onCardDrop}
            />
          ))}
        </div>
      </section>

      <div ref={shellLayout.footerRef} className="app-footer">
        <NamespaceBar
          namespaces={board.namespaces}
          selectedNamespaceId={board.selectedNamespace?.id ?? null}
          renamingId={board.renamingId}
          renameValue={board.renameValue}
          onSelect={board.selectNamespace}
          onRenameValueChange={board.setRenameValue}
          onRenameStart={board.startRenamingNamespace}
          onRenameCancel={board.cancelRenaming}
          onRenameSubmit={board.renameNamespace}
          onCreateNamespace={board.openNamespaceModal}
          onContextMenu={board.setContextMenu}
          onExportBackup={() =>
            board.exportBackup({
              theme: preferences.theme,
              accentColor: preferences.accentColor,
              showFullDescriptions: preferences.showFullDescriptions,
            })
          }
          onImportBackup={(file) =>
            board.importBackup(file, (prefs) => {
              preferences.setTheme(prefs.theme);
              preferences.setAccentColor(prefs.accentColor);
              preferences.setShowFullDescriptions(prefs.showFullDescriptions);
            })
          }
        />
      </div>

      {board.contextMenu ? (
        <div
          ref={contextMenuRef}
          className="context-menu"
          style={{
            left: board.contextMenu.x,
            top: board.contextMenu.y,
            transform: "translateY(calc(-100% - 10px))",
          }}
        >
          <button type="button" onClick={board.openNamespaceModal}>
            Novo namespace
          </button>
          <button
            type="button"
            onClick={() => {
              board.setContextMenu(null);
              board.startRenamingNamespace(board.contextMenu!.namespaceId);
            }}
          >
            Renomear
          </button>
          <button
            type="button"
            onClick={async () => {
              const { namespaceId } = board.contextMenu!;
              board.setContextMenu(null);
              await board.deleteNamespace(namespaceId);
            }}
          >
            Apagar
          </button>
        </div>
      ) : null}

      <NamespaceModal
        isOpen={board.isNamespaceModalOpen}
        loading={loading}
        onClose={board.closeNamespaceModal}
        onSubmit={board.createNamespace}
      />

      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        loading={loading}
        user={currentUser}
        onClose={() => setIsProfileSettingsOpen(false)}
        onSubmit={async ({ displayName, email }) => {
          const updated = await session.updateProfile(displayName, email);
          if (updated) {
            setIsProfileSettingsOpen(false);
          }
        }}
      />

      <CardModal
        isOpen={board.cardModalStatus !== null}
        loading={loading}
        error={board.error}
        status={board.cardModalStatus}
        onClose={board.closeCardModal}
        onSubmit={board.createCard}
      />

      <Modal
        isOpen={board.selectedDraftCard !== null}
        onClose={() => board.setSelectedCardId(null)}
        title="Detalhes da atividade"
      >
        {board.selectedDraftCard ? (
          <CardDetails
            card={board.selectedDraftCard}
            onSave={board.saveDraftCard}
            onDelete={board.removeCard}
            onClose={() => board.setSelectedCardId(null)}
          />
        ) : null}
      </Modal>
    </main>
  );
}
