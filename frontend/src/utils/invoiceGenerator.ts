import { jsPDF } from "jspdf";
import type { SubscriptionPaymentRecord } from "../services/payment.service";
import type { User } from "../types/auth";

const numberToWords = (num: number): string => {
  const rounded = Math.round(num);
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if (rounded === 0) return "Zero Rupees Only";

  const numStr = rounded.toString();
  if (numStr.length > 9) return `${rounded} Rupees Only`;

  const n = ("000000000" + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return `${rounded} Rupees Only`;

  let str = "";
  str += Number(n[1]) !== 0 ? (a[Number(n[1])] || b[Number(n[1][0])] + " " + a[Number(n[1][1])]) + "Crore " : "";
  str += Number(n[2]) !== 0 ? (a[Number(n[2])] || b[Number(n[2][0])] + " " + a[Number(n[2][1])]) + "Lakh " : "";
  str += Number(n[3]) !== 0 ? (a[Number(n[3])] || b[Number(n[3][0])] + " " + a[Number(n[3][1])]) + "Thousand " : "";
  str += Number(n[4]) !== 0 ? (a[Number(n[4])] || b[Number(n[4][0])] + " " + a[Number(n[4][1])]) + "Hundred " : "";
  str +=
    Number(n[5]) !== 0
      ? (str !== "" ? "and " : "") +
        (a[Number(n[5])] || b[Number(n[5][0])] + " " + a[Number(n[5][1])]) +
        "Rupees Only"
      : "Rupees Only";

  return str.trim();
};

export const generateTaxInvoicePDF = (
  payment: SubscriptionPaymentRecord,
  user: User | null
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const darkNavy = [15, 23, 42]; // #0F172A
  const slate600 = [100, 116, 139]; // #64748B
  const slate200 = [226, 232, 240]; // #E2E8F0
  const orange = [234, 88, 12]; // #EA580C
  const emerald = [22, 163, 74]; // #16A34A
  const lightBg = [248, 250, 252]; // #F8FAFC

  let y = margin;

  // 1. HEADER SECTION (Brand & Title)
  // Orange Brand Badge
  doc.setFillColor(orange[0], orange[1], orange[2]);
  doc.roundedRect(margin, y, 10, 10, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("C", margin + 3, y + 7);

  // Brand Name
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CashFlow AI", margin + 13, y + 6);

  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Financial Intelligence & Autonomous Ingestion Platform", margin + 13, y + 10);

  // Right Header: TAX INVOICE
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("TAX INVOICE", pageWidth - margin, y + 6, { align: "right" });

  // Paid Stamp / Badge
  doc.setFillColor(240, 253, 244); // light emerald
  doc.setDrawColor(emerald[0], emerald[1], emerald[2]);
  doc.roundedRect(pageWidth - margin - 32, y + 8, 32, 6, 1.5, 1.5, "FD");

  doc.setTextColor(emerald[0], emerald[1], emerald[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("PAID & SETTLED", pageWidth - margin - 16, y + 12.2, { align: "center" });

  y += 18;

  // Thin separator
  doc.setDrawColor(slate200[0], slate200[1], slate200[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 6;

  // 2. COMPANY DETAILS & CUSTOMER DETAILS
  const colWidth = contentWidth / 2;

  // Left Column: Supplier / Issuer
  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("ISSUED BY:", margin, y);

  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("CashFlow AI Technologies Pvt. Ltd.", margin, y + 4.5);

  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("DLF Cyber City, Tower B, Phase III", margin, y + 9);
  doc.text("Gurugram, Haryana - 122002, India", margin, y + 13);
  doc.text("GSTIN: 07AABCC8921M1Z4  |  PAN: AABCC8921M", margin, y + 17);
  doc.text("SAC Code: 998313 (Software & Cloud Services)", margin, y + 21);
  doc.text("Support: billing@cashflow.ai  |  www.cashflow-ai.com", margin, y + 25);

  // Right Column: Customer / Billed To
  const rightColX = margin + colWidth + 5;
  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("BILLED TO:", rightColX, y);

  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(user?.name || "CashFlow AI Subscriber", rightColX, y + 4.5);

  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Email: ${user?.email || payment.userId}`, rightColX, y + 9);
  doc.text(`Account ID: USR-${payment.userId.slice(-8).toUpperCase()}`, rightColX, y + 13);
  doc.text("Place of Supply: India", rightColX, y + 17);
  doc.text("Currency: Indian Rupee (INR - ₹)", rightColX, y + 21);

  y += 32;

  // 3. INVOICE META BAR (4 Columns)
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(slate200[0], slate200[1], slate200[2]);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "FD");

  const metaCol = contentWidth / 4;
  const invoiceNum = `INV-${payment.id.slice(-6).toUpperCase()}`;
  const invoiceDate = new Date(payment.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Meta 1: Invoice No
  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("INVOICE NUMBER", margin + 4, y + 4.5);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(invoiceNum, margin + 4, y + 10);

  // Meta 2: Invoice Date
  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("INVOICE DATE", margin + metaCol + 4, y + 4.5);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(invoiceDate, margin + metaCol + 4, y + 10);

  // Meta 3: Gateway Order ID
  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("RAZORPAY ORDER ID", margin + metaCol * 2 + 4, y + 4.5);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(payment.razorpayOrderId.slice(0, 18), margin + metaCol * 2 + 4, y + 10);

  // Meta 4: Payment Ref
  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("PAYMENT REFERENCE", margin + metaCol * 3 + 4, y + 4.5);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(payment.razorpayPaymentId ? payment.razorpayPaymentId.slice(0, 18) : "Verified Gateway", margin + metaCol * 3 + 4, y + 10);

  y += 20;

  // 4. LINE ITEMS TABLE
  // Table Header
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.roundedRect(margin, y, contentWidth, 8, 1, 1, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("ITEM DESCRIPTION", margin + 4, y + 5.5);
  doc.text("SAC", margin + 95, y + 5.5);
  doc.text("CYCLE", margin + 115, y + 5.5);
  doc.text("QTY", margin + 140, y + 5.5);
  doc.text("TOTAL (INR)", pageWidth - margin - 4, y + 5.5, { align: "right" });

  y += 10;

  // Table Row
  const isAnnual = payment.billingCycle.toLowerCase() === "annual";
  const planLabel = payment.plan === "PRO" ? "CashFlow Pro Copilot" : "CashFlow Wealth & Family";
  const cycleLabel = isAnnual ? "Annual (365 Days)" : "Monthly (30 Days)";

  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(planLabel, margin + 4, y + 4);

  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    "Full access: Unlimited Bank Statement Ingestion, AI Copilot & Zero Duplicate Shield",
    margin + 4,
    y + 8.5
  );

  doc.text("998313", margin + 95, y + 4);
  doc.text(payment.billingCycle.toUpperCase(), margin + 115, y + 4);
  doc.text("1", margin + 142, y + 4);

  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(`INR ${payment.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, y + 4, { align: "right" });

  y += 14;

  doc.setDrawColor(slate200[0], slate200[1], slate200[2]);
  doc.line(margin, y, pageWidth - margin, y);

  y += 6;

  // 5. TAX BREAKDOWN & TOTAL CALCULATION (GST 18% Inclusive)
  const totalAmount = payment.amount;
  const baseAmount = Number((totalAmount / 1.18).toFixed(2));
  const totalGst = Number((totalAmount - baseAmount).toFixed(2));
  const cgst = Number((totalGst / 2).toFixed(2));
  const sgst = Number((totalGst / 2).toFixed(2));

  const summaryWidth = 75;
  const summaryX = pageWidth - margin - summaryWidth;

  // Calculation Rows
  const addSummaryRow = (label: string, value: string, isBold = false) => {
    doc.setTextColor(slate600[0], slate600[1], slate600[2]);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(8.5);
    doc.text(label, summaryX, y);

    doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(isBold ? 10 : 8.5);
    doc.text(value, pageWidth - margin - 4, y, { align: "right" });
    y += 5;
  };

  addSummaryRow("Taxable Base Value:", `INR ${baseAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
  addSummaryRow("CGST (9.0%):", `INR ${cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
  addSummaryRow("SGST (9.0%):", `INR ${sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);

  y += 1;
  doc.setDrawColor(slate200[0], slate200[1], slate200[2]);
  doc.line(summaryX, y, pageWidth - margin, y);
  y += 4;

  // Total Row Box
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(summaryX - 3, y - 3, summaryWidth + 3, 9, 1.5, 1.5, "F");

  doc.setTextColor(orange[0], orange[1], orange[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TOTAL AMOUNT PAID:", summaryX, y + 3);
  doc.text(`₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, y + 3, { align: "right" });

  y += 14;

  // Amount in Words
  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Amount in Words:", margin, y);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.setFont("helvetica", "bold");
  doc.text(numberToWords(totalAmount), margin + 25, y);

  y += 10;

  // 6. SUBSCRIPTION ACCESS DETAILS CARD
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(orange[0], orange[1], orange[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "FD");

  doc.setTextColor(orange[0], orange[1], orange[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("ACTIVE SUBSCRIPTION COVERAGE", margin + 4, y + 5.5);

  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const startStr = new Date(payment.startedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const endStr = new Date(payment.expiresAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  doc.text(`License Validity Period: ${startStr} to ${endStr} (${cycleLabel})`, margin + 4, y + 10.5);
  doc.text("Entitlements: 24/7 AI Financial Advisor, Unlimited Bank OCR Ingestion, Anomaly Monitor, Continuous Updates", margin + 4, y + 15);
  doc.text("Cancellation Policy: You may cancel your subscription at any time from your account settings.", margin + 4, y + 19.5);

  y += 30;

  // 7. FOOTER & DIGITAL STAMP
  doc.setDrawColor(slate200[0], slate200[1], slate200[2]);
  doc.line(margin, y, pageWidth - margin, y);

  y += 5;
  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.text(
    "This is an electronically generated Tax Invoice & Payment Receipt. No physical signature is required under IT Act 2000.",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  y += 4;
  doc.setFont("helvetica", "normal");
  doc.text(
    "CashFlow AI Technologies Pvt. Ltd. | CIN: U72900HR2026PTC099881 | support@cashflow.ai | Thank you for your business!",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  // Trigger browser download
  const filename = `CashFlow_Invoice_${invoiceNum}.pdf`;
  doc.save(filename);
};
