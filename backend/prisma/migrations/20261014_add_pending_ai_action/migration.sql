-- CreateTable
CREATE TABLE "PendingAiAction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "argsJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingAiAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingAiAction_userId_status_idx" ON "PendingAiAction"("userId", "status");

-- CreateIndex
CREATE INDEX "PendingAiAction_expiresAt_idx" ON "PendingAiAction"("expiresAt");

-- AddForeignKey
ALTER TABLE "PendingAiAction" ADD CONSTRAINT "PendingAiAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
