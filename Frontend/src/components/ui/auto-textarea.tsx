"use client";

import { useLayoutEffect, useRef, type ComponentProps } from "react";

export function AutoTextarea(props: ComponentProps<"textarea">) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    const fit = () => {
      textarea.style.height = "auto";
      const style = getComputedStyle(textarea);
      const border =
        style.boxSizing === "border-box"
          ? parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth)
          : -parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      textarea.style.height = `${textarea.scrollHeight + border}px`;
    };
    fit();
    let width = textarea.getBoundingClientRect().width;
    const observer = new ResizeObserver(() => {
      const nextWidth = textarea.getBoundingClientRect().width;
      if (nextWidth !== width) {
        width = nextWidth;
        fit();
      }
    });
    observer.observe(textarea);
    return () => observer.disconnect();
  }, [props.value]);

  return (
    <textarea
      {...props}
      ref={ref}
      style={{ ...props.style, resize: "none", overflowY: "hidden" }}
    />
  );
}
