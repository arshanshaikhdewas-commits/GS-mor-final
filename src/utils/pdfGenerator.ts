import { jsPDF } from "jspdf";
import { Bill } from "../types";

export const generatePdf = (bill: Bill, save: boolean = true): string | jsPDF => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const margin = 35;
  const rightMargin = 595 - margin;
  let currentY = 50;

  // Colors
  const primaryColor = "#C49500"; // Elegant Industrial Gold
  const darkGray = "#1E2024";     // Charcoal Slate
  const lightGray = "#F5F5F5";
  const dividerColor = "#E0E0E0";
  const textMuted = "#70757A";

  // Helpers
  const drawLine = (y: number) => {
    doc.setDrawColor(224, 224, 224); // dividerColor
    doc.setLineWidth(1);
    doc.line(margin, y, rightMargin, y);
  };

  // 1. Draw Outer Border
  doc.setDrawColor(224, 224, 224);
  doc.setLineWidth(1);
  doc.rect(20, 20, 555, 802); // border around page

  // 2. Accent Band at Top
  doc.setFillColor(196, 149, 0); // primaryColor rgb
  doc.rect(20, 20, 555, 12, "F");

  // 3. HEADER SECTION
  currentY = 65;
  // Left: Company Brand
  doc.setTextColor(196, 149, 0); // primary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("GS EarthMovers", margin, currentY);

  currentY += 15;
  doc.setTextColor(95, 99, 104); // textMuted
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text("Heavy Machinery & Earthwork Contractor", margin, currentY);

  // Right: Invoice Headline
  doc.setTextColor(30, 32, 36); // darkGray
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("BILL / INVOICE", rightMargin - 10, 65, { align: "right" });

  // 4. METADATA SECTION
  currentY = 105;
  doc.setTextColor(30, 32, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Address: Dewas, Madhya Pradesh", rightMargin, currentY, { align: "right" });
  doc.text("Contact: +91 9827310012", rightMargin, currentY + 15, { align: "right" });

  // Divider Line
  currentY += 30;
  drawLine(currentY);

  // 5. CLIENT & INVOICE DETAILS
  currentY += 25;
  const detailsY = currentY;

  // Left Column: BILL TO
  doc.setTextColor(112, 117, 122);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("BILL TO:", margin, currentY);

  doc.setTextColor(30, 32, 36);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(bill.clientName, margin, currentY + 16);

  let clientOffset = currentY + 30;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  if (bill.clientAddress) {
    doc.text(bill.clientAddress, margin, clientOffset);
    clientOffset += 14;
  }
  if (bill.mobileNumber) {
    doc.text(`Mob: ${bill.mobileNumber}`, margin, clientOffset);
  }

  // Right Column: INVOICE META
  const detailsX = rightMargin - 160;
  doc.setTextColor(112, 117, 122);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("INVOICE NO:", detailsX, detailsY);

  doc.setTextColor(196, 149, 0); // primary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(bill.invoiceNumber, detailsX, detailsY + 16);

  doc.setTextColor(112, 117, 122);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DATE:", detailsX, detailsY + 38);

  doc.setTextColor(30, 32, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(bill.date, detailsX, detailsY + 54);

  // Divider Line before table
  currentY += 75;
  drawLine(currentY);

  // 6. WORK DETAILS TABLE
  currentY += 15;
  const tableY = currentY;

  // Draw Table Header Background (Gold)
  doc.setFillColor(196, 149, 0);
  doc.rect(margin, tableY, rightMargin - margin, 22, "F");

  // Draw Table Headers (White text)
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Work Description", margin + 8, tableY + 15);
  doc.text("Hours", rightMargin - 180, tableY + 15, { align: "right" });
  doc.text("Rate (Rs)", rightMargin - 90, tableY + 15, { align: "right" });
  doc.text("Total (Rs)", rightMargin - 8, tableY + 15, { align: "right" });

  // Row Details
  let rowY = tableY + 22 + 20;

  doc.setTextColor(30, 32, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Wrap Description Text
  const maxDescWidth = 260;
  const splitDesc = doc.splitTextToSize(bill.workDescription, maxDescWidth);
  doc.text(splitDesc, margin + 8, rowY);

  // Draw Numbers
  const hoursStr = bill.totalWorkingHours.toFixed(2);
  const rateStr = bill.ratePerHour.toFixed(2);
  const subtotalAmount = bill.totalWorkingHours * bill.ratePerHour;
  const subtotalStr = subtotalAmount.toFixed(2);

  doc.text(hoursStr, rightMargin - 180, rowY, { align: "right" });
  doc.text(`Rs ${rateStr}`, rightMargin - 90, rowY, { align: "right" });
  doc.text(`Rs ${subtotalStr}`, rightMargin - 8, rowY, { align: "right" });

  // Calculate bottom of wrapped row
  const rowHeight = Math.max(splitDesc.length * 12 + 10, 35);
  rowY += rowHeight;

  // Row Divider Line
  drawLine(rowY);

  // 7. CALCULATION SUMMARY
  let summaryY = rowY + 25;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Subtotal row
  doc.text("Subtotal:", rightMargin - 160, summaryY);
  doc.text(`Rs ${subtotalStr}`, rightMargin - 8, summaryY, { align: "right" });
  summaryY += 18;

  // Additional Charges row (if any)
  if (bill.additionalCharges > 0) {
    doc.text("Additional Charges:", rightMargin - 160, summaryY);
    doc.text(`Rs ${bill.additionalCharges.toFixed(2)}`, rightMargin - 8, summaryY, { align: "right" });
    summaryY += 18;
  }

  // Discount row (if any)
  if (bill.discount > 0) {
    doc.text("Discount:", rightMargin - 160, summaryY);
    doc.text(`- Rs ${bill.discount.toFixed(2)}`, rightMargin - 8, summaryY, { align: "right" });
    summaryY += 18;
  }

  // Final Total Box (Gold highlight)
  summaryY += 5;
  doc.setFillColor(196, 149, 0);
  doc.rect(rightMargin - 180, summaryY, 180, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL AMOUNT:", rightMargin - 172, summaryY + 20);
  doc.text(`Rs ${bill.totalAmount.toFixed(2)}`, rightMargin - 8, summaryY + 20, { align: "right" });

  // 8. NOTES SECTION (Left Aligned below rowY)
  if (bill.notes) {
    const notesY = rowY + 20;
    doc.setTextColor(112, 117, 122);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("NOTES:", margin + 8, notesY);

    doc.setTextColor(30, 32, 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const splitNotes = doc.splitTextToSize(bill.notes, 260);
    doc.text(splitNotes, margin + 8, notesY + 14);
  }

  // 9. FOOTER SECTION
  const footerY = 740;
  doc.setDrawColor(224, 224, 224);
  doc.setLineWidth(1);
  doc.line(margin, footerY, rightMargin, footerY);

  // Thank You
  doc.setTextColor(196, 149, 0); // primary
  doc.setFont("helvetica", "italic");
  doc.setFontSize(11);
  doc.text("Thank you for your business.", 595 / 2, footerY + 25, { align: "center" });

  // Contact
  doc.setTextColor(112, 117, 122);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Dewas, Madhya Pradesh | Contact: +91 9827310012", 595 / 2, footerY + 42, { align: "center" });

  // Signature Area
  doc.setDrawColor(224, 224, 224);
  doc.line(rightMargin - 130, footerY + 60, rightMargin - 10, footerY + 60);

  doc.setTextColor(30, 32, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Authorized Signatory", rightMargin - 70, footerY + 72, { align: "center" });

  if (save) {
    doc.save(`GS_Bill_${bill.invoiceNumber}.pdf`);
    return `GS_Bill_${bill.invoiceNumber}.pdf`;
  }

  return doc;
};
