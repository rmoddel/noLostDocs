"use client";

import { useEffect, useRef, type ReactNode } from "react";

let openModalCount = 0;
let originalBodyOverflow = "";

/** Native dialogs provide focus containment, inert background, and nested Escape handling. */
export function Modal({ children, className, labelledBy, onClose, busy = false }: {
  children: ReactNode;
  className: string;
  labelledBy: string;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    if (openModalCount === 0) originalBodyOverflow = document.body.style.overflow;
    openModalCount += 1;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      openModalCount -= 1;
      if (openModalCount === 0) document.body.style.overflow = originalBodyOverflow;
    };
  }, []);
  return <dialog ref={ref} className={className} aria-labelledby={labelledBy} aria-busy={busy}
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    {children}
  </dialog>;
}
