import { useEffect, useRef } from "react";

export function useShellLayout(dependencies: readonly unknown[]) {
  const appShellRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const shell = appShellRef.current;
    const header = headerRef.current;
    const footer = footerRef.current;

    if (!shell || !header || !footer) {
      return;
    }

    function syncShellLayout() {
      shell.style.setProperty("--app-header-height", `${header.offsetHeight}px`);
      shell.style.setProperty("--app-footer-height", `${footer.offsetHeight}px`);
    }

    syncShellLayout();

    const observer = new ResizeObserver(() => syncShellLayout());
    observer.observe(header);
    observer.observe(footer);
    window.addEventListener("resize", syncShellLayout);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncShellLayout);
    };
  }, dependencies);

  return {
    appShellRef,
    footerRef,
    headerRef,
  };
}
