const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const categories = [
    "Salary",
    "Freelance",
    "Food",
    "Shopping",
    "Travel",
    "Entertainment",
    "Bills",
    "Healthcare",
    "Education",
    "Investment",
    "Transfer",
    "Other",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("✅ Categories seeded successfully!");
}

main()
  .catch((err) => {
    console.error(err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });