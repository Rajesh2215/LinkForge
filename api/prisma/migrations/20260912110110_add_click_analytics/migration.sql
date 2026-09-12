-- CreateTable
CREATE TABLE "click_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "browser" TEXT,
    "device" TEXT,
    "referer" TEXT,
    "country" TEXT,

    CONSTRAINT "click_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "click_events_eventId_key" ON "click_events"("eventId");

-- CreateIndex
CREATE INDEX "click_events_shortCode_idx" ON "click_events"("shortCode");

-- CreateIndex
CREATE INDEX "click_events_clickedAt_idx" ON "click_events"("clickedAt");

-- AddForeignKey
ALTER TABLE "click_events" ADD CONSTRAINT "click_events_shortCode_fkey" FOREIGN KEY ("shortCode") REFERENCES "urls"("shortCode") ON DELETE CASCADE ON UPDATE CASCADE;
