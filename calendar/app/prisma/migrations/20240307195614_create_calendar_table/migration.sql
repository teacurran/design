-- CreateTable
CREATE TABLE "Calendar" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Calendar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Calendar_createdAt_key" ON "Calendar"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Calendar_updatedAt_key" ON "Calendar"("updatedAt");
