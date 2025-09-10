import { AnimatePresence, motion } from 'framer-motion'

export function Modal({ open, onClose, title, children, footer }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          <motion.div className="absolute inset-0 flex items-center justify-center p-4" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.15 }}>
            <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 font-medium">{title}</div>
              <div className="p-4">{children}</div>
              {footer && <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">{footer}</div>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}




























