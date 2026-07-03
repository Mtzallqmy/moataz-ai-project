import { PrismaClient, AgentStatus, SandboxLanguage, ToolCategory, WorkflowTriggerType, WorkflowRunStatus, AutomationLogStatus, MemoryType } from "@prisma/client";
import path from "path";
import { gatewayRegistry } from "../gateway/registry";

const prisma = new PrismaClient();

// ==========================================
// 1. TYPES & SCHEMAS FOR AGENT PLATFORM (now mostly derived from Prisma Schema)
// ==========================================

// Agent interface is now implicitly defined by Prisma.Agent model
// AgentSession interface is now implicitly defined by Prisma.AgentSession model
// SandboxExecution interface is now implicitly defined by Prisma.SandboxExecution model
// Tool interface is now implicitly defined by Prisma.Tool model
// MemoryNode interface is now implicitly defined by Prisma.MemoryItem model
// Workflow interface is now implicitly defined by Prisma.Workflow model
// WorkflowRun interface is now implicitly defined by Prisma.WorkflowRun model
// AutomationTriggerLog interface is now implicitly defined by Prisma.AutomationTriggerLog model

// ==========================================
// 2. AGENT REGISTRY & PLATFORM MANAGER
// ==========================================

export class AgentPlatform {
  constructor() {
    this.seedAgents();
    this.registerDefaultTools();
  }

  // Seed default agents into the database if they don't exist
  private async seedAgents() {
    const defaultAgentsData = [
      {
        id: "agt-coordinator",
        name: "Coordinator Agent",
        role: "Team Director & Delegator",
        description: "Manages multiple sub-agents, delegates sub-tasks, schedules visual reasoning pipelines and merges completed sub-flows.",
        systemPrompt: "You are the Coordinator Agent. Your goal is to orchestrate, break down big user prompts, delegate specific chunks to Planner, Research, Coding, and Reviewer agents, and synthesize the final coherent summary response.",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        permissions: ["sandbox", "network", "filesystem"],
        tools: ["web_search", "mcp_runner", "http_requester"],
        metrics: { tasksCompleted: 142, errorRate: 0.01, avgResponseMs: 1200 },
        userId: "default_admin_user_id" // Placeholder, will be updated with actual admin ID
      },
      {
        id: "agt-planner",
        name: "Planner Agent",
        role: "Architect & Strategist",
        description: "Builds a precise step-by-step DAG plan, resolves complex dependencies, and manages workflow retries dynamically.",
        systemPrompt: "You are the Planner Agent. Your job is to analyze requests and construct high-level workflow plans, sequence charts, and logical trees. Detail pre-requisites and fallback paths.",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
        permissions: ["filesystem"],
        tools: ["file_reader"],
        metrics: { tasksCompleted: 98, errorRate: 0.02, avgResponseMs: 950 },
        userId: "default_admin_user_id"
      },
      {
        id: "agt-research",
        name: "Research Agent",
        role: "Web Miner & Page Parser",
        description: "Crawl documentation sites, analyze search relevance, download static references, and extract clean text chunks.",
        systemPrompt: "You are the Research Agent. Perform deep web search, extract details, parse HTML targets, and construct clean citation references for knowledge expansion.",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        permissions: ["network"],
        tools: ["web_search", "browser_navigator", "file_reader"],
        metrics: { tasksCompleted: 180, errorRate: 0.03, avgResponseMs: 1600 },
        userId: "default_admin_user_id"
      },
      {
        id: "agt-coding",
        name: "Coding Agent",
        role: "Software Engineer",
        description: "Generates high quality TypeScript, refactors complex backend files, constructs diff patches and updates modules.",
        systemPrompt: "You are the Coding Agent. Write robust code adhering to specifications. When modifying code, emit clean patch structures or complete logical rewrites.",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
        permissions: ["sandbox", "filesystem"],
        tools: ["code_search", "patch_generator", "sandbox_runner"],
        metrics: { tasksCompleted: 220, errorRate: 0.04, avgResponseMs: 1550 },
        userId: "default_admin_user_id"
      },
      {
        id: "agt-reviewer",
        name: "Reviewer Agent",
        role: "Code Auditor & QA Analyst",
        description: "Audits compiled codes, executes unit test suites, scans for security leaks, and proposes optimal refactoring edits.",
        systemPrompt: "You are the Reviewer Agent. Your goal is strict verification. Review coding output, check performance profiles, test logical bounds, and prevent regressions.",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        permissions: ["sandbox", "filesystem"],
        tools: ["sandbox_runner", "file_reader"],
        metrics: { tasksCompleted: 215, errorRate: 0.01, avgResponseMs: 1100 },
        userId: "default_admin_user_id"
      },
      {
        id: "agt-writer",
        name: "Writer Agent",
        role: "Documentation Specialist",
        description: "Formulates manuals, system docs, README architectures, and detailed markdown summaries representing execution details.",
        systemPrompt: "You are the Writer Agent. Focus on technical documentation, clear wording, clean Markdown layouts, and comprehensive explanations.",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
        permissions: ["filesystem"],
        tools: ["file_reader", "patch_generator"],
        metrics: { tasksCompleted: 110, errorRate: 0.0, avgResponseMs: 800 },
        userId: "default_admin_user_id"
      },
      {
        id: "agt-memory",
        name: "Memory Agent",
        role: "Knowledge Archivist",
        description: "Organizes semantic index networks, registers contextual details, retrieves short/long term logs and schedules pruning.",
        systemPrompt: "You are the Memory Agent. Catalog incoming user chats, tasks, outputs and build a long term searchable associative index network.",
        avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150",
        permissions: ["database"],
        tools: ["memory_retriever"],
        metrics: { tasksCompleted: 340, errorRate: 0.0, avgResponseMs: 300 },
        userId: "default_admin_user_id"
      },
      {
        id: "agt-vision",
        name: "Vision Agent",
        role: "Visual Analyst",
        description: "Processes screenshots, handles canvas rendering details, analyzes OCR layouts and parses diagrams.",
        systemPrompt: "You are the Vision Agent. Interpret base64 images, analyze UI layout files, inspect bounding boxes, and recognize technical elements.",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
        permissions: ["filesystem"],
        tools: ["vision_analyzer", "image_editor"],
        metrics: { tasksCompleted: 85, errorRate: 0.02, avgResponseMs: 1400 },
        userId: "default_admin_user_id"
      },
      {
        id: "agt-reasoning",
        name: "Reasoning Agent",
        role: "Logic & Math Synthesizer",
        description: "Performs complex deep step-by-step logic expansion, evaluates math proofs, and traces compiler anomalies.",
        systemPrompt: "You are the Reasoning Agent. Adopt structured chain-of-thought logic. Detail intermediate assumptions, check contradictions, and audit logical flow.",
        avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150",
        permissions: [],
        tools: [],
        metrics: { tasksCompleted: 155, errorRate: 0.01, avgResponseMs: 2100 },
        userId: "default_admin_user_id"
      },
      {
        id: "agt-execution",
        name: "Execution Agent",
        role: "Sandbox System Admin",
        description: "Manages terminal simulations, isolated shell workspaces, schedules Cron workflows and captures system streams.",
        systemPrompt: "You are the Execution Agent. Securely execute sandbox statements, inspect mock temporary directories, compile run logs, and capture command states.",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        permissions: ["sandbox", "filesystem", "network"],
        tools: ["sandbox_runner", "mcp_runner"],
        metrics: { tasksCompleted: 310, errorRate: 0.05, avgResponseMs: 1800 },
        userId: "default_admin_user_id"
      }
    ];

    const adminUser = await prisma.user.findUnique({ where: { email: "mtzallqmy@gmail.com" } });
    const userId = adminUser ? adminUser.id : ""; // Use actual admin ID if found

    for (const agentData of defaultAgentsData) {
      await prisma.agent.upsert({
        where: { id: agentData.id },
        update: { ...agentData, userId: userId || agentData.userId },
        create: { ...agentData, userId: userId || agentData.userId }
      });
    }
  }

  private registerDefaultTools() {
    // Tools are now managed via Prisma, but can be seeded here if needed
    // For now, assuming tools are either hardcoded or managed externally
  }

  // Active Getters
  public async getAgents(userId: string): Promise<any[]> {
    return prisma.agent.findMany({ where: { userId } });
  }

  public async getAgent(id: string, userId: string): Promise<any | null> {
    return prisma.agent.findUnique({ where: { id, userId } });
  }

  public async createAgent(agentData: any): Promise<any> {
    return prisma.agent.create({ data: agentData });
  }

  public async updateAgent(id: string, userId: string, updates: any): Promise<any> {
    return prisma.agent.update({ where: { id, userId }, data: updates });
  }

  public async deleteAgent(id: string, userId: string): Promise<any> {
    return prisma.agent.delete({ where: { id, userId } });
  }

  // Agent Sessions
  public async createAgentSession(sessionData: any): Promise<any> {
    return prisma.agentSession.create({ data: sessionData });
  }

  public async getAgentSession(id: string, userId: string): Promise<any | null> {
    return prisma.agentSession.findUnique({ where: { id, userId } });
  }

  public async updateAgentSession(id: string, userId: string, updates: any): Promise<any> {
    return prisma.agentSession.update({ where: { id, userId }, data: updates });
  }

  // Memory Items
  public async addMemory(memoryData: any): Promise<any> {
    return prisma.memoryItem.create({ data: memoryData });
  }

  public async getMemories(userId: string, projectId: string, type?: MemoryType): Promise<any[]> {
    const where: any = { userId, projectId };
    if (type) where.type = type;
    return prisma.memoryItem.findMany({ where });
  }

  // Workflows
  public async createWorkflow(workflowData: any): Promise<any> {
    return prisma.workflow.create({ data: workflowData });
  }

  public async getWorkflows(userId: string, projectId: string): Promise<any[]> {
    return prisma.workflow.findMany({ where: { userId, projectId } });
  }

  public async getWorkflow(id: string, userId: string): Promise<any | null> {
    return prisma.workflow.findUnique({ where: { id, userId } });
  }

  public async updateWorkflow(id: string, userId: string, updates: any): Promise<any> {
    return prisma.workflow.update({ where: { id, userId }, data: updates });
  }

  public async deleteWorkflow(id: string, userId: string): Promise<any> {
    return prisma.workflow.delete({ where: { id, userId } });
  }

  // Workflow Runs
  public async createWorkflowRun(runData: any): Promise<any> {
    return prisma.workflowRun.create({ data: runData });
  }

  public async getWorkflowRun(id: string, userId: string): Promise<any | null> {
    return prisma.workflowRun.findUnique({ where: { id, workflow: { userId } } });
  }

  public async updateWorkflowRun(id: string, userId: string, updates: any): Promise<any> {
    return prisma.workflowRun.update({ where: { id, workflow: { userId } }, data: updates });
  }

  // Automation Trigger Logs
  public async createAutomationLog(logData: any): Promise<any> {
    return prisma.automationTriggerLog.create({ data: logData });
  }

  // ==========================================
  // 3. SECURE WORKSPACE SANDBOX SIMULATOR (No direct DB interaction here)
  // ==========================================
  public async executeInSandbox(id: string, language: SandboxLanguage, code: string, options: { timeoutMs?: number; memoryLimitMb?: number } = {}): Promise<any> {
    const start = Date.now();
    const timeout = options.timeoutMs || 5000;
    const memoryLimit = options.memoryLimitMb || 128;
    
    let status: AgentStatus = AgentStatus.completed;
    let output = "";
    let error: string | undefined = undefined;
    const filesCreated: string[] = [];

    // Simulate real sandbox execution using localized contexts
    try {
      if (language === SandboxLanguage.javascript || language === SandboxLanguage.typescript) {
        // Safe simulation of evaluating code within a mock runtime sandboxed context
        const sandboxConsole: string[] = [];
        const mockFS: Record<string, string> = {};
        const context = {
          console: {
            log: (...args: any[]) => sandboxConsole.push(args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ")),
            error: (...args: any[]) => sandboxConsole.push("[ERROR] " + args.map(a => String(a)).join(" "))
          },
          fs: {
            writeFileSync: (file: string, content: string) => {
              mockFS[file] = content;
              filesCreated.push(file);
            },
            readFileSync: (file: string) => mockFS[file] || "",
            existsSync: (file: string) => !!mockFS[file]
          },
          setTimeout: (cb: Function, ms: number) => cb(),
          process: { env: { NODE_ENV: "sandbox" } }
        };

        // Basic evaluation, real sandbox would be more secure and isolated
        // This is a placeholder for actual sandbox execution
        // eval(code);
        output = "Sandbox simulation output: " + code;
      } else if (language === SandboxLanguage.python) {
        output = "Python sandbox simulation: " + code;
      } else if (language === SandboxLanguage.bash) {
        output = "Bash sandbox simulation: " + code;
      } else {
        output = "Unsupported language for sandbox simulation: " + language;
      }
    } catch (e: any) {
      status = AgentStatus.failed;
      error = e.message;
    }

    const end = Date.now();
    const executionTimeMs = end - start;

    return {
      id: "exec-" + Math.random().toString(36).substr(2, 9),
      agentSessionId: id,
      language,
      code,
      status,
      output,
      error,
      executionTimeMs,
      memoryUsageMb: Math.floor(Math.random() * memoryLimit),
      cpuUsagePercentage: parseFloat((Math.random() * 100).toFixed(2)),
      filesCreated,
      createdAt: new Date()
    };
  }

  // Placeholder for tool registration (tools are now in DB)
  private registerDefaultTools() {
    // Example: Seed default tools if needed
    // prisma.tool.upsert(...)
  }

  // ==========================================
  // 4. TOOL MANAGEMENT (Prisma-backed)
  // ==========================================
  public async getTools(): Promise<any[]> {
    return prisma.tool.findMany();
  }

  public async getTool(id: string): Promise<any | null> {
    return prisma.tool.findUnique({ where: { id } });
  }

  public async createTool(toolData: any): Promise<any> {
    return prisma.tool.create({ data: toolData });
  }

  public async updateTool(id: string, updates: any): Promise<any> {
    return prisma.tool.update({ where: { id }, data: updates });
  }

  public async deleteTool(id: string): Promise<any> {
    return prisma.tool.delete({ where: { id } });
  }

  // ==========================================
  // 5. MEMORY MANAGEMENT (Prisma-backed)
  // ==========================================
  // Methods already defined above

  // ==========================================
  // 6. WORKFLOW MANAGEMENT (Prisma-backed)
  // ==========================================
  // Methods already defined above

  // ==========================================
  // 7. AUTOMATION & SCHEDULING (Prisma-backed)
  // ==========================================
  // Methods already defined above

  // ==========================================
  // 8. DATA ACCESS (Prisma-backed)
  // ==========================================
  public async getUsers(): Promise<any[]> {
    return prisma.user.findMany();
  }

  public async getProjects(userId: string): Promise<any[]> {
    return prisma.project.findMany({ where: { userId } });
  }

  public async getConversations(userId: string, projectId: string): Promise<any[]> {
    return prisma.conversation.findMany({ where: { userId, projectId } });
  }

  public async getUsageLogs(userId: string): Promise<any[]> {
    return prisma.usageLog.findMany({ where: { userId } });
  }
}

export const agentPlatform = new AgentPlatform();
