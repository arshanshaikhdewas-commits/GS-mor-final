import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bill, Language, ThemeMode } from "./types";
import { HomeScreen } from "./components/HomeScreen";
import { CreateBillScreen } from "./components/CreateBillScreen";
import { ViewBillScreen } from "./components/ViewBillScreen";

export default function App() {
  // --- Persistent Global State ---
  const [bills, setBills] = useState<Bill[]>(() => {
    const saved = localStorage.getItem("gs_bills");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("gs_language");
    return (saved as Language) || "en";
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("gs_theme");
    return (saved as ThemeMode) || "light";
  });

  // --- UI and Navigation State ---
  const [currentScreen, setCurrentScreen] = useState<"home" | "create" | "view">("home");
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // --- Auto Invoice Number Generation ---
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("GS-2026-001");

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem("gs_bills", JSON.stringify(bills));
    calculateNextInvoiceNumber();
  }, [bills]);

  useEffect(() => {
    localStorage.setItem("gs_language", language);
  }, [language]);

  // Sync dark class on document element
  useEffect(() => {
    localStorage.setItem("gs_theme", theme);
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Invoice numbering calculation logic based on Kotlin app
  const calculateNextInvoiceNumber = () => {
    const currentYear = 2026; // Set to current local year 2026 as per metadata
    if (bills.length === 0) {
      setNextInvoiceNumber(`GS-${currentYear}-001`);
      return;
    }

    // Sort bills by id to find the latest one
    const sorted = [...bills].sort((a, b) => b.id - a.id);
    const latestBill = sorted[0];
    const latestInvoice = latestBill.invoiceNumber;
    const parts = latestInvoice.split("-");

    if (parts.length === 3) {
      const year = parts[1];
      const lastNumStr = parts[2];
      const lastNum = parseInt(lastNumStr, 10);
      const nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
      const formattedNum = String(nextNum).padStart(3, "0");
      setNextInvoiceNumber(`GS-${year}-${formattedNum}`);
    } else {
      setNextInvoiceNumber(`GS-${currentYear}-001`);
    }
  };

  // Trigger calculations on mount
  useEffect(() => {
    calculateNextInvoiceNumber();
  }, []);

  // --- Core Handlers ---
  const handleSaveBill = (billData: Omit<Bill, "id">) => {
    const newBill: Bill = {
      ...billData,
      id: Date.now(), // safe unique numeric timestamp id
    };
    setBills((prev) => [newBill, ...prev]);
    setCurrentScreen("home");
  };

  const handleDeleteBill = (billToDelete: Bill) => {
    setBills((prev) => prev.filter((b) => b.id !== billToDelete.id));
    if (selectedBillId === billToDelete.id) {
      setSelectedBillId(null);
      setCurrentScreen("home");
    }
  };

  const selectedBill = bills.find((b) => b.id === selectedBillId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300" id="app-viewport">
      <AnimatePresence mode="wait">
        {currentScreen === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <HomeScreen
              bills={bills}
              language={language}
              theme={theme}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setLanguage={setLanguage}
              setTheme={setTheme}
              onSelectBill={(id) => {
                setSelectedBillId(id);
                setCurrentScreen("view");
              }}
              onCreateNewBill={() => setCurrentScreen("create")}
              onDeleteBill={handleDeleteBill}
            />
          </motion.div>
        )}

        {currentScreen === "create" && (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <CreateBillScreen
              language={language}
              nextInvoiceNumber={nextInvoiceNumber}
              onBack={() => setCurrentScreen("home")}
              onSave={handleSaveBill}
            />
          </motion.div>
        )}

        {currentScreen === "view" && selectedBill && (
          <motion.div
            key="view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ViewBillScreen
              bill={selectedBill}
              language={language}
              onBack={() => {
                setSelectedBillId(null);
                setCurrentScreen("home");
              }}
              onDelete={handleDeleteBill}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
