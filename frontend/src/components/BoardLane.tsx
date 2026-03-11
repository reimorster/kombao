import type { DragEvent } from "react";
import type { BoardStatus, Card } from "../types/kanban";

type BoardLaneProps = {
  cards: Card[];
  status: BoardStatus;
  onCreateCard: () => void;
  canCreateCard: boolean;
  onCardOpen: (cardId: number) => void;
  onCardDragStart: (event: DragEvent<HTMLElement>, card: Card) => void;
  onCardDrop: (event: DragEvent<HTMLElement>, status: BoardStatus["id"]) => Promise<void>;
};

type LaneCardProps = {
  card: Card;
  onOpen: (cardId: number) => void;
  onDragStart: (event: DragEvent<HTMLElement>, card: Card) => void;
};

function LaneCard({ card, onOpen, onDragStart }: LaneCardProps) {
  return (
    <article
      data-card-id={card.id}
      className="card"
      onDoubleClick={() => onOpen(card.id)}
    >
      <div
        className="card-drag-handle"
        draggable
        role="button"
        aria-label={`Mover atividade ${card.title}`}
        title="Arrastar atividade"
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
        onDragStart={(event) => onDragStart(event, card)}
      >
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <h3>{card.title}</h3>
      <p>{card.description || "Sem detalhes adicionais."}</p>
    </article>
  );
}

export function BoardLane({
  cards,
  status,
  onCreateCard,
  canCreateCard,
  onCardOpen,
  onCardDragStart,
  onCardDrop,
}: BoardLaneProps) {
  return (
    <section
      className="lane"
      data-lane={status.id}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => void onCardDrop(event, status.id)}
    >
      <div className="lane-header">
        <div className="lane-heading">
          <p className="lane-title">{status.label}</p>
          <span className="lane-count">{cards.length}</span>
        </div>
        {canCreateCard ? (
          <button
            type="button"
            className="ghost small icon-button"
            onClick={onCreateCard}
            aria-label="Nova atividade"
            title="Nova atividade"
          >
            +
          </button>
        ) : null}
      </div>
      <div className="lane-cards">
        {cards.map((card) => (
          <LaneCard
            key={card.id}
            card={card}
            onOpen={onCardOpen}
            onDragStart={onCardDragStart}
          />
        ))}
      </div>
    </section>
  );
}
