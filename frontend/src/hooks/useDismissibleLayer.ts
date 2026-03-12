import { useEffect, useRef } from "react";

export function useDismissibleLayer<T extends HTMLElement>(enabled: boolean, onDismiss: () => void) {
  const layerRef = useRef<T | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function handleOutsideClick(event: MouseEvent) {
      if (layerRef.current && !layerRef.current.contains(event.target as Node)) {
        onDismiss();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onDismiss();
      }
    }

    window.addEventListener("click", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [enabled, onDismiss]);

  return layerRef;
}
