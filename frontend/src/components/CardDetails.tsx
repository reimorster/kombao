import { useEffect, useState } from "react";
import type { DraftActivity, DraftActivityUpdate } from "../types/contract";
import { DRAFT_ACTIVITY_STATUSES } from "../utils/contractAdapters";

type CardDetailsProps = {
  card: DraftActivity;
  onSave: (cardId: number, payload: DraftActivityUpdate) => Promise<void>;
  onDelete: (cardId: number) => Promise<void>;
  onClose: () => void;
};

export function CardDetails({ card, onSave, onDelete, onClose }: CardDetailsProps) {
  const [draft, setDraft] = useState(card);

  useEffect(() => {
    setDraft(card);
  }, [card]);

  return (
    <div className="details">
      <div className="details-header">
        <div>
          <p className="eyebrow">Atividade</p>
          <h2>Editar detalhes</h2>
        </div>
        <button type="button" className="ghost" onClick={onClose}>
          Fechar
        </button>
      </div>

      <label>
        Título
        <input
          value={draft.title}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
        />
      </label>

      <label>
        Etapa
        <select
          value={draft.status}
          onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
        >
          {DRAFT_ACTIVITY_STATUSES.map((status) => (
            <option key={status.id} value={status.id} disabled={!status.apiReady}>
              {status.label}{status.apiReady ? "" : " (draft)"}
            </option>
          ))}
        </select>
        <small className="field-hint">
          Estados fora do board principal já fazem parte do contrato draft, mas ainda não são
          persistidos pela API atual.
        </small>
      </label>

      <label>
        Descrição
        <textarea
          rows={10}
          value={draft.description}
          onChange={(event) =>
            setDraft((current) => ({ ...current, description: event.target.value }))
          }
        />
      </label>

      <section className="details-section">
        <div className="details-section-header">
          <p className="eyebrow">Permissões</p>
          <span className="pill">{card.permissions.join(", ")}</span>
        </div>
        <p className="muted">
          O contrato draft já reserva espaço para `read`, `write_limited` e `write`. Nesta fase,
          o frontend assume permissão total no namespace atual.
        </p>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <p className="eyebrow">Histórico</p>
          <span className="pill">draft</span>
        </div>
        <div className="history-list">
          {card.history.map((entry) => (
            <article key={entry.id} className="history-item">
              <div className="history-item-header">
                <strong>{entry.message}</strong>
                <span>{new Date(entry.occurredAt).toLocaleString("pt-BR")}</span>
              </div>
              <p className="muted">
                {entry.actorLabel} · {entry.type}
              </p>
            </article>
          ))}
        </div>
      </section>

      <div className="details-actions">
        <button
          type="button"
          onClick={() =>
            void onSave(card.id, {
              title: draft.title,
              description: draft.description,
              status: draft.status,
            })
          }
        >
          Salvar
        </button>
        <button type="button" className="danger" onClick={() => void onDelete(card.id)}>
          Apagar atividade
        </button>
      </div>
    </div>
  );
}
