import { jsPDF, GState } from "jspdf";
import { Bill, InvoiceItem } from "../types";
import { watermarkImage } from "./watermarkImage";

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

  // Draw Circular Background Watermark with 30% Opacity (0.3)
  const drawWatermark = () => {
    // Read dynamic watermark from localStorage
    const savedWatermark = typeof window !== "undefined" ? localStorage.getItem("gs_watermark") : null;
    
    // If watermark has been removed, don't render any watermark on the PDF
    if (savedWatermark === "none") {
      return;
    }

    const watermarkSource = savedWatermark || watermarkImage;
    const isCustom = !!savedWatermark;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Default watermark aspect ratio is 1200 / 896, custom uploaded/cropped is a perfect 1:1 square
    const imgRatio = isCustom ? 1.0 : (1200 / 896);

    // Limit the watermark size to a maximum of 25-30% of the page width (we choose 28%)
    const maxPercentWidth = 0.28;
    let drawWidth = pageWidth * maxPercentWidth;
    let drawHeight = drawWidth / imgRatio;

    // --- DRY RUN LAYOUT CALCULATION TO FIND BACKGROUND SPACE ---
    const calculateUpperContentBottomY = (): number => {
      let tempCurrentY = 135; // Divider after metadata is at 135
      tempCurrentY += 25;     // Client details start at 160
      const tempDetailsY = tempCurrentY;
      tempCurrentY += 75;     // Divider before table is at 235
      tempCurrentY += 15;     // Table start is at 250
      const tempTableY = tempCurrentY;

      const tempItems: InvoiceItem[] = bill.items && bill.items.length > 0 ? bill.items : [
        {
          id: "old-fallback",
          name: bill.workDescription || "Earthwork Contracting Services",
          description: "",
          quantity: bill.totalWorkingHours || 0,
          rate: bill.ratePerHour || 0,
          amount: (bill.totalWorkingHours || 0) * (bill.ratePerHour || 0)
        }
      ];

      let tempRowY = tempTableY + 22 + 18;
      tempItems.forEach((item) => {
        let textHeight = 12;
        if (item.description) {
          const splitDesc = doc.splitTextToSize(item.description, 260);
          textHeight += splitDesc.length * 10 + 4;
        }
        tempRowY += Math.max(20, textHeight + 8);
      });

      const calculatedRowY = tempRowY;

      // Calculation summary Y
      let tempSummaryY = calculatedRowY + 20;
      const computedSubtotal = bill.subtotal || tempItems.reduce((sum, item) => sum + item.amount, 0);
      tempSummaryY += 18; // Subtotal row
      if (bill.additionalCharges > 0) tempSummaryY += 18;
      if (bill.discount > 0) tempSummaryY += 18;
      if (bill.taxRate > 0) tempSummaryY += 18;
      tempSummaryY += 5; // Total Box highlight

      const totalBoxBottomY = tempSummaryY + 32;

      // Notes bottom
      let notesBottomY = calculatedRowY;
      if (bill.notes) {
        const notesY = calculatedRowY + 16;
        const splitNotes = doc.splitTextToSize(bill.notes, 260);
        notesBottomY = notesY + 14 + (splitNotes.length * 12);
      }

      return Math.max(totalBoxBottomY, notesBottomY);
    };

    const upperContentBottomY = calculateUpperContentBottomY();
    const footerTopY = 740;

    // Add safe margins of at least 25px from any text or table
    const safeMargin = 25;
    const maxAllowedHeight = (footerTopY - safeMargin) - (upperContentBottomY + safeMargin);

    // If there isn't enough free space for the watermark, automatically shrink it further instead of letting it overlap
    if (drawHeight > maxAllowedHeight) {
      drawHeight = Math.max(0, maxAllowedHeight);
      drawWidth = drawHeight * imgRatio;
    }

    // Ensure width also does not exceed 28% of page width
    if (drawWidth > pageWidth * maxPercentWidth) {
      drawWidth = pageWidth * maxPercentWidth;
      drawHeight = drawWidth / imgRatio;
    }

    // If too small (e.g. no layout space), do not render at all
    if (drawWidth < 10 || drawHeight < 10) {
      return;
    }

    // Centered horizontally
    const drawX = (pageWidth - drawWidth) / 2;

    // Centered vertically inside the empty background area
    const centerYOfArea = (upperContentBottomY + footerTopY) / 2;
    const drawY = centerYOfArea - (drawHeight / 2);

    // Define clipping bounds centered in the area
    const centerX = pageWidth / 2;
    const centerY = centerYOfArea;
    const radius = Math.min(drawWidth, drawHeight) / 2;

    try {
      doc.saveGraphicsState();

      // Set watermark opacity to 70% transparent (30% visible)
      const gStateTransparent = new GState({ opacity: 0.30 });
      doc.setGState(gStateTransparent);

      // Create perfect circular clipping path centered on page background
      doc.circle(centerX, centerY, radius, null);
      doc.clip();

      // Detect format
      const isPng = watermarkSource.startsWith("data:image/png");
      const isWebp = watermarkSource.startsWith("data:image/webp");
      const format = isPng ? "PNG" : (isWebp ? "WEBP" : "JPEG");

      // Draw the image inside the clipped circle
      doc.addImage(watermarkSource, format, drawX, drawY, drawWidth, drawHeight);

      doc.restoreGraphicsState();
    } catch (err) {
      console.error("Error rendering circular watermark:", err);
    }
  };

  // Render watermark behind all other invoice content
  drawWatermark();

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
    clientOffset += 14;
  }
  if (bill.clientGstin) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(196, 149, 0); // primary
    doc.text(`GSTIN: ${bill.clientGstin}`, margin, clientOffset);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 32, 36);
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
  doc.text("Item / Work Description", margin + 8, tableY + 15);
  doc.text("Qty / Hours", rightMargin - 180, tableY + 15, { align: "right" });
  doc.text("Rate (Rs)", rightMargin - 90, tableY + 15, { align: "right" });
  doc.text("Total (Rs)", rightMargin - 8, tableY + 15, { align: "right" });

  // Get items (backward compatible fallback to single old fields)
  const items: InvoiceItem[] = bill.items && bill.items.length > 0 ? bill.items : [
    {
      id: "old-fallback",
      name: bill.workDescription || "Earthwork Contracting Services",
      description: "",
      quantity: bill.totalWorkingHours || 0,
      rate: bill.ratePerHour || 0,
      amount: (bill.totalWorkingHours || 0) * (bill.ratePerHour || 0)
    }
  ];

  // Row Details
  let rowY = tableY + 22 + 18;

  doc.setTextColor(30, 32, 36);

  items.forEach((item, index) => {
    // Write Item Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(item.name, margin + 8, rowY);

    let textHeight = 12;
    // Write Description below Name if present
    if (item.description) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(112, 117, 122);
      const splitDesc = doc.splitTextToSize(item.description, 260);
      doc.text(splitDesc, margin + 8, rowY + 12);
      textHeight += splitDesc.length * 10 + 4;
    }

    // Write Numbers on the same initial row level
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 32, 36);
    doc.text(item.quantity.toFixed(2), rightMargin - 180, rowY, { align: "right" });
    doc.text(`Rs ${item.rate.toFixed(2)}`, rightMargin - 90, rowY, { align: "right" });
    doc.text(`Rs ${item.amount.toFixed(2)}`, rightMargin - 8, rowY, { align: "right" });

    // Move Y forward
    rowY += Math.max(20, textHeight + 8);

    // Draw thin line between items
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, rowY - 4, rightMargin, rowY - 4);
  });

  // Bottom Divider Line
  drawLine(rowY);

  // 7. CALCULATION SUMMARY
  let summaryY = rowY + 20;

  // Compute Subtotal if missing (fallback)
  const computedSubtotal = bill.subtotal || items.reduce((sum, item) => sum + item.amount, 0);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 32, 36);

  // Subtotal row
  doc.text("Subtotal:", rightMargin - 160, summaryY);
  doc.text(`Rs ${computedSubtotal.toFixed(2)}`, rightMargin - 8, summaryY, { align: "right" });
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

  // Tax row (if any)
  if (bill.taxRate > 0) {
    const taxAmt = bill.taxAmount || (computedSubtotal * (bill.taxRate / 100));
    doc.text(`Tax (${bill.taxRate}%):`, rightMargin - 160, summaryY);
    doc.text(`Rs ${taxAmt.toFixed(2)}`, rightMargin - 8, summaryY, { align: "right" });
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
    const notesY = rowY + 16;
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
