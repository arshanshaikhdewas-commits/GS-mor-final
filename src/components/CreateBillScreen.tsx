import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Calendar, User, MapPin, Phone, FileText, Clock, Percent } from "lucide-react";
import { Bill, Language } from "../types";
import { translations } from "../translations";

interface CreateBillScreenProps {
  language: Language;
  nextInvoiceNumber: string;
  onBack: () => void;
  onSave: (billData: Omit<Bill, "id">) => void;
}

export const CreateBillScreen: React.FC<CreateBillScreenProps> = ({
  language,
  nextInvoiceNumber,
  onBack,
  onSave,
}) => {
  const t = translations[language];

  // Form Fields State
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  
  // Format current date as dd-mm-yyyy for pre-fill
  const getTodayDateString = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const [date, setDate] = useState(getTodayDateString());
  const [workDescription, setWorkDescription] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [ratePerHour, setRatePerHour] = useState("");
  const [additionalCharges, setAdditionalCharges] = useState("");
  const [discount, setDiscount] = useState("");
  const [notes, setNotes] = useState("");
  
  // Validation / Error state
  const [error, setError] = useState<string | null>(null);

  // Computations
  const hours = parseFloat(workingHours) || 0;
  const rate = parseFloat(ratePerHour) || 0;
  const subtotal = hours * rate;
  const additional = parseFloat(additionalCharges) || 0;
  const disc = parseFloat(discount) || 0;
  const totalAmount = Math.max(0, subtotal + additional - disc);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim() || !workDescription.trim() || !workingHours.trim() || !ratePerHour.trim()) {
      setError(t.error_fill_required);
      return;
    }

    if (isNaN(hours) || isNaN(rate) || isNaN(additional) || isNaN(disc)) {
      setError(t.error_invalid_numbers);
      return;
    }

    onSave({
      invoiceNumber: nextInvoiceNumber,
      clientName,
      clientAddress,
      mobileNumber,
      date,
      workDescription,
      totalWorkingHours: hours,
      ratePerHour: rate,
      additionalCharges: additional,
      discount: disc,
      notes,
      totalAmount,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6" id="create-bill-root">
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
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-semibold" id="form-error-banner">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" id="billing-form">
          {/* CLIENT DETAILS */}
          <div className="space-y-4" id="section-client-details">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.client_name} &amp; Info</h3>
            
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
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* WORK DETAILS */}
          <div className="space-y-4" id="section-work-details">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.work_description}</h3>

            <div className="space-y-1.5" id="field-work-desc">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.work_description} *</span>
              </label>
              <textarea
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                placeholder={t.work_description_hint}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="grid-work-numeric-inputs">
              {/* Working Hours */}
              <div className="space-y-1.5" id="field-hours">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.working_hours} *</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={workingHours}
                  onChange={(e) => {
                    setWorkingHours(e.target.value);
                    setError(null);
                  }}
                  placeholder={t.working_hours_hint}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Rate Per Hour */}
              <div className="space-y-1.5" id="field-rate">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span className="font-bold text-slate-400 text-xs font-mono">₹</span>
                  <span>{t.rate_per_hour} *</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={ratePerHour}
                  onChange={(e) => {
                    setRatePerHour(e.target.value);
                    setError(null);
                  }}
                  placeholder={t.rate_per_hour_hint}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* ADDITIONAL CHARGES & DISCOUNT */}
          <div className="space-y-4" id="section-adjustments">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Adjustment &amp; Notes</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="grid-adjustments-inputs">
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

          {/* CALCULATED SUMMARY PREVIEW */}
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900 rounded-xl p-4 space-y-2.5 mt-6" id="summary-preview-card">
            <div className="flex justify-between items-center text-sm" id="subtotal-row">
              <span className="text-slate-500 dark:text-slate-400">Subtotal ({workingHours || "0"} hrs &times; ₹{ratePerHour || "0"}/hr):</span>
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

            <div className="border-t border-slate-200 dark:border-slate-800 my-2 pt-2 flex justify-between items-center" id="grand-total-row">
              <span className="text-sm font-bold text-slate-800 dark:text-white">{t.total_amount}:</span>
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
