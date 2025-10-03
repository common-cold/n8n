-- CreateTable
CREATE TABLE "public"."TriggerType" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "TriggerType_pkey" PRIMARY KEY ("id")
);
