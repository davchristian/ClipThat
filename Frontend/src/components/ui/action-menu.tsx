"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

export function ActionMenu({
  label = "Lainnya",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function close(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) ref.current?.removeAttribute("open");
    }
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") ref.current?.removeAttribute("open");
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <details className="action-menu" ref={ref}>
      <summary className="icon-button" aria-label={label} title={label}>
        <MoreHorizontal size={21} />
      </summary>
      <div className="menu-items" onClick={() => ref.current?.removeAttribute("open")}>
        {children}
      </div>
    </details>
  );
}
