import { prisma } from "../lib/prisma";

export const cleanupExpiredUrls = async () => {
  console.log("🧹 Cleanup started:", new Date().toISOString());

  const result = await prisma.url.deleteMany({
    where: {
      expiresAt: { lte: new Date() },  // delete all rows where expiresAt <= now
    },
  });

  console.log(`✅ Cleanup complete: ${result.count} expired URLs deleted`);
};