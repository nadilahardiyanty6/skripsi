"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function Modal({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 md:items-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-5 shadow-xl"
            initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 18, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="font-semibold">{title}</div>
              <button className="rounded-full border border-black/10 px-3 py-1 text-sm hover:bg-black/5 transition" onClick={onClose}>
                Close
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
