import { useEffect, useState } from "react";
import type { DragEvent } from "react";
import type { BoardStatus, Card } from "../types/kanban";

type BoardLaneProps = {
  cards: Card[];
  status: BoardStatus;
  onCreateCard: () => void;
  canCreateCard: boolean;
  showFullDescriptions: boolean;
  onCardOpen: (cardId: number) => void;
  onCardDragStart: (event: DragEvent<HTMLElement>, card: Card) => void;
  onCardDrop: (event: DragEvent<HTMLElement>, status: BoardStatus["id"]) => Promise<void>;
};

type LaneCardProps = {
  card: Card;
  showFullDescription: boolean;
  onOpen: (cardId: number) => void;
  onDragStart: (event: DragEvent<HTMLElement>, card: Card) => void;
};

function LaneCard({ card, showFullDescription, onOpen, onDragStart }: LaneCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const description = card.description.trim();
  const hasDescription = description.length > 0;
  const shouldAllowExpansion = hasDescription && (description.length > 120 || description.includes("\n"));
  const shouldShowDescription = showFullDescription;
  const descriptionText = hasDescription ? description : "Sem descrição";
  const isDescriptionExpanded = shouldShowDescription && isExpanded;

  useEffect(() => {
    if (!showFullDescription) {
      setIsExpanded(false);
    }
  }, [showFullDescription]);

  return (
    <article
      data-card-id={card.id}
      className="card"
      draggable
      aria-label={`Mover atividade ${card.title}`}
      title="Arrastar atividade"
      onDragStart={(event) => onDragStart(event, card)}
      onDoubleClick={() => onOpen(card.id)}
    >
      <div className="card-drag-handle" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <h3>{card.title}</h3>
      {shouldShowDescription ? (
        <div className="card-body">
          <p className={`card-description ${isDescriptionExpanded ? "expanded" : ""}`}>
            {descriptionText}
          </p>
          {shouldAllowExpansion ? (
            <button
              type="button"
              className="ghost card-expand-button"
              onClick={(event) => {
                event.stopPropagation();
                setIsExpanded((current) => !current);
              }}
              aria-label={isExpanded ? "Recolher descrição" : "Expandir descrição"}
              title={isExpanded ? "Recolher descrição" : "Expandir descrição"}
            >
              {isExpanded ? "–" : "..."}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function BoardLane({
  cards,
  status,
  onCreateCard,
  canCreateCard,
  showFullDescriptions,
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
            showFullDescription={showFullDescriptions}
            onOpen={onCardOpen}
            onDragStart={onCardDragStart}
          />
        ))}
      </div>
    </section>
  );
}
