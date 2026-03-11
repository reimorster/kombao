import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type ModalProps = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

export function Modal({ children, isOpen, onClose, title }: ModalProps) {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      setIsClosing(false);
      return;
    }

    if (!isMounted) {
      return;
    }

    setIsClosing(true);
    const timeoutId = window.setTimeout(() => {
      setIsMounted(false);
      setIsClosing(false);
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, isMounted]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMounted, onClose]);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={`modal-overlay ${isClosing ? "is-closing" : "is-open"}`}
      onClick={onClose}
      aria-hidden="true"
    >
      <section
        className={`modal-panel ${isClosing ? "is-closing" : "is-open"}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </section>
    </div>
  );
}
