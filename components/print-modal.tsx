"use client";

import { Printer, X } from "lucide-react";
import { useEffect } from "react";

type PrintModalProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function PrintModal({ title, open, onClose, children }: PrintModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="print-modal-root fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="print-modal-shell max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white shadow-2xl">
        <div className="print:hidden flex items-center justify-between border-b border-[#93C5FD]/40 px-5 py-3">
          <h3 className="text-lg font-bold text-[#2E3192]">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-md bg-[#2E3192] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#252884]"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#2E3192]"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="print-area p-6">{children}</div>
      </div>
    </div>
  );
}
