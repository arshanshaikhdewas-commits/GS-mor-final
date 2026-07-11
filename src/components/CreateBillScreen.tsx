import React, { useState } from "react";
import { ArrowLeft, Save, Calendar, User, MapPin, Phone, FileText, Percent, Plus, Trash2, IdCard } from "lucide-react";
import { Bill, Language, InvoiceItem, Client } from "../types";
import { translations } from "../translations";

interface CreateBillScreenProps {
  language: Language;
  clients: Client[];
  nextInvoiceNumber: string;
  onBack: () => void;
  onSave: (billData: Omit<Bill, "id">) => void;
}

export const CreateBillScreen: React.FC<CreateBillScreenProps> = ({
  language,
  clients,
  nextInvoiceNumber,
  onBack,
  onSave,
}) => {
  const t = translations[language];

  // Client Info States
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [clientGstin, setClientGstin] = useState("");
  
  // Format current date as dd-mm-yyyy for pre-fill
  const getTodayDateString = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const [date, setDate] = useState(getTodayDateString());
  
  // Dynamic Items State
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "item-1",
      name: "",
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    }
  ]);

  // Adjustments State
  const [additionalCharges, setAdditionalCharges] = useState("");
  const [discount, setDiscount] = useState("");
  const [taxRate, setTaxRate] = useState("0"); // Tax Rate % (GST/VAT)
  const [notes, setNotes] = useState("");
  
  // Validation / Error state
  const [error, setError] = useState<string | null>(null);

  // Core computation calculations updated instantly on any interaction
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const additional = parseFloat(additionalCharges) || 0;
  const disc = parseFloat(discount) || 0;
  const taxPct = parseFloat(taxRate) || 0;
  const taxAmount = (subtotal * taxPct) / 100;
  const totalAmount = Math.max(0, subtotal + additional - disc + taxAmount);

  // Dynamic Row Handlers
  const handleAddItem = () => {
    const newId = `item-${Date.now()}`;
    setItems((prev) => [
      ...prev,
      {
        id: newId,
        name: "",
        description: "",
        quantity: 1,
        rate: 0,
        amount: 0,
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return; // Must have at least one row
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        let updatedItem = { ...item };

        if (field === "name") {
          updatedItem.name = value;
        } else if (field === "description") {
          updatedItem.description = value;
        } else if (field === "quantity") {
          const qty = value === "" ? 0 : parseFloat(value);
          updatedItem.quantity = isNaN(qty) ? 0 : qty;
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        } else if (field === "rate") {
          const rateVal = value === "" ? 0 : parseFloat(value);
          updatedItem.rate = isNaN(rateVal) ? 0 : rateVal;
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }

        return updatedItem;
      })
    );
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure client name is provided
    if (!clientName.trim()) {
      setError(t.error_fill_required);
      return;
    }

    // Filter out blank rows
    const validItems = items.filter((item) => item.name.trim() !== "");
    if (validItems.length === 0) {
      setError(t.error_no_items || "Please add at least one valid item");
      return;
    }

    // Secondary number validations
    if (isNaN(additional) || isNaN(disc) || isNaN(taxPct)) {
      setError(t.error_invalid_numbers);
      return;
    }

    // Create backward-compatible description for old code
    const mainDesc = validItems.map(i => `${i.name} (x${i.quantity})`).join(", ");

    onSave({
      invoiceNumber: nextInvoiceNumber,
      clientName,
      clientAddress,
      mobileNumber,
      clientGstin: clientGstin.trim().toUpperCase(),
      date,
      items: validItems,
      subtotal,
      additionalCharges: additional,
      discount: disc,
      taxRate: taxPct,
      taxAmount,
      notes,
      totalAmount,
      // Fallbacks
      workDescription: mainDesc,
      totalWorkingHours: validItems[0]?.quantity || 0,
      ratePerHour: validItems[0]?.rate || 0,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6" id="create-bill-root">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6" id="create-bill-header">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 p-2 text-sm font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          id="btn-back-to-home"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.nav_home}</span>
        </button>

        <div className="text-right" id="invoice-no-preview">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{t.invoice_no}</p>
          <p className="text-sm font-mono font-bold text-amber-600 dark:text-amber-500">{nextInvoiceNumber}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6" id="form-card">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6" id="form-title">
          {t.nav_create_bill}
        </h2>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-semibold animate-shake" id="form-error-banner">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" id="billing-form">
          {/* CLIENT DETAILS */}
          <div className="space-y-4" id="section-client-details">
            <div className="flex flex-wrap justify-between items-center gap-2" id="client-section-header">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.client_name} &amp; Info</h3>
              {/* Quick Auto-Fill Dropdown */}
              {clients && clients.length > 0 && (
                <div className="flex items-center gap-2" id="quick-fill-container">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{t.autofill_hint || "Use saved client"}:</span>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const selected = clients.find(c => c.id === val);
                        if (selected) {
                          setClientName(selected.name);
                          setClientAddress(selected.address);
                          setMobileNumber(selected.mobileNumber);
                          setClientGstin(selected.gstin);
                        }
                      }
                      e.target.value = ""; // reset
                    }}
                    className="text-xs font-bold text-amber-600 dark:text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 rounded-md px-2.5 py-1 outline-none cursor-pointer transition-colors max-w-[200px]"
                    defaultValue=""
                  >
                    <option value="" disabled>{t.select_client || "Select a Saved Client"}</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="grid-client-inputs">
              {/* Client Name */}
              <div className="space-y-1.5" id="field-client-name">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.client_name} *</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={t.client_name_hint}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5" id="field-date">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.date} *</span>
                </label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="DD-MM-YYYY"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Client Address */}
              <div className="space-y-1.5" id="field-address">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.client_address}</span>
                </label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder={t.client_address_hint}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5" id="field-phone">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.mobile_number}</span>
                </label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder={t.mobile_number_hint}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>

              {/* GSTIN Field */}
              <div className="space-y-1.5 md:col-span-2" id="field-gstin">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <IdCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.gstin}</span>
                </label>
                <input
                  type="text"
                  value={clientGstin}
                  onChange={(e) => setClientGstin(e.target.value)}
                  placeholder={t.gstin_hint}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all font-mono"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* DYNAMIC ITEM ROWS */}
          <div className="space-y-4" id="section-items-table">
            <div className="flex justify-between items-center" id="items-meta-bar">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t.work_description} / Items ({items.length})
              </h3>
            </div>

            {/* Desktop Table Header Labels */}
            <div className="hidden md:grid grid-cols-12 gap-3 pb-2 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
              <div className="col-span-4">{t.item_name} *</div>
              <div className="col-span-3">{t.item_description}</div>
              <div className="col-span-2 text-right">{t.quantity} *</div>
              <div className="col-span-2 text-right">{t.rate} *</div>
              <div className="col-span-1 text-right">{t.amount}</div>
            </div>

            {/* Items Rows */}
            <div className="space-y-3" id="items-rows-container">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex flex-col md:grid md:grid-cols-12 gap-3 p-4 md:p-2 rounded-xl md:rounded-none border border-slate-100 dark:border-slate-800 md:border-none bg-slate-50/50 dark:bg-slate-950/20 md:bg-transparent relative"
                  id={`item-row-${item.id}`}
                >
                  {/* Mobile Delete Option */}
                  {items.length > 1 && (
                    <div className="absolute top-3 right-3 md:hidden">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Item Name */}
                  <div className="col-span-4 space-y-1 md:space-y-0" id={`field-name-${item.id}`}>
                    <label className="block md:hidden text-[10px] font-bold text-slate-400 uppercase">{t.item_name} *</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                      placeholder={t.item_name_hint}
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      required={idx === 0}
                    />
                  </div>

                  {/* Description */}
                  <div className="col-span-3 space-y-1 md:space-y-0" id={`field-desc-${item.id}`}>
                    <label className="block md:hidden text-[10px] font-bold text-slate-400 uppercase">{t.item_description}</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                      placeholder={t.item_description_hint}
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="col-span-2 space-y-1 md:space-y-0" id={`field-qty-${item.id}`}>
                    <label className="block md:hidden text-[10px] font-bold text-slate-400 uppercase">{t.quantity} *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.quantity === 0 ? "" : item.quantity}
                      onChange={(e) => handleUpdateItem(item.id, "quantity", e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 text-sm text-left md:text-right rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all font-mono"
                      required
                    />
                  </div>

                  {/* Rate */}
                  <div className="col-span-2 space-y-1 md:space-y-0" id={`field-rate-${item.id}`}>
                    <label className="block md:hidden text-[10px] font-bold text-slate-400 uppercase">{t.rate} *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.rate === 0 ? "" : item.rate}
                      onChange={(e) => handleUpdateItem(item.id, "rate", e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 text-sm text-left md:text-right rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all font-mono"
                      required
                    />
                  </div>

                  {/* Amount & Desktop Delete Actions */}
                  <div className="col-span-1 flex items-center justify-between md:justify-end gap-1.5 mt-2 md:mt-0" id={`field-amount-${item.id}`}>
                    <div className="text-right">
                      <label className="block md:hidden text-[10px] font-bold text-slate-400 uppercase mb-0.5">{t.amount}</label>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">
                        ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="hidden md:flex p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-lg cursor-pointer transition-all"
                        title="Delete Line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* "+" Add Line Trigger Button */}
            <button
              type="button"
              onClick={handleAddItem}
              className="mt-2 flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border border-amber-500/30 dark:border-amber-500/30 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-500 transition-all cursor-pointer shadow-sm active:scale-95"
              id="btn-add-line"
            >
              <Plus className="w-4 h-4" />
              <span>{t.add_line}</span>
            </button>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* ADJUSTMENTS & NOTES SECTION */}
          <div className="space-y-4" id="section-adjustments">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Adjustment &amp; Notes</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="grid-adjustments-inputs">
              {/* Additional Charges */}
              <div className="space-y-1.5" id="field-additional">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span className="font-bold text-slate-400 text-xs font-mono">₹</span>
                  <span>{t.additional_charges}</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={additionalCharges}
                  onChange={(e) => {
                    setAdditionalCharges(e.target.value);
                    setError(null);
                  }}
                  placeholder={t.additional_charges_hint}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>

              {/* Discount */}
              <div className="space-y-1.5" id="field-discount">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.discount}</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={discount}
                  onChange={(e) => {
                    setDiscount(e.target.value);
                    setError(null);
                  }}
                  placeholder={t.discount_hint}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>

              {/* Tax Rate Percentage */}
              <div className="space-y-1.5" id="field-tax-rate">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.tax_rate}</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => {
                    setTaxRate(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g. 18%"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5" id="field-notes">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.notes}</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.notes_hint}
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* CALCULATED SUMMARY PREVIEW (Positioned exactly at bottom of forms) */}
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900 rounded-xl p-5 space-y-2.5 mt-6" id="summary-preview-card">
            <div className="flex justify-between items-center text-sm" id="subtotal-row">
              <span className="text-slate-500 dark:text-slate-400">{t.subtotal}:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            {additional > 0 && (
              <div className="flex justify-between items-center text-sm" id="additional-row">
                <span className="text-slate-500 dark:text-slate-400">{t.additional_charges}:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-500">+ ₹{additional.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {disc > 0 && (
              <div className="flex justify-between items-center text-sm" id="discount-row">
                <span className="text-slate-500 dark:text-slate-400">{t.discount}:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-500">- ₹{disc.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {taxPct > 0 && (
              <div className="flex justify-between items-center text-sm" id="tax-row">
                <span className="text-slate-500 dark:text-slate-400">{t.tax_amount} ({taxPct}%):</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">+ ₹{taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="border-t border-slate-200 dark:border-slate-800 my-2 pt-2.5 flex justify-between items-center" id="grand-total-row">
              <span className="text-sm font-bold text-slate-800 dark:text-white">{t.grand_total}:</span>
              <span className="text-xl font-black text-slate-800 dark:text-white">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/15 cursor-pointer active:scale-[0.99] transition-all"
            id="btn-save-submit"
          >
            <Save className="w-5 h-5" />
            <span>{t.save_bill}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
