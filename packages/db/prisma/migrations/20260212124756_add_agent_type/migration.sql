-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('SUPPORT', 'ORDER', 'BILLING');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "agent" "AgentType" NOT NULL DEFAULT 'SUPPORT';
