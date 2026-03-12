import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { STATUSES } from "../constants/board";
import type { CardStatus } from "../types/kanban";
import { Modal } from "./Modal";

type CardModalProps = {
  isOpen: boolean;
  loading: boolean;
  status: CardStatus | null;
  onClose: () => void;
  onSubmit: (title: string, description: string, status: CardStatus) => Promise<void>;
};

export function CardModal({ isOpen, loading, status, onClose, onSubmit }: CardModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
    }
  }, [isOpen]);

  const currentStatus = status ?? "do";
  const statusLabel = STATUSES.find((item) => item.id === currentStatus)?.label ?? "To do";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    await onSubmit(trimmed, description.trim(), currentStatus);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova atividade">
      <form className="modal-content" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">{statusLabel}</p>
          <h2>Nova atividade</h2>
          <p className="muted">Adicione uma tarefa.</p>
        </div>
        <label>
          Título
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex.: Validar entrega"
          />
        </label>
        <label>
          Descrição
          <textarea
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Contexto, dependências ou observações."
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" disabled={loading || !title.trim()}>
            {loading ? "Salvando..." : "Criar atividade"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
