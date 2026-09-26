"use client";

import { useMemo, useState } from "react";
import { ReactFlow, Background, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { AgentFramework, AgentRun, AgentSpec } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const frameworks: AgentFramework[] = ["default", "lyzr", "langgraph", "crewai", "openai-agents", "gitagent"];

export function AgentBoard({
  agents,
  runs,
  onSave,
  onTest,
}: {
  agents: AgentSpec[];
  runs: AgentRun[];
  onSave: (agent: AgentSpec) => Promise<void>;
  onTest: (agent: AgentSpec, input: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState<AgentSpec | null>(null);
  const [draft, setDraft] = useState("");
  const [testInput, setTestInput] = useState("Say hello with sample data");
  const nodes = useMemo<Node[]>(
    () =>
      agents.map((agent) => ({
        id: agent.id,
        position: agent.position,
        data: { label: `${agent.name}${agent.testPassed ? " · Test passed" : ""}` },
        style: {
          border: "1px solid #e3e6ec",
          borderRadius: 10,
          padding: 8,
          background: agent.managedBy ? "#ffffff" : "#eef0ff",
          fontSize: 13,
        },
      })),
    [agents],
  );
  const edges = useMemo<Edge[]>(
    () =>
      agents
        .filter((agent) => agent.managedBy)
        .map((agent) => {
          const manager = agents.find((item) => item.name === agent.managedBy);
          return manager ? { id: `${manager.id}-${agent.id}`, source: manager.id, target: agent.id } : null;
        })
        .filter((edge): edge is Edge => Boolean(edge)),
    [agents],
  );

  if (agents.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-md border border-dashed border-border p-8 text-center">
        <h2 className="text-base font-medium">Agents are designed after you approve the plan</h2>
        <p className="mt-2 text-sm text-text-muted">The agent graph, tools and instructions show up in this tab.</p>
      </div>
    );
  }

  const agentRuns = selected ? runs.filter((run) => run.agentName === selected.name) : [];

  return (
    <div className="relative h-[420px] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        onNodeClick={(_, node) => {
          const agent = agents.find((item) => item.id === node.id) ?? null;
          setSelected(agent);
          setDraft(agent?.instructions ?? "");
        }}
      >
        <Background />
      </ReactFlow>
      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent>
          {selected ? (
            <Tabs defaultValue="overview">
              <DialogTitle className="sr-only">{selected.name}</DialogTitle>
              <TabsList className="h-auto flex-wrap gap-1 py-2">
                {["Overview", "Instructions", "Tools", "Knowledge", "Framework", "Test", "Runs"].map((tab) => (
                  <TabsTrigger key={tab} value={tab.toLowerCase()}>
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="overview" className="p-1">
                <h2 className="text-lg font-medium">{selected.name}</h2>
                <p className="mt-2 text-sm text-text-muted">{selected.role}</p>
                <p className="mt-2 font-mono text-xs">{selected.model}</p>
              </TabsContent>
              <TabsContent value="instructions" className="p-1">
                <textarea className="h-40 w-full rounded-sm border border-border p-2 text-sm" value={draft} onChange={(event) => setDraft(event.target.value)} />
                <Button
                  type="button"
                  className="mt-2"
                  variant="outline"
                  onClick={() => void onSave({ ...selected, instructions: draft })}
                >
                  Save instructions
                </Button>
              </TabsContent>
              <TabsContent value="tools" className="p-1 text-sm">
                {selected.tools.map((tool) => (
                  <p key={tool}>{tool === "Sample data" ? "Sample data" : tool}</p>
                ))}
              </TabsContent>
              <TabsContent value="knowledge" className="p-1 text-sm text-text-muted">
                No knowledge files yet.
              </TabsContent>
              <TabsContent value="framework" className="p-1">
                <label className="text-sm">
                  Framework
                  <select
                    className="mt-1 h-9 w-full rounded-sm border border-border px-2"
                    value={selected.framework}
                    onChange={(event) => {
                      const framework = event.target.value as AgentFramework;
                      const next = { ...selected, framework };
                      setSelected(next);
                      void onSave(next);
                    }}
                  >
                    {frameworks.map((framework) => (
                      <option key={framework} value={framework}>
                        {framework}
                      </option>
                    ))}
                  </select>
                </label>
              </TabsContent>
              <TabsContent value="test" className="p-1">
                <textarea className="h-20 w-full rounded-sm border border-border p-2 text-sm" value={testInput} onChange={(event) => setTestInput(event.target.value)} />
                <Button type="button" variant="outline" className="mt-2" onClick={() => void onTest(selected, testInput)}>
                  Run test
                </Button>
                {agentRuns[0] ? (
                  <div className="mt-3 text-sm">
                    <p className="font-medium">Test passed</p>
                    <p className="text-text-muted">{agentRuns[0].output}</p>
                    <ul className="mt-2 space-y-1 font-mono text-xs">
                      {agentRuns[0].steps.map((step, index) => (
                        <li key={`${step.agent}-${index}`}>
                          {step.agent}
                          {step.tool ? ` · ${step.tool}` : ""} · {step.ms}ms
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </TabsContent>
              <TabsContent value="runs" className="p-1 text-sm">
                {agentRuns.length === 0 ? <p className="text-text-muted">No runs yet.</p> : null}
                {agentRuns.map((run) => (
                  <p key={run.id}>{run.output}</p>
                ))}
              </TabsContent>
            </Tabs>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
