import { useEffect, useRef, useState } from "react";

const PRESET_COLORS = ["#305252", "#8b5e3c", "#2f6e5b", "#7a4f67", "#286c8f", "#a05a2c"];

type TopBarProps = {
  namespaceName: string;
  currentUserLabel: string;
  theme: string;
  accentColor: string;
  showFullDescriptions: boolean;
  onThemeToggle: () => void;
  onToggleDescriptions: () => void;
  onAccentColorChange: (color: string) => void;
  onOpenProfileSettings: () => void;
  onLogout: () => void;
};

export function TopBar({
  namespaceName,
  currentUserLabel,
  theme,
  accentColor,
  showFullDescriptions,
  onThemeToggle,
  onToggleDescriptions,
  onAccentColorChange,
  onOpenProfileSettings,
  onLogout,
}: TopBarProps) {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [palettePosition, setPalettePosition] = useState({ top: 0, left: 0 });
  const paletteRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isPaletteOpen) {
      return;
    }

    function syncPalettePosition() {
      const trigger = triggerRef.current;
      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const width = 168;
      const gap = 8;
      const viewportPadding = 12;
      const left = Math.min(
        Math.max(viewportPadding, rect.right - width),
        window.innerWidth - width - viewportPadding,
      );
      const top = Math.min(
        rect.bottom + gap,
        window.innerHeight - 148 - viewportPadding,
      );

      setPalettePosition({ top, left });
    }

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (
        paletteRef.current &&
        !paletteRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsPaletteOpen(false);
      }
    }

    syncPalettePosition();
    window.addEventListener("click", handleOutsideClick);
    window.addEventListener("resize", syncPalettePosition);
    window.addEventListener("scroll", syncPalettePosition, true);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
      window.removeEventListener("resize", syncPalettePosition);
      window.removeEventListener("scroll", syncPalettePosition, true);
    };
  }, [isPaletteOpen]);

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Kombão</p>
        <h1>{namespaceName}</h1>
      </div>
      <div className="toolbar">
        <div ref={paletteRef} className="palette-picker">
          <button
            ref={triggerRef}
            type="button"
            className="ghost color-trigger"
            onClick={() => setIsPaletteOpen((current) => !current)}
            aria-label="Escolher cor principal"
            title="Escolher cor principal"
          >
            <span className="color-dot" style={{ backgroundColor: accentColor }} />
          </button>
          {isPaletteOpen ? (
            <div
              ref={paletteRef}
              className="palette-popover"
              style={{ top: `${palettePosition.top}px`, left: `${palettePosition.left}px` }}
            >
              <div className="palette-swatches">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="palette-swatch"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      onAccentColorChange(color);
                      setIsPaletteOpen(false);
                    }}
                    aria-label={`Usar cor ${color}`}
                  />
                ))}
              </div>
              <input
                className="palette-input"
                type="color"
                value={accentColor}
                onChange={(event) => onAccentColorChange(event.target.value)}
                aria-label="Escolher cor personalizada"
              />
            </div>
          ) : null}
        </div>
        <button type="button" className="ghost" onClick={onToggleDescriptions}>
          Descrições: {showFullDescriptions ? "on" : "off"}
        </button>
        <button type="button" className="ghost" onClick={onThemeToggle}>
          Tema: {theme}
        </button>
        <button type="button" className="ghost user-button" onClick={onOpenProfileSettings}>
          {currentUserLabel}
        </button>
        <button type="button" className="ghost" onClick={onLogout}>
          Sair
        </button>
      </div>
    </header>
  );
}
