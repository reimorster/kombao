type TopBarProps = {
  namespaceName: string;
  theme: string;
  onThemeToggle: () => void;
  onLogout: () => void;
};

export function TopBar({ namespaceName, theme, onThemeToggle, onLogout }: TopBarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Kombão</p>
        <h1>{namespaceName}</h1>
      </div>
      <div className="toolbar">
        <button type="button" className="ghost" onClick={onThemeToggle}>
          Tema: {theme}
        </button>
        <button type="button" className="ghost" onClick={onLogout}>
          Sair
        </button>
      </div>
    </header>
  );
}
