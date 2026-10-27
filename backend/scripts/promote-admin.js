
require("dotenv").config();

const prisma = require("../src/lib/prisma");

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    throw new Error(
      "Usage: node scripts/promote-admin.js your-email@example.com"
    );
  }

  const account = await prisma.owner.findUnique({
    where: { email },
    select: { id: true, email: true, role: true },
  });

  if (!account) {
    throw new Error(
      "Account not found. Register through ROOMO first, then retry."
    );
  }

  const updated = await prisma.owner.update({
    where: { id: account.id },
    data: { role: "ADMIN" },
    select: { id: true, email: true, role: true },
  });

  console.log("Administrator role assigned:", updated);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
