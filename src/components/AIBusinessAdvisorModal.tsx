import React from 'react';
import { X } from 'lucide-react';
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-indigo-200 dark:border-indigo-900/60 overflow-hidden flex flex-col relative max-h-[92vh] animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup AI Advisor"
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white flex items-center justify-center transition cursor-pointer shadow-md"
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
      </div>
    </div>
  );
};

