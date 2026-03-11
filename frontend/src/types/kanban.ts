export type CardStatus = "do" | "doing" | "done";

export type BoardStatus = {
  id: CardStatus;
  label: string;
};

export type Card = {
  id: number;
  namespace_id: number;
  title: string;
  description: string;
  status: CardStatus;
  position: number;
  created_at: string;
  updated_at: string;
};

export type Namespace = {
  id: number;
  name: string;
  position: number;
  cards: Card[];
};
