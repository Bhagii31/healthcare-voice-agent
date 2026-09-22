import path from "path";
import http from "http";
import { URL } from "url";
import express, { Request, Response } from "express";
import { WebSocketServer } from "ws";
import { assertApiKey, config } from "./utils/config";
import { MEDICAL_KB } from "./services/medical-kb";
import { VoiceAgent } from "./services/voice-agent";
import { handleRealtimeConnection } from "./services/realtime-session";
import { logger } from "./utils/logger";

assertApiKey();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const agent = new VoiceAgent();

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

const CONDITION_ICONS: Record<string, string> = {
  "type2-diabetes": "🩸",
  hypertension: "💓",
  asthma: "🌬️",
  copd: "🫁",
  cad: "🫀",
  anxiety: "🌊",
  depression: "🌤️",
  arthritis: "🦴",
  gerd: "🔥",
  "sleep-apnea": "😴",
};

app.get("/conditions", (_req: Request, res: Response) => {
  res.json(
    MEDICAL_KB.map((c) => ({
      id: c.id,
      name: c.name,
      overview: c.overview,
      icon: CONDITION_ICONS[c.id] ?? "🩺",
      facts: c.facts.map((f) => ({
        question: f.question,
        answer: f.answer,
        sources: f.citations.map((cit) => cit.source),
      })),
    }))
  );
});

app.post("/sessions", (req: Request, res: Response) => {
  const { conditionId } = req.body as { conditionId?: string };
  if (!conditionId) {
    res.status(400).json({ error: "conditionId is required" });
    return;
  }
  try {
    const session = agent.startSession(conditionId);
    res.status(201).json(session);
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

app.get("/sessions/:id", (req: Request<{ id: string }>, res: Response) => {
  const session = agent.getSession(req.params.id);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(session);
});

app.get("/sessions/:id/transcript", (req: Request<{ id: string }>, res: Response) => {
  const session = agent.getSession(req.params.id);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const condition = MEDICAL_KB.find((c) => c.id === session.conditionId);
  const header = [
    `Conversation about: ${condition?.name ?? session.conditionId}`,
    `Date: ${new Date(session.createdAt).toLocaleString()}`,
    "=".repeat(40),
    "",
  ].join("\n");
  const body = session.turns
    .map((t) => `${t.role === "user" ? "You" : "Agent"}: ${t.content}`)
    .join("\n\n");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="conversation-${session.id}.txt"`);
  res.send(header + body);
});

app.post("/sessions/:id/messages", async (req: Request<{ id: string }>, res: Response) => {
  const { message } = req.body as { message?: string };
  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }
  try {
    const response = await agent.ask(req.params.id, message);
    res.json(response);
  } catch (err) {
    logger.error("Failed to generate response", { error: (err as Error).message });
    res.status(500).json({ error: "Failed to generate response" });
  }
});

app.post("/sessions/:id/messages/stream", async (req: Request<{ id: string }>, res: Response) => {
  const { message } = req.body as { message?: string };
  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }
  res.writeHead(200, {
    "Content-Type": "application/x-ndjson",
    "Cache-Control": "no-cache",
  });
  try {
    for await (const event of agent.askStream(req.params.id, message)) {
      res.write(`${JSON.stringify(event)}\n`);
    }
  } catch (err) {
    logger.error("Failed to stream response", { error: (err as Error).message });
    res.write(`${JSON.stringify({ type: "error", message: "Failed to generate response" })}\n`);
  } finally {
    res.end();
  }
});

const httpServer = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

httpServer.on("upgrade", (req, socket, head) => {
  const { pathname, searchParams } = new URL(req.url ?? "", "http://localhost");
  if (pathname !== "/rtc-signal") {
    socket.destroy();
    return;
  }
  const sessionId = searchParams.get("sessionId");
  if (!sessionId || !agent.getSession(sessionId)) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    handleRealtimeConnection(ws, sessionId, agent);
  });
});

httpServer.listen(config.port, () => {
  logger.info(`Healthcare voice agent listening on http://localhost:${config.port}`);
});
