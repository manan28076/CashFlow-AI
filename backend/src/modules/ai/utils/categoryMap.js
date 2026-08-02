const prisma = require("../../../lib/prisma");

const getCategoryMap = async () => {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });

  const names = categories.map((c) => c.name);

  const nameToId = categories.reduce((map, c) => {
    map[c.name] = c.id;
    return map;
  }, {});

  return { names, nameToId };
};

const resolveCategoryId = (categoryName, nameToId) => {
  return nameToId[categoryName] || nameToId["Other"] || null;
};

module.exports = {
  getCategoryMap,
  resolveCategoryId,
};