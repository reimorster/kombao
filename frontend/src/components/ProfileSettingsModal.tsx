import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { Modal } from "./Modal";
import type { AuthUser } from "../types/auth";

type ProfileSettingsModalProps = {
  isOpen: boolean;
  loading: boolean;
  user: AuthUser;
  onClose: () => void;
  onSubmit: (payload: { displayName: string; email: string }) => Promise<void>;
};

export function ProfileSettingsModal({
  isOpen,
  loading,
  user,
  onClose,
  onSubmit,
}: ProfileSettingsModalProps) {
  const [displayName, setDisplayName] = useState(user.display_name);
  const [email, setEmail] = useState(user.email ?? "");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDisplayName(user.display_name);
    setEmail(user.email ?? "");
  }, [isOpen, user.display_name, user.email]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedDisplayName = displayName.trim();
    if (!normalizedDisplayName) {
      return;
    }

    await onSubmit({
      displayName: normalizedDisplayName,
      email: email.trim(),
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurações da conta">
      <form className="modal-content" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Conta</p>
          <h2>Configurações</h2>
          <p className="muted">Atualize seu nome de exibição e e-mail.</p>
        </div>

        <label>
          Nome de usuário
          <input value={user.username} disabled readOnly />
          <small className="field-hint">O nome de usuário não pode ser alterado.</small>
        </label>

        <label>
          Nome de exibição
          <input
            autoFocus
            value={displayName}
            maxLength={120}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder={user.username}
          />
        </label>

        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="você@exemplo.com"
          />
        </label>

        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" disabled={loading || displayName.trim().length === 0}>
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
