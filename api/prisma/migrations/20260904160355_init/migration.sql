-- CreateTable
CREATE TABLE "urls" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "shortCode" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "urls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "urls_shortCode_key" ON "urls"("shortCode");

-- CreateIndex
CREATE INDEX "urls_shortCode_idx" ON "urls"("shortCode");
