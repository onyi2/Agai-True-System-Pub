import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar as CalendarIcon, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { Sale, Expense, Loss, InventoryItem } from '../types';

interface DailyReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: Sale[];
  expenses: Expense[];
  losses: Loss[];
  inventory: InventoryItem[];
}

export function DailyReportsModal({ isOpen, onClose, sales, expenses, losses, inventory }: DailyReportsModalProps) {
  // Calculate yesterday's metrics
  const yesterdayMetrics = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdaySales = sales.filter(s => s.timestamp.startsWith(yesterdayStr));
    const yesterdayExpenses = expenses.filter(e => e.date.startsWith(yesterdayStr));
    const yesterdayLosses = losses.filter(l => l.date.startsWith(yesterdayStr));

    const revenue = yesterdaySales.reduce((acc, s) => acc + s.totalAmount, 0);
    const cogs = yesterdaySales.reduce((acc, s) => acc + s.totalCost, 0);
    const expenseTotal = yesterdayExpenses.reduce((acc, e) => acc + e.amount, 0);
    const lossTotal = yesterdayLosses.reduce((acc, l) => acc + l.costValue, 0);
    const netProfit = revenue - cogs - expenseTotal - lossTotal;

    return {
      date: yesterday.toLocaleDateString(),
      revenue,
      cogs,
      expenseTotal,
      lossTotal,
      netProfit,
      salesCount: yesterdaySales.length
    };
  }, [sales, expenses, losses]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-brand-card border border-brand-card-light rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-brand-card-light flex items-center justify-between bg-brand-card-light/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-emerald/20 text-brand-emerald rounded-full flex items-center justify-center">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-display">Daily Automated Report</h2>
                <p className="text-xs text-brand-light/60">Summary for Yesterday: {yesterdayMetrics.date}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-brand-card-light rounded-full transition-colors text-brand-light/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto space-y-6">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-brand-dark border border-brand-card-light p-4 rounded-xl">
                <p className="text-[10px] text-brand-light/50 font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                <p className="text-lg font-bold text-emerald-400">KES {yesterdayMetrics.revenue.toLocaleString()}</p>
                <div className="text-[10px] text-brand-light/40 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {yesterdayMetrics.salesCount} transactions
                </div>
              </div>
              
              <div className="bg-brand-dark border border-brand-card-light p-4 rounded-xl">
                <p className="text-[10px] text-brand-light/50 font-bold uppercase tracking-wider mb-1">Net Profit</p>
                <p className={`text-lg font-bold ${yesterdayMetrics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  KES {yesterdayMetrics.netProfit.toLocaleString()}
                </p>
                <div className="text-[10px] text-brand-light/40 mt-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> After all costs
                </div>
              </div>

              <div className="bg-brand-dark border border-brand-card-light p-4 rounded-xl">
                <p className="text-[10px] text-brand-light/50 font-bold uppercase tracking-wider mb-1">Total Expenses</p>
                <p className="text-lg font-bold text-amber-400">KES {yesterdayMetrics.expenseTotal.toLocaleString()}</p>
              </div>

              <div className="bg-brand-dark border border-brand-card-light p-4 rounded-xl">
                <p className="text-[10px] text-brand-light/50 font-bold uppercase tracking-wider mb-1">Variance Loss</p>
                <p className="text-lg font-bold text-red-400">KES {yesterdayMetrics.lossTotal.toLocaleString()}</p>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="bg-brand-dark/50 border border-brand-card-light rounded-xl overflow-hidden">
              <div className="p-4 border-b border-brand-card-light bg-brand-card-light/20">
                <h3 className="font-bold text-sm text-white">Financial Breakdown</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brand-light/70">Gross Revenue</span>
                  <span className="font-medium text-emerald-400">KES {yesterdayMetrics.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brand-light/70">Cost of Goods Sold (COGS)</span>
                  <span className="font-medium text-amber-400">- KES {yesterdayMetrics.cogs.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brand-light/70">Overhead Expenses</span>
                  <span className="font-medium text-amber-400">- KES {yesterdayMetrics.expenseTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brand-light/70">Variance / Spillage Loss</span>
                  <span className="font-medium text-red-400">- KES {yesterdayMetrics.lossTotal.toLocaleString()}</span>
                </div>
                <div className="h-px bg-brand-card-light my-2"></div>
                <div className="flex justify-between items-center font-bold">
                  <span className="text-white">Net Profit</span>
                  <span className={yesterdayMetrics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    KES {yesterdayMetrics.netProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

          </div>
          
          <div className="p-4 border-t border-brand-card-light bg-brand-card-light/10 flex justify-end">
             <button
                onClick={onClose}
                className="bg-brand-card-light hover:bg-brand-card-light/80 text-white px-6 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                Close Report
              </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
