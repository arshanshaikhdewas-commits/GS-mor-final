import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Plus,
  Trash2,
  Globe,
  Sun,
  Moon,
  ChevronRight,
  FileText,
  Calendar,
  Edit2,
  User,
  MapPin,
  Phone,
  IdCard,
  X,
  Save,
  CheckCircle2,
  Upload,
  RotateCcw,
  Settings
} from "lucide-react";
import { Bill, Language, ThemeMode, Client } from "../types";
import { translations } from "../translations";
import { watermarkImage } from "../utils/watermarkImage";

const processImageToCircularPng = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvasSize = 512;
        const canvas = document.createElement("canvas");
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.clearRect(0, 0, canvasSize, canvasSize);

        ctx.beginPath();
        ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, canvasSize, canvasSize);

        try {
          const dataUrl = canvas.toDataURL("image/png", 1.0);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => {
        reject(new Error("Invalid image format"));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error("Could not read file"));
    };
    reader.readAsDataURL(file);
  });
};

interface HomeScreenProps {
  bills: Bill[];
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
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
  clients,
  setClients,
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

  // Tab State
  const [activeTab, setActiveTab] = useState<"bills" | "clients" | "settings">("bills");

  // Watermark States
  const [watermarkUrl, setWatermarkUrl] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gs_watermark");
    }
    return null;
  });
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [settingsErr, setSettingsErr] = useState<string | null>(null);

  React.useEffect(() => {
    const initWatermark = async () => {
      if (typeof window !== "undefined") {
        const currentWatermark = localStorage.getItem("gs_watermark");
        const isInitializedV3 = localStorage.getItem("gs_watermark_initialized_v3") === "true";
        
        // Initialize to image.png if not present or not initialized to V3 yet
        if (currentWatermark === null || !isInitializedV3) {
          try {
            const res = await fetch("/image.png");
            if (res.ok) {
              const blob = await res.blob();
              const file = new File([blob], "image.png", { type: "image/png" });
              const processedUrl = await processImageToCircularPng(file);
              localStorage.setItem("gs_watermark", processedUrl);
              localStorage.setItem("gs_watermark_initialized_v3", "true");
              setWatermarkUrl(processedUrl);
            } else {
              localStorage.setItem("gs_watermark", watermarkImage);
              localStorage.setItem("gs_watermark_initialized_v3", "true");
              setWatermarkUrl(watermarkImage);
            }
          } catch (e) {
            console.log("No workspace image.png file found or server offline.", e);
            localStorage.setItem("gs_watermark", watermarkImage);
            localStorage.setItem("gs_watermark_initialized_v3", "true");
            setWatermarkUrl(watermarkImage);
          }
        }
      }
    };
    initWatermark();
  }, []);

  // Client Management States
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientNameForm, setClientNameForm] = useState("");
  const [clientAddressForm, setClientAddressForm] = useState("");
  const [mobileNumberForm, setMobileNumberForm] = useState("");
  const [gstinForm, setGstinForm] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter bills
  const filteredBills = bills.filter((bill) => {
    const q = searchQuery.toLowerCase();
    const matchesClient = bill.clientName.toLowerCase().includes(q);
    const matchesOldDesc = bill.workDescription?.toLowerCase().includes(q) || false;
    const matchesItems = bill.items?.some(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
    ) || false;

    return matchesClient || matchesOldDesc || matchesItems;
  });

  // Filter clients
  const filteredClients = clients.filter((client) => {
    const q = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(q) ||
      client.address.toLowerCase().includes(q) ||
      client.mobileNumber.toLowerCase().includes(q) ||
      client.gstin.toLowerCase().includes(q)
    );
  });

  // Save/Update Client handler
  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientNameForm.trim()) {
      setFormError(t.error_fill_required);
      return;
    }

    const trimmedGstin = gstinForm.trim().toUpperCase();

    if (editingClient) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === editingClient.id
            ? {
                ...c,
                name: clientNameForm.trim(),
                address: clientAddressForm.trim(),
                mobileNumber: mobileNumberForm.trim(),
                gstin: trimmedGstin,
              }
            : c
        )
      );
      setSuccessMsg(t.client_saved || "Client updated successfully!");
      setEditingClient(null);
    } else {
      // Check if client name already exists (optional guidance)
      const newClient: Client = {
        id: `client-${Date.now()}`,
        name: clientNameForm.trim(),
        address: clientAddressForm.trim(),
        mobileNumber: mobileNumberForm.trim(),
        gstin: trimmedGstin,
      };
      setClients((prev) => [newClient, ...prev]);
      setSuccessMsg(t.client_saved || "Client added successfully!");
    }

    // Reset Form
    setClientNameForm("");
    setClientAddressForm("");
    setMobileNumberForm("");
    setGstinForm("");
    setFormError(null);

    // Auto-clear success message
    setTimeout(() => {
      setSuccessMsg(null);
    }, 3000);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setClientNameForm(client.name);
    setClientAddressForm(client.address);
    setMobileNumberForm(client.mobileNumber);
    setGstinForm(client.gstin);
    setFormError(null);
    setSuccessMsg(null);
  };

  const handleDeleteClient = (client: Client) => {
    setClientToDelete(client);
  };

  const confirmDeleteClient = () => {
    if (!clientToDelete) return;
    const clientId = clientToDelete.id;
    setClients((prev) => prev.filter((c) => c.id !== clientId));
    setSuccessMsg(t.client_deleted || "Client deleted successfully!");
    if (editingClient?.id === clientId) {
      handleCancelEdit();
    }
    setClientToDelete(null);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 3000);
  };

  const handleCancelEdit = () => {
    setEditingClient(null);
    setClientNameForm("");
    setClientAddressForm("");
    setMobileNumberForm("");
    setGstinForm("");
    setFormError(null);
  };

  // Helper for generating premium avatar initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return "C";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6" id="home-screen-root">
      {/* Top Header / Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8" id="header-container">
        <div className="flex items-center gap-3" id="brand-container">
          <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden shadow-md shadow-slate-200/20 dark:shadow-none" id="brand-logo-badge">
            <img src="/image.png" alt="GS" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
          placeholder={activeTab === "bills" ? t.search_bills : t.search_clients}
          className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all"
          id="input-search"
        />
      </div>

      {/* Segmented Tab Bar Selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-6" id="home-tabs">
        <button
          onClick={() => {
            setActiveTab("bills");
            setFormError(null);
          }}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "bills"
              ? "border-amber-500 text-amber-600 dark:text-amber-500"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
          id="tab-bills"
        >
          {t.bill_history} ({filteredBills.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("clients");
            setFormError(null);
          }}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "clients"
              ? "border-amber-500 text-amber-600 dark:text-amber-500"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
          id="tab-clients"
        >
          {t.manage_clients} ({clients.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("settings");
            setFormError(null);
          }}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "settings"
              ? "border-amber-500 text-amber-600 dark:text-amber-500"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
          id="tab-settings"
        >
          {t.manage_watermark}
        </button>
      </div>

      {/* Render Main Content Panel */}
      <AnimatePresence mode="wait">
        {activeTab === "bills" ? (
          <motion.div
            key="bills-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
            id="bills-list-section"
          >
            {filteredBills.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
                id="empty-state-card"
              >
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-slate-600 dark:text-slate-300 font-medium" id="empty-state-text">
                  {t.no_bills_found}
                </p>
              </div>
            ) : (
              <div className="grid gap-3" id="bills-grid">
                {filteredBills.map((bill, index) => (
                  <div
                    key={bill.id}
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
                        {bill.items && bill.items.length > 0
                          ? bill.items.map((item) => item.name).join(", ")
                          : bill.workDescription}
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
                          setBillToDelete(bill);
                        }}
                        className="p-2 text-slate-400 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-lg cursor-pointer transition-colors"
                        id={`bill-delete-btn-${bill.id}`}
                        title={t.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : activeTab === "clients" ? (
          <motion.div
            key="clients-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
            id="clients-manager-panel"
          >
            {/* Success and Error Alerts */}
            {successMsg && (
              <div
                className="flex items-center gap-2 p-3 text-sm font-semibold rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                id="client-success-alert"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {formError && (
              <div
                className="p-3 text-sm font-semibold rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400"
                id="client-error-alert"
              >
                {formError}
              </div>
            )}

            {/* Client Creation/Editing Card */}
            <form
              onSubmit={handleSaveClient}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4"
              id="client-form"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800" id="client-form-header">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-500" />
                  <span>{editingClient ? t.edit_client : t.add_client}</span>
                </h3>
                {editingClient && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="client-form-inputs">
                {/* Client Name */}
                <div className="space-y-1" id="client-name-input-group">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{t.client_name} *</span>
                  </label>
                  <input
                    type="text"
                    value={clientNameForm}
                    onChange={(e) => setClientNameForm(e.target.value)}
                    placeholder={t.client_name_hint}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    required
                  />
                </div>

                {/* GSTIN */}
                <div className="space-y-1" id="client-gstin-input-group">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <IdCard className="w-3 h-3 text-slate-400" />
                    <span>{t.gstin}</span>
                  </label>
                  <input
                    type="text"
                    value={gstinForm}
                    onChange={(e) => setGstinForm(e.target.value)}
                    placeholder={t.gstin_hint}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all font-mono"
                  />
                </div>

                {/* Client Address */}
                <div className="space-y-1" id="client-address-input-group">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{t.client_address}</span>
                  </label>
                  <input
                    type="text"
                    value={clientAddressForm}
                    onChange={(e) => setClientAddressForm(e.target.value)}
                    placeholder={t.client_address_hint}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                </div>

                {/* Mobile Number */}
                <div className="space-y-1" id="client-phone-input-group">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{t.mobile_number}</span>
                  </label>
                  <input
                    type="tel"
                    value={mobileNumberForm}
                    onChange={(e) => setMobileNumberForm(e.target.value)}
                    placeholder={t.mobile_number_hint}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end" id="client-form-buttons">
                {editingClient && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-55"
                  >
                    {t.cancel}
                  </button>
                )}
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow shadow-amber-500/10 active:scale-95 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingClient ? t.edit_client : t.add_client}</span>
                </button>
              </div>
            </form>

            {/* Clients List Display */}
            <div className="space-y-3" id="clients-list-container">
              <h4 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Saved Clients ({filteredClients.length})
              </h4>

              {filteredClients.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                  id="clients-empty-state"
                >
                  <User className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                    {t.no_clients || "No saved clients. Add frequent clients to auto-fill invoices."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2" id="clients-bento-grid">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500/20 dark:hover:border-amber-500/20 shadow-sm flex gap-3 transition-all duration-200 relative group"
                      id={`client-card-${client.id}`}
                    >
                      {/* Premium Circle Initial Badge */}
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                        {getInitials(client.name)}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <h5 className="font-bold text-slate-900 dark:text-white text-sm truncate pr-16">
                          {client.name}
                        </h5>

                        {client.gstin && (
                          <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/5 dark:bg-amber-500/10 px-1.5 py-0.5 rounded w-fit">
                            <IdCard className="w-3 h-3 flex-shrink-0" />
                            <span>GST: {client.gstin}</span>
                          </div>
                        )}

                        {client.address && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span>{client.address}</span>
                          </p>
                        )}

                        {client.mobileNumber && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span>{client.mobileNumber}</span>
                          </p>
                        )}
                      </div>

                      {/* Floating hover or top-right action buttons */}
                      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClient(client)}
                          className="p-1.5 text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md cursor-pointer transition-colors"
                          title="Edit Client"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client)}
                          className="p-1.5 text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md cursor-pointer transition-colors"
                          title="Delete Client"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="settings-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
            id="settings-panel"
          >
            {/* Status alerts */}
            {settingsMsg && (
              <div
                className="flex items-center gap-2 p-3 text-sm font-semibold rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 animate-fade-in"
                id="settings-success-alert"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{settingsMsg}</span>
              </div>
            )}

            {settingsErr && (
              <div
                className="p-3 text-sm font-semibold rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 animate-fade-in"
                id="settings-error-alert"
              >
                {settingsErr}
              </div>
            )}

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6" id="watermark-card">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800" id="watermark-card-header">
                <Settings className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  {t.manage_watermark}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center" id="watermark-card-body">
                {/* Left side: Live Preview */}
                <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50" id="watermark-preview-box">
                  <h4 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                    {t.watermark_preview}
                  </h4>
                  
                  {watermarkUrl === "none" ? (
                    <div className="w-48 h-48 rounded-full border-4 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center p-4" id="watermark-preview-disabled">
                      <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                      <p className="text-xs font-semibold text-rose-500 dark:text-rose-400">
                        {t.no_watermark_preview}
                      </p>
                    </div>
                  ) : (
                    <div className="relative w-48 h-48 rounded-full border-4 border-dashed border-amber-500/30 dark:border-amber-500/20 flex items-center justify-center overflow-hidden bg-white p-2 shadow-inner group" id="watermark-preview-disc">
                      {/* Technical checker pattern dot grid for transparency preview */}
                      <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.12] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
                      <img
                        src={watermarkUrl || watermarkImage}
                        alt="Watermark Preview"
                        className="w-full h-full object-contain max-h-[160px] max-w-[160px] rounded-full relative z-10 transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>

                {/* Right side: Controls */}
                <div className="space-y-4" id="watermark-controls-box">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t.watermark_hint}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2" id="watermark-action-buttons">
                    {/* Hidden file input */}
                    <input
                      type="file"
                      id="watermark-file-input"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
                        if (!validTypes.includes(file.type)) {
                          setSettingsErr(t.invalid_image_error);
                          setSettingsMsg(null);
                          e.target.value = ""; // reset
                          return;
                        }

                        try {
                          const circularDataUrl = await processImageToCircularPng(file);
                          localStorage.setItem("gs_watermark", circularDataUrl);
                          setWatermarkUrl(circularDataUrl);
                          setSettingsMsg(t.watermark_updated_msg);
                          setSettingsErr(null);
                        } catch (err) {
                          console.error("Error processing watermark image:", err);
                          setSettingsErr(t.invalid_image_error);
                          setSettingsMsg(null);
                        }
                        e.target.value = ""; // reset
                      }}
                    />

                    {/* Change Button */}
                    <button
                      type="button"
                      onClick={() => {
                        document.getElementById("watermark-file-input")?.click();
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow shadow-amber-500/10 active:scale-95 transition-all cursor-pointer"
                      id="btn-change-watermark"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{t.change_watermark}</span>
                    </button>

                    {/* Remove Button */}
                    {watermarkUrl !== "none" && (
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem("gs_watermark", "none");
                          setWatermarkUrl("none");
                          setSettingsMsg(t.watermark_removed_msg);
                          setSettingsErr(null);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/10 transition-all cursor-pointer"
                        id="btn-remove-watermark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.remove_watermark}</span>
                      </button>
                    )}

                      {/* Reset Button */}
                    {watermarkUrl !== null && (
                      <button
                        type="button"
                        onClick={async () => {
                          localStorage.removeItem("gs_watermark");
                          localStorage.removeItem("gs_watermark_initialized_v2");
                          localStorage.removeItem("gs_watermark_initialized_v3");
                          setWatermarkUrl(null);
                          try {
                            const res = await fetch("/image.png");
                            if (res.ok) {
                              const blob = await res.blob();
                              const file = new File([blob], "image.png", { type: "image/png" });
                              const processedUrl = await processImageToCircularPng(file);
                              localStorage.setItem("gs_watermark", processedUrl);
                              localStorage.setItem("gs_watermark_initialized_v3", "true");
                              setWatermarkUrl(processedUrl);
                            } else {
                              localStorage.setItem("gs_watermark", watermarkImage);
                              localStorage.setItem("gs_watermark_initialized_v3", "true");
                              setWatermarkUrl(watermarkImage);
                            }
                          } catch (e) {
                            console.log("No workspace image.png file found or server offline.", e);
                            localStorage.setItem("gs_watermark", watermarkImage);
                            localStorage.setItem("gs_watermark_initialized_v3", "true");
                            setWatermarkUrl(watermarkImage);
                          }
                          setSettingsMsg(t.watermark_restored_msg);
                          setSettingsErr(null);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        id="btn-reset-watermark"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t.reset_watermark}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {billToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in animate-duration-200" id="confirm-delete-modal-home">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 max-w-sm w-full shadow-xl"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2" id="delete-modal-title-home">
                {t.delete_title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6" id="delete-modal-desc-home">
                {t.delete_confirm}
              </p>
              <div className="flex gap-3 justify-end" id="delete-modal-actions-home">
                <button
                  type="button"
                  onClick={() => setBillToDelete(null)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer animate-duration-150"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const toDelete = billToDelete;
                    setBillToDelete(null);
                    onDeleteBill(toDelete);
                  }}
                  className="px-4 py-2 text-sm font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/15 cursor-pointer animate-duration-150"
                >
                  {t.delete}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Client Delete Confirmation Modal */}
      <AnimatePresence>
        {clientToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in animate-duration-200" id="confirm-client-delete-modal">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 max-w-sm w-full shadow-xl"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2" id="client-delete-modal-title">
                {t.delete_client}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6" id="client-delete-modal-desc">
                {t.delete_client_confirm || "Are you sure you want to delete this client? This action cannot be undone."}
              </p>
              <div className="flex gap-3 justify-end" id="client-delete-modal-actions">
                <button
                  type="button"
                  onClick={() => setClientToDelete(null)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer animate-duration-150"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => confirmDeleteClient()}
                  className="px-4 py-2 text-sm font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/15 cursor-pointer animate-duration-150"
                >
                  {t.delete}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
