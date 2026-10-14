-- CreateTable
CREATE TABLE "KnowledgeDoc" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "retrievedOn" TIMESTAMP(3) NOT NULL,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeDoc_contentHash_key" ON "KnowledgeDoc"("contentHash");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_docId_idx" ON "KnowledgeChunk"("docId");

-- AddForeignKey
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_docId_fkey" FOREIGN KEY ("docId") REFERENCES "KnowledgeDoc"("id") ON DELETE CASCADE ON UPDATE CASCADE;
