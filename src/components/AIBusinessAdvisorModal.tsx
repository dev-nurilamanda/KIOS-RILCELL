import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Bot } from 'lucide-react';
import { AIBusinessAdvisor } from './AIBusinessAdvisor';
import { RilcellTransaction, ModalAccount, CustomerRecord } from '../types';

interface AIBusinessAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: RilcellTransaction[];
  accounts: ModalAccount[];
  cashOnHand: number;
  customers?: CustomerRecord[];
}

export const AIBusinessAdvisorModal: React.FC<AIBusinessAdvisorModalProps> = ({
  isOpen,
  onClose,
  transactions,
  accounts,
  cashOnHand,
  customers = [],
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.18 }}
          className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-indigo-200 dark:border-indigo-900/60 overflow-hidden flex flex-col relative max-h-[92vh]"
        >
          {/* Top Modal Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup AI Advisor"
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white flex items-center justify-center transition cursor-pointer shadow-md"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex-1 overflow-hidden">
            <AIBusinessAdvisor
              transactions={transactions}
              accounts={accounts}
              cashOnHand={cashOnHand}
              customers={customers}
              isModalMode={true}
              onCloseModal={onClose}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
