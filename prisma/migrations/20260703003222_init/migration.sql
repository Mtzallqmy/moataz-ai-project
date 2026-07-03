-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
        CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'USER');
    END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Plan') THEN
        CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');
    END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionStatus') THEN
        CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE');
    END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageRole') THEN
        CREATE TYPE "MessageRole" AS ENUM ('system', 'user', 'assistant');
    END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'KbStatus') THEN
        CREATE TYPE "KbStatus" AS ENUM ('indexed', 'pending', 'failed');
    END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MemoryType') THEN
        CREATE TYPE "MemoryType" AS ENUM ('short_term', 'long_term', 'conversation', 'project', 'knowledge');
    END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AgentStatus') THEN
        CREATE TYPE "AgentStatus" AS ENUM ('idle', 'running', 'completed', 'failed');
    END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SandboxLanguage') THEN
        CREATE TYPE "SandboxLanguage" AS ENUM ('javascript', 'typescript', 'python', 'bash', 'json', 'markdown');
    END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ToolCategory') THEN
        CREATE TYPE "ToolCategory" AS ENUM ('internal', 'mcp', 'custom');
    END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkflowNodeType') THEN
        CREATE TYPE "WorkflowNodeType" AS ENUM ('agent_task', 'condition', 'loop', 'tool_call', 'delay');
    END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkflowTriggerType') THEN
        CREATE TYPE "WorkflowTriggerType" AS ENUM ('cron', 'event', 'webhook');
    END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkflowRunStatus') THEN
        CREATE TYPE "WorkflowRunStatus" AS ENUM ('pending', 'running', 'completed', 'failed');
    END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AutomationLogStatus') THEN
        CREATE TYPE "AutomationLogStatus" AS ENUM ('success', 'failed');
    END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "emailVerified" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "defaultModel" TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    "systemPrompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "projectId" TEXT,
    "userId" TEXT NOT NULL,
    "modelId" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiType" TEXT NOT NULL,
    "apiKey" TEXT,
    "baseUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "healthStatus" TEXT NOT NULL DEFAULT 'healthy',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Model" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiName" TEXT NOT NULL,
    "contextWindow" INTEGER NOT NULL,
    "costPer1kInput" DOUBLE PRECISION NOT NULL,
    "costPer1kOutput" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "redactedKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT,
    "modelId" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "File" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "folderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Folder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PromptTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "userId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "variables" JSONB,
    "version" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "KbCollection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KbCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "KbDocument" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" "KbStatus" NOT NULL DEFAULT 'pending',
    "tags" JSONB,
    "chunksCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KbDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "MemoryItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "MemoryType" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Agent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "avatar" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tools" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metrics" JSONB NOT NULL DEFAULT '{ "tasksCompleted": 0, "errorRate": 0.0, "avgResponseMs": 0 }',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AgentSession" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AgentStatus" NOT NULL DEFAULT 'idle',
    "messages" JSONB NOT NULL DEFAULT '[]',
    "sharedMemory" JSONB NOT NULL DEFAULT '{}',
    "logs" JSONB NOT NULL DEFAULT '[]',
    "metrics" JSONB NOT NULL DEFAULT '{ "cpuPercentage": 0, "memoryBytes": 0, "toolExecutionCount": 0, "totalDurationMs": 0 }',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SandboxExecution" (
    "id" TEXT NOT NULL,
    "agentSessionId" TEXT NOT NULL,
    "language" "SandboxLanguage" NOT NULL,
    "code" TEXT NOT NULL,
    "status" "AgentStatus" NOT NULL DEFAULT 'completed',
    "output" TEXT,
    "error" TEXT,
    "executionTimeMs" INTEGER NOT NULL,
    "memoryUsageMb" INTEGER NOT NULL,
    "cpuUsagePercentage" DOUBLE PRECISION NOT NULL,
    "filesCreated" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SandboxExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Tool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ToolCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "requiresPermission" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Workflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "nodes" JSONB NOT NULL DEFAULT '[]',
    "triggers" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "WorkflowRun" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "status" "WorkflowRunStatus" NOT NULL DEFAULT 'pending',
    "currentNodeId" TEXT,
    "state" JSONB NOT NULL DEFAULT '{}',
    "logs" JSONB NOT NULL DEFAULT '[]',
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AutomationTriggerLog" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "triggerType" "WorkflowTriggerType" NOT NULL,
    "eventPayload" JSONB,
    "status" "AutomationLogStatus" NOT NULL DEFAULT 'success',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationTriggerLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Conversation_projectId_idx" ON "Conversation"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Conversation_userId_idx" ON "Conversation"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Provider_name_key" ON "Provider"("name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UsageLog_userId_idx" ON "UsageLog"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "File_projectId_idx" ON "File"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "File_userId_idx" ON "File"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Folder_projectId_idx" ON "Folder"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Folder_userId_idx" ON "Folder"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PromptTemplate_userId_idx" ON "PromptTemplate"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KbCollection_projectId_idx" ON "KbCollection"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KbDocument_collectionId_idx" ON "KbDocument"("collectionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MemoryItem_projectId_idx" ON "MemoryItem"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MemoryItem_userId_idx" ON "MemoryItem"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Agent_userId_idx" ON "Agent"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentSession_projectId_idx" ON "AgentSession"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentSession_agentId_idx" ON "AgentSession"("agentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentSession_userId_idx" ON "AgentSession"("userId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RefreshToken_userId_fkey') THEN
        ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserPreference_userId_fkey') THEN
        ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Subscription_userId_fkey') THEN
        ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Project_userId_fkey') THEN
        ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Conversation_projectId_fkey') THEN
        ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Conversation_userId_fkey') THEN
        ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Message_conversationId_fkey') THEN
        ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Model_providerId_fkey') THEN
        ALTER TABLE "Model" ADD CONSTRAINT "Model_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ApiKey_userId_fkey') THEN
        ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UsageLog_userId_fkey') THEN
        ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UsageLog_conversationId_fkey') THEN
        ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UsageLog_modelId_fkey') THEN
        ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'File_userId_fkey') THEN
        ALTER TABLE "File" ADD CONSTRAINT "File_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'File_projectId_fkey') THEN
        ALTER TABLE "File" ADD CONSTRAINT "File_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'File_folderId_fkey') THEN
        ALTER TABLE "File" ADD CONSTRAINT "File_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Folder_userId_fkey') THEN
        ALTER TABLE "Folder" ADD CONSTRAINT "Folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Folder_projectId_fkey') THEN
        ALTER TABLE "Folder" ADD CONSTRAINT "Folder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Folder_parentId_fkey') THEN
        ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_userId_fkey') THEN
        ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_userId_fkey') THEN
        ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PromptTemplate_userId_fkey') THEN
        ALTER TABLE "PromptTemplate" ADD CONSTRAINT "PromptTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'KbCollection_userId_fkey') THEN
        ALTER TABLE "KbCollection" ADD CONSTRAINT "KbCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'KbCollection_projectId_fkey') THEN
        ALTER TABLE "KbCollection" ADD CONSTRAINT "KbCollection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'KbDocument_collectionId_fkey') THEN
        ALTER TABLE "KbDocument" ADD CONSTRAINT "KbDocument_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "KbCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MemoryItem_userId_fkey') THEN
        ALTER TABLE "MemoryItem" ADD CONSTRAINT "MemoryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MemoryItem_projectId_fkey') THEN
        ALTER TABLE "MemoryItem" ADD CONSTRAINT "MemoryItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Agent_userId_fkey') THEN
        ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgentSession_projectId_fkey') THEN
        ALTER TABLE "AgentSession" ADD CONSTRAINT "AgentSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgentSession_agentId_fkey') THEN
        ALTER TABLE "AgentSession" ADD CONSTRAINT "AgentSession_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgentSession_userId_fkey') THEN
        ALTER TABLE "AgentSession" ADD CONSTRAINT "AgentSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SandboxExecution_agentSessionId_fkey') THEN
        ALTER TABLE "SandboxExecution" ADD CONSTRAINT "SandboxExecution_agentSessionId_fkey" FOREIGN KEY ("agentSessionId") REFERENCES "AgentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Workflow_userId_fkey') THEN
        ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Workflow_projectId_fkey') THEN
        ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkflowRun_workflowId_fkey') THEN
        ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AutomationTriggerLog_workflowId_fkey') THEN
        ALTER TABLE "AutomationTriggerLog" ADD CONSTRAINT "AutomationTriggerLog_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
