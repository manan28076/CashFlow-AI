const crypto = require("crypto");
const prisma = require("../../lib/prisma");
const AppError = require("../../errors/AppError");
const { parsePdfStatement } = require("./parsers/pdf.parser");
const { parseGridStatement } = require("./parsers/excel.parser");
const { askGeminiStructured } = require("../ai/services/gemini.service");
const { safeParseJSON } = require("../ai/utils/jsonParser");

// Known Indian merchant and narration rule map
const MERCHANT_RULES = [
  // Food & Dining / Groceries / Quick Commerce
  { pattern: /\b(swiggy|instamart)\b/i, merchant: "Swiggy", category: "Food" },
  { pattern: /\b(zomato|blinkit)\b/i, merchant: "Zomato", category: "Food" },
  { pattern: /\b(zepto)\b/i, merchant: "Zepto", category: "Food" },
  { pattern: /\b(bb daily|bigbasket|grofers)\b/i, merchant: "BigBasket", category: "Food" },
  { pattern: /\b(dmart|d-mart|avenue supermarts|smart bazaar|reliance fresh|nature basket|more retail|spencer|spencers|supermarket|kirana|provision)\b/i, merchant: "Supermarket / Grocery", category: "Food" },
  { pattern: /\b(mcdonalds|starbucks|dominos|pizza hut|kfc|burger king|chaayos|chai point|subway|haldiram|bikanervala|barbeque nation|faasos|eatclub|behrouz|ovenstory|costa coffee|third wave|cafe coffee day|tea|chai|coffee|cafe|dhaba|baker|bakery|restaurant|dining|kitchen|canteen|sweet|sweets|mithai|mess|tiffin|snack)\b/i, merchant: "Food & Dining", category: "Food" },

  // Transport & Travel & Fuel
  { pattern: /\b(uber)\b/i, merchant: "Uber", category: "Travel" },
  { pattern: /\b(ola)\b/i, merchant: "Ola", category: "Travel" },
  { pattern: /\b(rapido|namma yatri)\b/i, merchant: "Rapido / Auto", category: "Travel" },
  { pattern: /\b(irctc|indian railways|railway|rail)\b/i, merchant: "IRCTC / Railways", category: "Travel" },
  { pattern: /\b(makemytrip|goibibo|ixigo|easemytrip|yatra|redbus|abhibus|cleartrip)\b/i, merchant: "Travel Booking", category: "Travel" },
  { pattern: /\b(indigo|air india|akasa|spicejet|airasia|vistara)\b/i, merchant: "Airlines", category: "Travel" },
  { pattern: /\b(fuel|petrol|diesel|cng|hpcl|bpcl|iocl|indian oil|bharat petroleum|hindustan petroleum|shell)\b/i, merchant: "Fuel / Petrol", category: "Travel" },
  { pattern: /\b(fastag|toll|tollway|metro|dmrc|bmrc|parking|cab|taxi|auto)\b/i, merchant: "Transit & Toll", category: "Travel" },

  // Housing & Rent & Maintenance
  { pattern: /(?:^|[\s/_-])(rent|houserent|house\s*rent|pg\s*rent|flat\s*rent|room\s*rent|hostel|maintenance|society|maintenance\s*charge|landlord|builder)(?:$|[\s/_-])/i, merchant: "Rent & Society Maintenance", category: "Bills" },
  { pattern: /\b(nobroker|magicbricks|nestaway|housing\.com|mygate|apnacomplex|nobrokerhood)\b/i, merchant: "House Rent / Community", category: "Bills" },

  // Utilities & Telecom & Bills
  { pattern: /\b(airtel)\b/i, merchant: "Airtel", category: "Bills" },
  { pattern: /\b(jio|reliance jio)\b/i, merchant: "Jio", category: "Bills" },
  { pattern: /\b(vodafone|vi prepaid|vi postpaid|bsnl|mtnl)\b/i, merchant: "Telecom Bill", category: "Bills" },
  { pattern: /\b(bescom|cesc|tata power|mahadiscom|electricity|torrent power|adani electricity|tneb|mseb|uppcl|bses|dhbvn|power|bijli)\b/i, merchant: "Electricity Bill", category: "Bills" },
  { pattern: /\b(igl|mgl|indane|bharat gas|hp gas|gas|gas bill|mahanagar gas|indraprastha gas)\b/i, merchant: "Gas Utility", category: "Bills" },
  { pattern: /\b(water|water bill|jal board|property tax|municipal)\b/i, merchant: "Municipal & Water", category: "Bills" },
  { pattern: /\b(act fibernet|act corp|hathway|spectra|airtel xstream|jiofiber|broadband|wifi)\b/i, merchant: "Broadband Internet", category: "Bills" },
  { pattern: /\b(tata play|dish tv|sun direct|dth|recharge|postpaid|billdesk|bbps)\b/i, merchant: "Utility / DTH", category: "Bills" },

  // Shopping & Ecommerce & Retail
  { pattern: /\b(amazon|amzn)\b/i, merchant: "Amazon", category: "Shopping" },
  { pattern: /\b(flipkart)\b/i, merchant: "Flipkart", category: "Shopping" },
  { pattern: /\b(myntra)\b/i, merchant: "Myntra", category: "Shopping" },
  { pattern: /\b(ajio|nykaa|purplle|tata cliq|meesho|snapdeal)\b/i, merchant: "Online Shopping", category: "Shopping" },
  { pattern: /\b(croma|reliance digital|vijay sales|poorvika|sangeetha)\b/i, merchant: "Electronics Retail", category: "Shopping" },
  { pattern: /\b(ikea|home centre|pepperfry|urban ladder)\b/i, merchant: "Furniture / Home", category: "Shopping" },
  { pattern: /\b(zara|h&m|uniqlo|decathlon|lenskart|titan|westside|pantaloons|shoppers stop|max fashion|marks & spencer|urbanic|snitch|bewakoof|fabindia)\b/i, merchant: "Fashion & Lifestyle", category: "Shopping" },

  // Entertainment & Subscriptions
  { pattern: /\b(netflix)\b/i, merchant: "Netflix", category: "Entertainment" },
  { pattern: /\b(spotify)\b/i, merchant: "Spotify", category: "Entertainment" },
  { pattern: /\b(hotstar|disney|prime video|amazon prime|youtube|apple\.com|apple bill|apple music|google play|google one)\b/i, merchant: "Digital Subscription", category: "Entertainment" },
  { pattern: /\b(bookmyshow|pvr|inox|cinepolis|movie|cinema|sonyliv|zee5|aha|sun nxt|jiocinema|playstation|steam|xbox|audible|kindle)\b/i, merchant: "Entertainment & Media", category: "Entertainment" },

  // Investments & Financial Services
  { pattern: /\b(zerodha|kite)\b/i, merchant: "Zerodha", category: "Investment" },
  { pattern: /\b(groww)\b/i, merchant: "Groww", category: "Investment" },
  { pattern: /\b(angel one|upstox|indmoney|kuvera|etmoney|coin|mutual fund|sip|ppf|nps|uti|hdfc amc|sbi mutual|axis mutual|nippon|icici pru|parag parikh|ppfas|mirae|mf)\b/i, merchant: "Investment / Mutual Funds", category: "Investment" },
  { pattern: /\b(lic|hdfc life|max life|sbi life|icici lombard|star health|insurance|premium)\b/i, merchant: "Insurance", category: "Investment" },

  // Healthcare & Wellness
  { pattern: /\b(apollo pharmacy|apollo 247|1mg|tata 1mg|pharmeasy|netmeds|medplus|practo|clinikk|cult\.fit|cultfit|curefit|gym|fitness|clinic|hospital|doctor|dentist|dental|pharmacy|chemist|diagnostic|dr lal|metropolis|srl|thyrocare|pathology|medical|health)\b/i, merchant: "Healthcare / Medical", category: "Healthcare" },

  // Salary & Income
  { pattern: /\b(salary|payroll|wages|stipend|payout|bonus|incentive|remuneration)\b/i, merchant: "Salary & Payout", category: "Salary" },
  { pattern: /\b(dividend|interest credit|bank interest|fd interest|cashback|refund|rebate)\b/i, merchant: "Income / Refund", category: "Other" },
];

/**
 * Clean ugly UPI narration string:
 * e.g., "UPI/DR/48392019/SWIGGY/swiggy@icici/Order" -> "SWIGGY"
 */
const cleanUpiNarration = (raw) => {
  if (!raw) return "Transaction";
  let s = String(raw).trim();

  // Common UPI format: UPI-MERCHANT-merchant@vpa-RefNo... or UPI/DR/.../MERCHANT/...
  const upiMatch = s.match(/UPI[-/](?:CR|DR|P2M|P2P)[-/][^/-]*[-/]([A-Za-z0-9\s._]+)/i) ||
                   s.match(/UPI[-/]([A-Za-z0-9\s._]+?)[-/]/i) ||
                   s.match(/TRANSFER TO\s+([A-Za-z0-9\s._]+)/i) ||
                   s.match(/TRANSFER FROM\s+([A-Za-z0-9\s._]+)/i);

  if (upiMatch && upiMatch[1]) {
    const candidate = upiMatch[1].trim();
    if (candidate.length > 2 && !/^\d+$/.test(candidate)) {
      return candidate;
    }
  }

  // Remove common prefix tokens
  s = s.replace(/^(NEFT|RTGS|IMPS|POS|ACH|NACH|UPI)[-/\s]+/i, "");
  s = s.replace(/[-/]\d{6,}$/, ""); // remove trailing transaction/ref numbers
  return s.trim() || raw;
};

/**
 * Compute sha256 hash for deduplication:
 * sha256(date|amount|type|lowercased description|occurrence-number)
 */
const computeTransactionHash = (dateStr, amount, type, description, occurrence = 1) => {
  const normDate = new Date(dateStr).toISOString().split("T")[0];
  const normDesc = (description || "").toLowerCase().trim();
  const normAmt = Number(amount).toFixed(2);
  const payload = `${normDate}|${normAmt}|${type}|${normDesc}|${occurrence}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
};

/**
 * Parse an uploaded statement file buffer and return categorized, deduplicated preview rows.
 */
const parseStatementFile = async ({ buffer, originalname, mimetype }, userId, targetAccountId) => {
  const ext = (originalname.split(".").pop() || "").toLowerCase();
  const isPdf = mimetype.includes("pdf") || ext === "pdf";
  const isExcelOrCsv =
    mimetype.includes("sheet") ||
    mimetype.includes("csv") ||
    mimetype.includes("excel") ||
    ["csv", "xls", "xlsx"].includes(ext);

  if (!isPdf && !isExcelOrCsv) {
    throw new AppError("Unsupported file type. Please upload a PDF, CSV, XLS, or XLSX bank statement.", 400);
  }

  // 1. Extract raw items from document
  let rawItems = [];
  if (isPdf) {
    rawItems = await parsePdfStatement(buffer);
  } else {
    rawItems = await parseGridStatement(buffer);
  }

  if (!rawItems || rawItems.length === 0) {
    throw new AppError("No transactions found in the uploaded statement. Please check the file content.", 400);
  }

  if (rawItems.length > 500) {
    rawItems = rawItems.slice(0, 500);
  }

  // 2. Fetch existing user accounts and categories
  const [categories, accounts] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.account.findMany({ where: { userId }, select: { id: true, name: true, bankName: true } }),
  ]);

  if (accounts.length === 0) {
    // If user has no account yet, create a default "Primary Account"
    const defaultAcc = await prisma.account.create({
      data: {
        userId,
        name: "Primary Account",
        bankName: "Bank / Wallet",
      },
    });
    accounts.push(defaultAcc);
  }

  const selectedAccountId = targetAccountId && accounts.some((a) => a.id === targetAccountId)
    ? targetAccountId
    : accounts[0].id;

  const categoryMap = new Map(); // lowercase name -> category
  categories.forEach((c) => categoryMap.set(c.name.toLowerCase(), c));

  let otherCategory = categoryMap.get("other") || categories[0];
  if (!otherCategory) {
    otherCategory = await prisma.category.create({ data: { name: "Other" } });
    categories.push(otherCategory);
    categoryMap.set("other", otherCategory);
  }

  // 3. Normalize amounts, directions and clean merchant names
  const normalizedRows = [];
  for (const item of rawItems) {
    const rawDate = item.date;
    const debit = typeof item.debit === "number" ? Math.abs(item.debit) : null;
    const credit = typeof item.credit === "number" ? Math.abs(item.credit) : null;

    let amount = 0;
    let type = "EXPENSE";

    if (debit !== null && debit > 0) {
      amount = debit;
      type = "EXPENSE";
    } else if (credit !== null && credit > 0) {
      amount = credit;
      type = "INCOME";
    } else {
      continue; // Skip 0 or empty rows
    }

    const cleanMerchant = cleanUpiNarration(item.description);

    normalizedRows.push({
      date: rawDate,
      rawDescription: item.description,
      merchant: cleanMerchant,
      description: item.description || cleanMerchant,
      amount,
      type,
    });
  }

  if (normalizedRows.length === 0) {
    throw new AppError("Zero valid financial transactions could be parsed from this file.", 400);
  }

  // 3.5. Load user's historical categorizations for instant 0ms personalized memory matching
  const pastTransactions = await prisma.transaction.findMany({
    where: {
      account: { userId },
      categoryId: { not: null },
    },
    select: {
      merchant: true,
      description: true,
      categoryId: true,
      category: { select: { id: true, name: true } },
    },
    take: 500,
    orderBy: { createdAt: "desc" },
  });

  const memoryMap = new Map();
  for (const past of pastTransactions) {
    if (past.category) {
      if (past.merchant) {
        memoryMap.set(past.merchant.toLowerCase().trim(), {
          id: past.categoryId,
          name: past.category.name,
        });
      }
      if (past.description) {
        memoryMap.set(past.description.toLowerCase().trim(), {
          id: past.categoryId,
          name: past.category.name,
        });
      }
    }
  }

  // 4. Categorize rows: User memory first, then comprehensive regex rules, then Gemini batch for remaining unknowns
  const categoryNames = categories.map((c) => c.name);
  const unassignedRows = [];

  for (let i = 0; i < normalizedRows.length; i++) {
    const row = normalizedRows[i];
    const merchantKey = (row.merchant || "").toLowerCase().trim();
    const descKey = (row.description || "").toLowerCase().trim();

    // Check 1: User's historical personal category memory (0 ms)
    const memMatch = memoryMap.get(merchantKey) || memoryMap.get(descKey);
    if (memMatch) {
      row.categoryId = memMatch.id;
      row.categoryName = memMatch.name;
      continue;
    }

    // Check 2: Comprehensive Indian merchant & narration rules (0 ms)
    let matchedCatName = null;
    const textToMatch = `${row.rawDescription} ${row.merchant} ${row.description}`.toLowerCase();

    for (const rule of MERCHANT_RULES) {
      if (rule.pattern.test(textToMatch)) {
        matchedCatName = rule.category;
        break;
      }
    }

    if (matchedCatName) {
      const found = categoryMap.get(matchedCatName.toLowerCase());
      row.categoryId = found ? found.id : otherCategory.id;
      row.categoryName = found ? found.name : otherCategory.name;
    } else {
      unassignedRows.push({
        rowIndex: i,
        merchant: row.merchant,
        narration: row.rawDescription || row.description,
        type: row.type,
        amount: row.amount,
      });
    }
  }

  // Batch Gemini categorization for unassigned items with full context (narration, type, amount)
  if (unassignedRows.length > 0) {
    const chunks = [];
    for (let i = 0; i < unassignedRows.length; i += 40) {
      chunks.push(unassignedRows.slice(i, i + 40));
    }

    await Promise.all(
      chunks.map(async (chunk) => {
        const promptItems = chunk.map((item) => ({
          id: item.rowIndex,
          merchant: item.merchant,
          narration: item.narration,
          type: item.type,
          amount: item.amount,
        }));

        const promptText = `
You are a financial AI categorizing Indian bank transactions into EXACTLY one of these allowed categories:
${JSON.stringify(categoryNames)}

Given this list of transactions (includes bank narration, remarks, amount, and type EXPENSE or INCOME):
${JSON.stringify(promptItems)}

Guidelines:
- If narration contains keywords like "rent", "maintenance", "society", "electricity", "broadband", "mobile" -> "Bills"
- If it's a grocery or food order -> "Food"
- If it's train/flight/cab/fuel -> "Travel"
- If it's salary or client payout -> "Salary"
- If money transfer or personal send -> "Transfer"
- If investment or SIP -> "Investment"
- Default to "Other" if completely ambiguous.

Return a JSON array of objects with schema:
[
  { "id": 0, "category": "One of allowed categories" }
]
Return strictly valid JSON.
`;
        try {
          const rawAiRes = await askGeminiStructured({
            contents: [{ role: "user", parts: [{ text: promptText }] }],
            jsonMode: true,
            temperature: 0,
          });
          const aiArr = safeParseJSON(rawAiRes);
          if (Array.isArray(aiArr)) {
            for (const item of aiArr) {
              if (item && typeof item.id === "number" && item.category) {
                const targetRow = normalizedRows[item.id];
                if (targetRow && !targetRow.categoryId) {
                  const found = categoryMap.get(item.category.toLowerCase());
                  if (found) {
                    targetRow.categoryId = found.id;
                    targetRow.categoryName = found.name;
                  }
                }
              }
            }
          }
        } catch (e) {
          // Graceful fallback to Other on any AI failure
        }
      })
    );
  }

  // Final fallback: Ensure every row has a category
  for (const row of normalizedRows) {
    if (!row.categoryId) {
      row.categoryId = otherCategory.id;
      row.categoryName = otherCategory.name;
    }
  }

  // 5. Deduplication: Compute hash with occurrence tracking and check against existing transactions
  // Fetch existing hashes for this user's accounts
  const existingTransactions = await prisma.transaction.findMany({
    where: {
      account: { userId },
      hash: { not: null },
    },
    select: { hash: true },
  });
  const existingHashSet = new Set(existingTransactions.map((t) => t.hash));

  // Count occurrence of identical transactions within this upload to handle genuine duplicate same-day transfers
  const occurrenceTracker = new Map();

  const previewRows = normalizedRows.map((row, index) => {
    const keyWithoutOcc = `${row.date}|${row.amount}|${row.type}|${(row.description || "").toLowerCase().trim()}`;
    const occ = (occurrenceTracker.get(keyWithoutOcc) || 0) + 1;
    occurrenceTracker.set(keyWithoutOcc, occ);

    const hash = computeTransactionHash(row.date, row.amount, row.type, row.description, occ);
    const isDuplicate = existingHashSet.has(hash);

    return {
      tempId: `row_${index}_${Date.now()}`,
      date: row.date,
      description: row.description,
      merchant: row.merchant,
      amount: row.amount,
      type: row.type,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      hash,
      duplicate: isDuplicate,
    };
  });

  const duplicateCount = previewRows.filter((r) => r.duplicate).length;
  const newCount = previewRows.length - duplicateCount;

  return {
    accountId: selectedAccountId,
    accounts,
    categories,
    summary: {
      total: previewRows.length,
      newCount,
      duplicateCount,
    },
    transactions: previewRows,
  };
};

/**
 * Confirm and save validated transactions.
 * Strict server-side re-validation: amount > 0, valid type, category allowed, skip duplicates.
 */
const confirmImport = async (rows, accountId, userId) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new AppError("No transactions provided for confirmation.", 400);
  }

  // Verify account belongs to user
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
  });
  if (!account) {
    throw new AppError("Selected account not found or does not belong to you.", 404);
  }

  // Verify allowed categories
  const categories = await prisma.category.findMany({ select: { id: true } });
  const validCategoryIds = new Set(categories.map((c) => c.id));

  // Fetch existing hashes for deduplication
  const existingTransactions = await prisma.transaction.findMany({
    where: {
      account: { userId },
      hash: { not: null },
    },
    select: { hash: true },
  });
  const existingHashSet = new Set(existingTransactions.map((t) => t.hash));

  const validRowsToInsert = [];
  const insertedHashesInBatch = new Set();

  for (const r of rows) {
    const amount = Number(r.amount);
    if (isNaN(amount) || amount <= 0) continue;

    const type = r.type === "INCOME" ? "INCOME" : r.type === "EXPENSE" ? "EXPENSE" : null;
    if (!type) continue;

    if (!r.categoryId || !validCategoryIds.has(r.categoryId)) continue;

    const parsedDate = new Date(r.date);
    if (isNaN(parsedDate.getTime())) continue;

    const hash = r.hash || computeTransactionHash(r.date, amount, type, r.description);

    // Skip duplicates
    if (existingHashSet.has(hash) || insertedHashesInBatch.has(hash)) {
      continue;
    }

    insertedHashesInBatch.add(hash);
    validRowsToInsert.push({
      accountId,
      categoryId: r.categoryId,
      amount,
      type,
      description: String(r.description || r.merchant || "Transaction").slice(0, 500),
      merchant: r.merchant ? String(r.merchant).slice(0, 200) : null,
      date: parsedDate,
      hash,
      isAnomaly: false,
    });
  }

  let importedCount = 0;
  if (validRowsToInsert.length > 0) {
    const result = await prisma.transaction.createMany({
      data: validRowsToInsert,
      skipDuplicates: true,
    });
    importedCount = result.count;
  }

  return {
    importedCount,
    skippedDuplicates: rows.length - importedCount,
  };
};

module.exports = {
  parseStatementFile,
  confirmImport,
};
