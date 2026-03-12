import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "./Modal";

type NamespaceModalProps = {
  isOpen: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
};

export function NamespaceModal({ isOpen, loading, onClose, onSubmit }: NamespaceModalProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName("");
    }
  }, [isOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    await onSubmit(trimmed);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo namespace">
      <form className="modal-content" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Kombão</p>
          <h2>Novo namespace</h2>
          <p className="muted">Crie uma nova área de trabalho sem sair do fluxo atual.</p>
        </div>
        <label>
          Nome
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Operação semana"
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" disabled={loading || !name.trim()}>
            {loading ? "Criando..." : "Criar namespace"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
