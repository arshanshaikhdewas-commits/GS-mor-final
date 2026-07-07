import React, { useState } from "react";
import { ArrowLeft, Eye, Download, Printer, Trash2, Calendar, User, MapPin, Phone, FileText, Clock, Percent } from "lucide-react";
import { Bill, Language } from "../types";
import { translations } from "../translations";
import { generatePdf } from "../utils/pdfGenerator";

interface ViewBillScreenProps {
  bill: Bill;
  language: Language;
  onBack: () => void;
  onDelete: (bill: Bill) => void;
}

export const ViewBillScreen: React.FC<ViewBillScreenProps> = ({
  bill,
  language,
  onBack,
  onDelete,
}) => {
  const t = translations[language];
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // Computations
  const subtotal = bill.totalWorkingHours * bill.ratePerHour;

  const handleDownloadPdf = () => {
    generatePdf(bill, true);
  };

  const handlePreviewPdf = () => {
    // Generate PDF as blob URL and set it to preview state or open in new tab
    const doc = generatePdf(bill, false);
    if (typeof doc !== "string" && "output" in doc) {
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
    }
  };

  const handlePrintPdf = () => {
    const doc = generatePdf(bill, false);
    if (typeof doc !== "string" && "output" in doc) {
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.addEventListener("load", () => {
          printWindow.print();
        });
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6" id="view-bill-root">
      {/* Navigation and Actions Row */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6" id="view-bill-nav">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 p-2 text-sm font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          id="btn-back-from-view"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.nav_home}</span>
        </button>

        <div className="flex items-center gap-2" id="view-bill-actions">
          {/* Download Button */}
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/10 transition-colors cursor-pointer"
            id="btn-download-pdf"
            title={t.save_pdf_to_downloads}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.save_pdf_to_downloads}</span>
          </button>

          {/* Preview Button */}
          <button
            onClick={handlePreviewPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            id="btn-preview-pdf"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t.preview_pdf}</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            id="btn-print-pdf"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.print_pdf}</span>
          </button>

          {/* Delete Button */}
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
            id="btn-delete-view"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.delete}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in" id="confirm-delete-modal">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2" id="delete-modal-title">
              {t.delete_title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6" id="delete-modal-desc">
              {t.delete_confirm}
            </p>
            <div className="flex gap-3 justify-end" id="delete-modal-actions">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  onDelete(bill);
                  onBack();
                }}
                className="px-4 py-2 text-sm font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/15 cursor-pointer"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid Layout: Invoice View vs PDF Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="view-bill-content-grid">
        {/* Left: High-Fidelity Interactive HTML Invoice Representation */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-md p-8 relative flex flex-col min-h-[680px]" id="invoice-sheet">
          {/* Header Accent Strip */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-amber-500 rounded-t-2xl" id="sheet-accent-bar" />

          {/* Company Details */}
          <div className="flex justify-between items-start mt-2 mb-6" id="sheet-header">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-amber-500 font-sans" id="sheet-app-name">
                GS EarthMovers
              </h2>
              <p className="text-[10px] text-slate-500 font-serif italic" id="sheet-tagline">
                Heavy Machinery &amp; Earthwork Contractor
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-500" id="sheet-company-meta">
              <p className="font-semibold text-slate-700 dark:text-slate-300">{t.company_address}</p>
              <p>{t.company_contact}</p>
            </div>
          </div>

          <hr className="border-slate-200/60 dark:border-slate-800/80 mb-6" />

          {/* Client Details and Invoice Meta */}
          <div className="grid grid-cols-2 gap-4 mb-8 text-xs" id="sheet-meta-split">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 tracking-wider mb-1.5 uppercase">
                BILL TO:
              </p>
              <p className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{bill.clientName}</p>
              {bill.clientAddress && (
                <p className="text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span>{bill.clientAddress}</span>
                </p>
              )}
              {bill.mobileNumber && (
                <p className="text-slate-500 mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span>Mob: {bill.mobileNumber}</span>
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="text-[10px] font-extrabold text-slate-400 tracking-wider mb-1.5 uppercase">
                INVOICE DETAILS:
              </p>
              <p className="text-amber-500 font-mono font-bold text-sm">
                #{bill.invoiceNumber}
              </p>
              <p className="text-slate-500 mt-1 flex items-center gap-1 justify-end">
                <Calendar className="w-3 h-3" />
                <span>{bill.date}</span>
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1" id="sheet-table-area">
            <table className="w-full text-xs text-left" id="invoice-items-table">
              <thead>
                <tr className="bg-amber-500 text-white uppercase text-[10px] tracking-wider font-extrabold">
                  <th className="p-2.5 rounded-l-lg">{t.work_description}</th>
                  <th className="p-2.5 text-right">{t.working_hours}</th>
                  <th className="p-2.5 text-right">{t.rate_per_hour}</th>
                  <th className="p-2.5 text-right rounded-r-lg">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr className="text-slate-700 dark:text-slate-300">
                  <td className="p-3 font-medium whitespace-pre-wrap max-w-[200px]" id="item-desc">
                    {bill.workDescription}
                  </td>
                  <td className="p-3 text-right font-mono" id="item-hours">
                    {bill.totalWorkingHours.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-mono" id="item-rate">
                    ₹{bill.ratePerHour.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white" id="item-total">
                    ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes and Calculation Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs" id="sheet-summary-section">
            {/* Notes */}
            <div id="sheet-notes-box">
              {bill.notes && (
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 tracking-wider mb-1 uppercase">
                    {t.notes}:
                  </p>
                  <p className="text-slate-500 italic bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
                    {bill.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-1.5 text-right" id="sheet-calcs">
              <div className="flex justify-between text-slate-500" id="sheet-subtotal">
                <span>Subtotal:</span>
                <span className="font-mono">₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>

              {bill.additionalCharges > 0 && (
                <div className="flex justify-between text-slate-500" id="sheet-additional">
                  <span>{t.additional_charges}:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-500">+ ₹{bill.additionalCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {bill.discount > 0 && (
                <div className="flex justify-between text-slate-500" id="sheet-discount">
                  <span>{t.discount}:</span>
                  <span className="font-mono text-rose-600 dark:text-rose-500">- ₹{bill.discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="flex justify-between items-center p-2.5 bg-amber-500 rounded-lg text-white font-extrabold text-sm" id="sheet-grand-total">
                <span>{t.total_amount}:</span>
                <span className="font-mono">₹{bill.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="mt-8 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 text-center" id="sheet-footer">
            <p className="text-[10px] font-semibold text-amber-500 italic" id="sheet-thank-you">
              {t.thank_you}
            </p>
            <p className="text-[9px] text-slate-400 mt-0.5">
              Dewas, Madhya Pradesh | Contact: +91 9827310012
            </p>

            <div className="flex justify-end mt-4" id="sheet-signature-box">
              <div className="text-center w-36">
                <div className="border-b border-slate-300 dark:border-slate-700 h-6 mb-1" />
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                  Authorized Signatory
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: PDF Live Preview Frame */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 overflow-hidden min-h-[680px] flex flex-col" id="preview-sheet">
          <div className="bg-slate-200 dark:bg-slate-850 px-4 py-3 flex items-center justify-between border-b border-slate-300 dark:border-slate-800" id="preview-header">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>{t.preview_pdf}</span>
            </span>
            {pdfPreviewUrl && (
              <button
                onClick={() => setPdfPreviewUrl(null)}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                {t.cancel}
              </button>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center p-4 relative" id="preview-frame-container">
            {pdfPreviewUrl ? (
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full rounded-lg border border-slate-300/50 bg-white"
                title="Invoice PDF Preview"
                id="pdf-preview-iframe"
              />
            ) : (
              <div className="text-center p-6 space-y-3" id="preview-placeholder">
                <Printer className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs font-medium">
                  Click <strong className="text-amber-500">{t.preview_pdf}</strong> at the top to generate a live, pixel-perfect PDF document preview.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
