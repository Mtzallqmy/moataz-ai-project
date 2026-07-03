import { agentPlatform } from "./platform";

export interface TestResult {
  suite: string;
  testName: string;
  status: "PASSED" | "FAILED";
  error?: string;
  durationMs: number;
}

export class AgentPlatformTests {
  public static async runAll(): Promise<TestResult[]> {
    console.log("[Test Suite] Booting validation suites for Agent OS...");
    const results: TestResult[] = [];

    // 1. Agent Suite
    results.push(await this.runTest("Agents", "Registry Seeding", async () => {
      const agents = agentPlatform.getAgents();
      if (agents.length < 10) throw new Error(`Seeded agents missing. Found ${agents.length}`);
      const planner = agentPlatform.getAgent("agt-planner");
      if (!planner || planner.name !== "Planner Agent") throw new Error("Planner agent seed mismatch");
    }));

    // 2. Sandbox Suite
    results.push(await this.runTest("Sandbox", "Javascript Eval", async () => {
      const res = await agentPlatform.executeInSandbox("t1", "javascript", "console.log('Sandbox success!');");
      if (res.status !== "success" || !res.output.includes("Sandbox success")) {
        throw new Error(`Execution failed. Status: ${res.status}, Output: ${res.output}`);
      }
    }));

    results.push(await this.runTest("Sandbox", "Python Perm Restrictions", async () => {
      const res = await agentPlatform.executeInSandbox("t2", "python", "import os\nos.system('rm -rf /')");
      if (res.status !== "error" || !res.error?.includes("PermissionError")) {
        throw new Error(`Permission check bypassed: ${res.status}`);
      }
    }));

    // 3. Tool Suite
    results.push(await this.runTest("Tools", "Web Search Execution", async () => {
      const res = await agentPlatform.runTool("web_search", { query: "Express API" });
      if (!Array.isArray(res) || res.length === 0) throw new Error("Search tool failed returning arrays.");
    }));

    results.push(await this.runTest("Tools", "Document Extractor OCR", async () => {
      const res = await agentPlatform.runTool("doc_ai_extractor", { filePath: "sample.pdf", enableOcr: true });
      if (!res.metadata || !res.ocrRecognizedText) throw new Error("Document extractor output invalid.");
    }));

    // 4. Memory Suite
    results.push(await this.runTest("Memory", "Insertion & Semantic Search", async () => {
      agentPlatform.addMemory({
        userId: "usr-admin",
        projectId: "proj-admin-1",
        type: "project",
        content: "Deployment parameters have been customized for Gemini 3.5 routing logs.",
        metadata: {},
        relevanceScore: 0,
        expiresAt: null
      });

      const matches = agentPlatform.queryMemorySemantic("proj-admin-1", "Gemini routing");
      if (matches.length === 0 || matches[0].relevanceScore === 0) {
        throw new Error("Semantic query score calculation failed.");
      }
    }));

    // 5. MCP Suite
    results.push(await this.runTest("MCP", "Discovery protocol", async () => {
      const conns = agentPlatform.getMcpConnections();
      if (conns.length === 0) throw new Error("MCP connection lists empty");
      const tools = agentPlatform.getMcpDiscoveryTools("mcp-github");
      if (tools.length === 0) throw new Error("MCP Tools discovery failed.");
    }));

    // 6. Workflow Suite
    results.push(await this.runTest("Workflows", "DAG Builder & Simulation", async () => {
      const wf = agentPlatform.createWorkflow({
        id: "wf-test-1",
        name: "Test Planning",
        description: "Executes sample sequence tools",
        userId: "usr-admin",
        projectId: "proj-admin-1",
        nodes: [
          {
            id: "node-1",
            name: "Search Docs",
            type: "tool_call",
            toolId: "web_search",
            config: { args: { query: "TypeScript types" } },
            nextNodes: ["node-2"]
          },
          {
            id: "node-2",
            name: "Audit Output",
            type: "agent_task",
            agentId: "agt-reviewer",
            config: { prompt: "Verify TypeScript structure output" },
            nextNodes: []
          }
        ],
        triggers: []
      });

      const run = await agentPlatform.startWorkflowRun(wf.id);
      if (!run || run.status !== "running") throw new Error("Workflow failed to transition status to running.");
    }));

    console.log(`[Test Suite] Validation finished. ${results.filter(r => r.status === "PASSED").length}/${results.length} PASSED.`);
    return results;
  }

  private static async runTest(suite: string, name: string, fn: () => Promise<void>): Promise<TestResult> {
    const start = Date.now();
    try {
      await fn();
      return {
        suite,
        testName: name,
        status: "PASSED",
        durationMs: Date.now() - start
      };
    } catch (e: any) {
      return {
        suite,
        testName: name,
        status: "FAILED",
        error: e.message || String(e),
        durationMs: Date.now() - start
      };
    }
  }
}
