const safeParseJSON = (text) => {
  try {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error("Invalid JSON returned by AI.");
  }
};

module.exports = {
  safeParseJSON,
};