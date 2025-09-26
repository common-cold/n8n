-- CreateTable
CREATE TABLE "public"."NodeType" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "NodeType_pkey" PRIMARY KEY ("id")
);
