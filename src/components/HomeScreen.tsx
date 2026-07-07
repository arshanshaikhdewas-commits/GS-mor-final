import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, Trash2, Globe, Sun, Moon, ChevronRight, FileText, Calendar, DollarSign } from "lucide-react";
import { Bill, Language, ThemeMode } from "../types";
import { translations } from "../translations";

interface HomeScreenProps {
  bills: Bill[];
  language: Language;
  theme: ThemeMode;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: ThemeMode) => void;
  onSelectBill: (id: number) => void;
  onCreateNewBill: () => void;
  onDeleteBill: (bill: Bill) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  bills,
  language,
  theme,
  searchQuery,
  setSearchQuery,
  setLanguage,
  setTheme,
  onSelectBill,
  onCreateNewBill,
  onDeleteBill,
}) => {
  const t = translations[language];

  // Filter bills based on client name or work description
  const filteredBills = bills.filter((bill) => {
    const q = searchQuery.toLowerCase();
    return (
      bill.clientName.toLowerCase().includes(q) ||
      bill.workDescription.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6" id="home-screen-root">
      {/* Top Header / Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8" id="header-container">
        <div className="flex items-center gap-3" id="brand-container">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20" id="brand-logo-badge">
            <span className="font-extrabold text-xl">GS</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white" id="app-title">
              {t.app_name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium" id="app-subtitle">
              Heavy Machinery & Earthwork Contractor
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3" id="controls-bar">
          {/* Language Selector */}
          <button
            onClick={() => setLanguage(language === "en" ? "hi" : "en")}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
            id="btn-lang-toggle"
            title={t.select_language}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === "en" ? "हिंदी" : "English"}</span>
          </button>

          {/* Theme Selector */}
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
            id="btn-theme-toggle"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Create New Bill Button */}
          <button
            onClick={onCreateNewBill}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            id="btn-create-bill"
          >
            <Plus className="w-4 h-4" />
            <span>{t.nav_create_bill}</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-6" id="search-container">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.search_bills}
          className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all"
          id="input-search"
        />
      </div>

      {/* Bills List / Grid */}
      <div className="space-y-4" id="bills-list-section">
        <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2" id="bills-list-title">
          {t.bill_history} ({filteredBills.length})
        </h2>

        {filteredBills.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
            id="empty-state-card"
          >
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-slate-600 dark:text-slate-300 font-medium" id="empty-state-text">
              {t.no_bills_found}
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-3" id="bills-grid">
            <AnimatePresence mode="popLayout">
              {filteredBills.map((bill, index) => (
                <motion.div
                  key={bill.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="group relative flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500/30 dark:hover:border-amber-500/30 shadow-sm hover:shadow-md hover:shadow-amber-500/[0.02] cursor-pointer transition-all duration-200"
                  onClick={() => onSelectBill(bill.id)}
                  id={`bill-card-${bill.id}`}
                >
                  <div className="flex-1 min-w-0" id={`bill-info-${bill.id}`}>
                    <div className="flex items-center gap-2.5 mb-1" id={`bill-header-${bill.id}`}>
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-500 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded" id={`bill-invoice-${bill.id}`}>
                        {bill.invoiceNumber}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500" id={`bill-date-container-${bill.id}`}>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{bill.date}</span>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-800 dark:text-white truncate" id={`bill-client-${bill.id}`}>
                      {bill.clientName}
                    </h3>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" id={`bill-work-${bill.id}`}>
                      {bill.workDescription}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 ml-4" id={`bill-actions-${bill.id}`}>
                    {/* Amount Block */}
                    <div className="text-right" id={`bill-amount-block-${bill.id}`}>
                      <p className="text-sm text-slate-400 dark:text-slate-500 font-medium" id={`bill-amount-label-${bill.id}`}>
                        {t.total_amount}
                      </p>
                      <p className="text-lg font-black text-slate-800 dark:text-white" id={`bill-amount-${bill.id}`}>
                        ₹{bill.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    {/* Navigation Arrow */}
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />

                    {/* Delete Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBill(bill);
                      }}
                      className="p-2 text-slate-400 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-lg cursor-pointer transition-colors"
                      id={`bill-delete-btn-${bill.id}`}
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
