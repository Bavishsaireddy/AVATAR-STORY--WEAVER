-- CreateTable
CREATE TABLE "saved_stories" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "segments" JSONB NOT NULL,
    "characters" JSONB NOT NULL,
    "dna" JSONB,
    "creativity_preference" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "pending_choices" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_stories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_stories_client_id_updated_at_idx" ON "saved_stories"("client_id", "updated_at");
