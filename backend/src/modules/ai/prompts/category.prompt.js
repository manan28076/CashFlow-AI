const categoryPrompt = (transactions, categoryNames, userCorrections = []) => {
  let correctionsBlock = "";
  if (Array.isArray(userCorrections) && userCorrections.length > 0) {
    const examples = userCorrections
      .map((c) => `- "${c.merchantKey}" -> "${c.category}"`)
      .join("\n");
    correctionsBlock = `\nUser-Specific Category Corrections (Follow these established user habits):\n${examples}\n`;
  }

  return `
You are a financial AI.

Categorize each transaction into exactly one of these allowed categories:
${JSON.stringify(categoryNames)}
${correctionsBlock}
Return ONLY a valid JSON array, one entry per transaction, in the same order as given, using the "id" field to match.

Transactions:
${JSON.stringify(transactions)}

Expected Output:
[
  {
    "id": 0,
    "category": "Food"
  }
]
`;
};

module.exports = {
  categoryPrompt,
};