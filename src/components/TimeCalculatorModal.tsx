import React, { useState } from "react";
import { X, Clock, Calculator, Check, Info } from "lucide-react";
import { Language, InvoiceItem } from "../types";
import { translations } from "../translations";
import { timeToDecimalHours, decimalHoursToTime, calculateDurationFromTimes } from "../utils/timeUtils";

interface TimeCalculatorModalProps {
  language: Language;
  items: InvoiceItem[];
  isOpen: boolean;
  onClose: () => void;
  onApplyHours: (itemId: string, calculatedHours: number) => void;
}

export const TimeCalculatorModal: React.FC<TimeCalculatorModalProps> = ({
  language,
  items,
  isOpen,
  onClose,
  onApplyHours,
}) => {
  const t = translations[language];

  // Active Tab: 'duration' or 'shift'
  const [tab, setTab] = useState<"duration" | "shift">("duration");

  // Duration State
  const [hoursInput, setHoursInput] = useState<string>("8");
  const [minsInput, setMinsInput] = useState<string>("30");
  const [secsInput, setSecsInput] = useState<string>("0");

  // Shift State
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("17:30");
  const [breakMins, setBreakMins] = useState<string>("30");

  // Target Item Selection
  const [targetItemId, setTargetItemId] = useState<string>(items[0]?.id || "");

  if (!isOpen) return null;

  // Computations
  const h = parseFloat(hoursInput) || 0;
  const m = parseFloat(minsInput) || 0;
  const s = parseFloat(secsInput) || 0;

  let calculatedDecimal = 0;
  if (tab === "duration") {
    calculatedDecimal = timeToDecimalHours(h, m, s);
  } else {
    const shiftRes = calculateDurationFromTimes(startTime, endTime, parseFloat(breakMins) || 0);
    calculatedDecimal = shiftRes.totalDecimalHours;
  }

  // Exact rounded decimal display (3 decimal places max if needed)
  const roundedDecimal = Math.round(calculatedDecimal * 1000) / 1000;
  const breakdown = decimalHoursToTime(roundedDecimal);

  const handleApply = () => {
    const selectedId = targetItemId || items[0]?.id;
    if (selectedId) {
      onApplyHours(selectedId, roundedDecimal);
      onClose();
    }
  };

  const addQuickMins = (amount: number) => {
    const currentMins = parseFloat(minsInput) || 0;
    const newMins = currentMins + amount;
    if (newMins >= 60) {
      const extraHrs = Math.floor(newMins / 60);
      const remMins = newMins % 60;
      setHoursInput(String((parseFloat(hoursInput) || 0) + extraHrs));
      setMinsInput(String(remMins));
    } else {
      setMinsInput(String(newMins));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      id="time-calculator-backdrop"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        id="time-calculator-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.time_calculator}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                1 Hour = 60 Mins | 1 Min = 60 Secs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1" id="time-calculator-body">
          {/* Tab Selector */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setTab("duration")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === "duration"
                  ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-500 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              {t.time_mode_duration}
            </button>
            <button
              type="button"
              onClick={() => setTab("shift")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === "shift"
                  ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-500 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              {t.time_mode_shift}
            </button>
          </div>

          {/* TAB 1: Hours + Minutes + Seconds */}
          {tab === "duration" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {/* Hours */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.hours_label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={hoursInput}
                    onChange={(e) => setHoursInput(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm text-center font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                {/* Minutes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.minutes_label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minsInput}
                    onChange={(e) => setMinsInput(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm text-center font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                {/* Seconds */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.seconds_label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={secsInput}
                    onChange={(e) => setSecsInput(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm text-center font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Quick Minutes Add Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-400">Quick add:</span>
                <button
                  type="button"
                  onClick={() => addQuickMins(15)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                >
                  +15m (+0.25h)
                </button>
                <button
                  type="button"
                  onClick={() => addQuickMins(30)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                >
                  +30m (+0.50h)
                </button>
                <button
                  type="button"
                  onClick={() => addQuickMins(45)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                >
                  +45m (+0.75h)
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Shift Start & End Time */}
          {tab === "shift" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.start_time_label}
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-center font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.end_time_label}
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-center font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.break_time_label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={breakMins}
                    onChange={(e) => setBreakMins(e.target.value)}
                    placeholder="30"
                    className="w-full px-3 py-2 text-sm text-center font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CALCULATED RESULT DISPLAY BOX */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 text-center" id="calculated-result-box">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              {t.calculated_hours}
            </p>
            <div className="text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
              {roundedDecimal} <span className="text-lg font-bold">hrs</span>
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{breakdown.formattedTimeStr}</span>
            </p>

            {/* Step-by-Step Formula Breakdown */}
            <div className="pt-2 border-t border-amber-500/20 text-[11px] font-mono text-slate-600 dark:text-slate-400">
              {tab === "duration" ? (
                <>
                  {h} hrs + ({m} mins ÷ 60 = {(m / 60).toFixed(2)}) + ({s} secs ÷ 3600 = {(s / 3600).toFixed(3)}) ={" "}
                  <strong>{roundedDecimal} hrs</strong>
                </>
              ) : (
                <>
                  Duration from {startTime} to {endTime} minus {breakMins || 0}m break ={" "}
                  <strong>{roundedDecimal} hrs</strong>
                </>
              )}
            </div>
          </div>

          {/* EQUATION & CONVERSION EDUCATION BOX */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <Info className="w-4 h-4 text-amber-500" />
              <span>{t.equation_formula}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              {t.equation_notice}
            </p>
            <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
              <span className="bg-white dark:bg-slate-900 p-1 rounded text-center">15 mins = 0.25h</span>
              <span className="bg-white dark:bg-slate-900 p-1 rounded text-center">30 mins = 0.50h</span>
              <span className="bg-white dark:bg-slate-900 p-1 rounded text-center">45 mins = 0.75h</span>
            </div>
          </div>

          {/* TARGET LINE ITEM SELECTOR */}
          {items && items.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {t.select_target_item}:
              </label>
              <select
                value={targetItemId}
                onChange={(e) => setTargetItemId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
              >
                {items.map((item, idx) => (
                  <option key={item.id} value={item.id}>
                    Item #{idx + 1}: {item.name || "Unnamed Item"} (Current Qty: {item.quantity})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/15 cursor-pointer active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>{t.apply_hours_to_item} ({roundedDecimal} hrs)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
