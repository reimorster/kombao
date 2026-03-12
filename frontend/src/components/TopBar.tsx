import { useEffect, useRef, useState } from "react";

const PRESET_COLORS = [
  { hex: "#305252", name: "Iron Keep" },
  { hex: "#8b5e3c", name: "Tanned Hide" },
  { hex: "#2f6e5b", name: "Emerald Vale" },
  { hex: "#7a4f67", name: "Plum Throne" },
  { hex: "#286c8f", name: "Frozen Moat" },
  { hex: "#a05a2c", name: "Copper Crown" },
  { hex: "#5c4a8a", name: "Violet Keep" },
  { hex: "#ba4242", name: "Dragon Fire" },
  { hex: "#a48d0d", name: "Golden Oath" },
];

type TopBarProps = {
  namespaceName: string;
  currentUserLabel: string;
  theme: string;
  accentColor: string;
  showFullDescriptions: boolean;
  onThemeChange: (theme: string) => void;
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
  onThemeChange,
  onToggleDescriptions,
  onAccentColorChange,
  onOpenProfileSettings,
  onLogout,
}: TopBarProps) {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [palettePosition, setPalettePosition] = useState({ top: 0, left: 0 });
  const paletteRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const customColorRef = useRef<HTMLInputElement | null>(null);

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
            onMouseEnter={() => {
              if (isPaletteOpen) return;
              const rect = triggerRef.current?.getBoundingClientRect();
              if (rect) {
                setTooltipPosition({
                  top: rect.top + rect.height / 4,
                  left: rect.left - 70,
                });
                setIsTooltipVisible(true);
              }
            }}
            onMouseLeave={() => setIsTooltipVisible(false)}
            aria-label="Escolher cor principal"
          >
            <span className="color-dot" style={{ backgroundColor: accentColor }} />
          </button>
          {isTooltipVisible && !isPaletteOpen ? (
            <span
              className="color-tooltip"
              style={{
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                transform: "translate(-100%, -50%)",
              }}
            >
              Tema
            </span>
          ) : null}
          {isPaletteOpen ? (
            <div
              ref={paletteRef}
              className="palette-popover"
              style={{ top: `${palettePosition.top}px`, left: `${palettePosition.left}px` }}
            >
              <div className="palette-swatches">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    className="palette-swatch"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => {
                      onAccentColorChange(color.hex);
                      setIsPaletteOpen(false);
                    }}
                    aria-label={color.name}
                    data-tooltip={color.name}
                  />
                ))}
              </div>
              <div className="palette-custom">
                <button
                  type="button"
                  className="palette-swatch palette-swatch-custom"
                  style={{
                    backgroundColor: PRESET_COLORS.some((c) => c.hex === accentColor)
                      ? "#b8af9e"
                      : accentColor,
                  }}
                  onClick={() => customColorRef.current?.click()}
                  aria-label="Cor personalizada"
                  data-tooltip="Personalizar"
                >
                  <span className="palette-swatch-plus">+</span>
                </button>
                <input
                  ref={customColorRef}
                  className="palette-input-hidden"
                  type="color"
                  value={accentColor}
                  onChange={(event) => onAccentColorChange(event.target.value)}
                />
              </div>
            </div>
          ) : null}
        </div>
        <button type="button" className="ghost" onClick={onToggleDescriptions}>
          Descrições: {showFullDescriptions ? "on" : "off"}
        </button>
        <div className="theme-switcher">
          <button type="button" className="ghost theme-trigger" aria-label="Tema">
            <i className={theme === "light" ? "ri-sun-line" : theme === "dark" ? "ri-moon-line" : "ri-computer-line"} />
          </button>
          <div className="theme-options">
            {[
              { id: "light", icon: "ri-sun-line", label: "Claro" },
              { id: "system", icon: "ri-computer-line", label: "Sistema" },
              { id: "dark", icon: "ri-moon-line", label: "Escuro" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`ghost theme-option ${theme === opt.id ? "active" : ""}`}
                onClick={() => onThemeChange(opt.id)}
                aria-label={opt.label}
              >
                <i className={opt.icon} />
              </button>
            ))}
          </div>
        </div>
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
