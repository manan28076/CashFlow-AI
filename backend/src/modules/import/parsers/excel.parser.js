const xlsx = require("xlsx");
const AppError = require("../../../errors/AppError");
const { askGeminiStructured } = require("../../ai/services/gemini.service");
const { safeParseJSON } = require("../../ai/utils/jsonParser");

/**
 * Universal CSV / XLS / XLSX Parser:
 * 1. Read sheet buffer into raw 2D grid
 * 2. Send the first ~15 rows to Gemini once to discover header index and column mapping
 * 3. Parse all subsequent rows in pure fast deterministic JS code
 * 4. Skip rows without valid date/amount
 */
const parseGridStatement = async (buffer) => {
  let workbook;
  try {
    workbook = xlsx.read(buffer, { type: "buffer", cellDates: false });
  } catch (err) {
    throw new AppError("Failed to parse spreadsheet. Please ensure the file is a valid CSV or Excel file.", 400);
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new AppError("Spreadsheet contains no sheets.", 400);
  }

  const worksheet = workbook.Sheets[sheetName];
  // Extract as array of arrays (raw grid)
  const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

  if (!rows || rows.length === 0) {
    throw new AppError("Uploaded file is empty.", 400);
  }

  // Take the first 15 rows for inspection
  const sampleRows = rows.slice(0, 15).map((row) =>
    Array.isArray(row) ? row.map((cell) => String(cell || "").trim()) : []
  );

  const promptText = `
You are analyzing the header and column layout of a bank statement spreadsheet.
Here are the first 15 rows of the spreadsheet:
${JSON.stringify(sampleRows, null, 2)}

Detect:
1. "headerRowIndex": 0-indexed number of the row containing column headers (e.g. Date, Narration/Description, Withdrawal/Debit, Deposit/Credit, Amount). If headers don't exist and data starts right away, set headerRowIndex to -1.
2. "dateColIndex": column index (0-indexed) for Transaction Date.
3. "descriptionColIndex": column index (0-indexed) for Narration, Description, Remarks, or Merchant.
4. "debitColIndex": column index (0-indexed) for Debit / Withdrawal / Dr, or null if there is only a single signed Amount column.
5. "creditColIndex": column index (0-indexed) for Credit / Deposit / Cr, or null if there is only a single signed Amount column.
6. "amountColIndex": column index (0-indexed) if there is a single signed amount or general Amount column, else null.
7. "typeColIndex": column index (0-indexed) if there is an explicit Dr/Cr column (e.g., 'CR'/'DR'), else null.
8. "dateFormatHint": hint for date format, like "DD/MM/YYYY", "YYYY-MM-DD", "MM/DD/YYYY".

Return strictly JSON matching this structure:
{
  "headerRowIndex": 0,
  "dateColIndex": 0,
  "descriptionColIndex": 1,
  "debitColIndex": 2,
  "creditColIndex": 3,
  "amountColIndex": null,
  "typeColIndex": null,
  "dateFormatHint": "DD/MM/YYYY"
}
`;

  const rawMapping = await askGeminiStructured({
    contents: [{ role: "user", parts: [{ text: promptText }] }],
    jsonMode: true,
    temperature: 0,
  });

  const mapping = safeParseJSON(rawMapping);
  if (!mapping || typeof mapping.dateColIndex !== "number") {
    throw new AppError("Could not detect the statement columns in the spreadsheet. Please check the file format.", 400);
  }

  const startIdx = (typeof mapping.headerRowIndex === "number" && mapping.headerRowIndex >= 0)
    ? mapping.headerRowIndex + 1
    : 0;

  const parseDateStr = (val, formatHint) => {
    if (!val) return null;
    const str = String(val).trim();
    if (!str) return null;

    // Excel numeric date (e.g., 44927)
    if (/^\d{5}$/.test(str)) {
      try {
        const parsedExcel = xlsx.SSF.parse_date_code(Number(str));
        if (parsedExcel && parsedExcel.y && parsedExcel.m && parsedExcel.d) {
          const y = parsedExcel.y;
          const m = String(parsedExcel.m).padStart(2, "0");
          const d = String(parsedExcel.d).padStart(2, "0");
          return `${y}-${m}-${d}`;
        }
      } catch (e) {}
    }

    // Match DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (dmyMatch) {
      const part1 = dmyMatch[1].padStart(2, "0");
      const part2 = dmyMatch[2].padStart(2, "0");
      const year = dmyMatch[3];
      if (formatHint && formatHint.toUpperCase().startsWith("MM")) {
        return `${year}-${part1}-${part2}`;
      }
      return `${year}-${part2}-${part1}`;
    }

    // Match YYYY-MM-DD
    const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const month = ymdMatch[2].padStart(2, "0");
      const day = ymdMatch[3].padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    // Try standard JS Date parsing fallback
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1990 && parsed.getFullYear() < 2100) {
      return parsed.toISOString().split("T")[0];
    }
    return null;
  };

  const parseNumber = (val) => {
    if (val === null || val === undefined || val === "") return null;
    const clean = String(val).replace(/,/g, "").replace(/[^\d.-]/g, "").trim();
    if (!clean) return null;
    const n = parseFloat(clean);
    return isNaN(n) ? null : n;
  };

  const extracted = [];

  for (let r = startIdx; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    const rawDate = row[mapping.dateColIndex];
    const dateFormatted = parseDateStr(rawDate, mapping.dateFormatHint);
    if (!dateFormatted) continue; // Skip headers, footers, notes, totals

    const description = mapping.descriptionColIndex !== null && mapping.descriptionColIndex !== undefined
      ? String(row[mapping.descriptionColIndex] || "").trim()
      : "Transaction";

    let debit = null;
    let credit = null;

    if (mapping.debitColIndex !== null && mapping.debitColIndex !== undefined) {
      debit = parseNumber(row[mapping.debitColIndex]);
    }
    if (mapping.creditColIndex !== null && mapping.creditColIndex !== undefined) {
      credit = parseNumber(row[mapping.creditColIndex]);
    }

    // Single amount column logic
    if (debit === null && credit === null && mapping.amountColIndex !== null && mapping.amountColIndex !== undefined) {
      const amt = parseNumber(row[mapping.amountColIndex]);
      if (amt !== null) {
        if (mapping.typeColIndex !== null && mapping.typeColIndex !== undefined) {
          const typeStr = String(row[mapping.typeColIndex] || "").toUpperCase();
          if (typeStr.includes("CR") || typeStr.includes("CREDIT") || typeStr.includes("INCOME")) {
            credit = Math.abs(amt);
          } else {
            debit = Math.abs(amt);
          }
        } else {
          if (amt < 0) {
            debit = Math.abs(amt);
          } else {
            credit = Math.abs(amt);
          }
        }
      }
    }

    if ((debit === null || debit === 0) && (credit === null || credit === 0)) {
      continue;
    }

    extracted.push({
      date: dateFormatted,
      description: description || "Transaction",
      debit: debit ? Math.abs(debit) : null,
      credit: credit ? Math.abs(credit) : null,
    });
  }

  return extracted;
};

module.exports = {
  parseGridStatement,
};
