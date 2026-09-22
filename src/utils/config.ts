import "dotenv/config";

export const config = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  port: parseInt(process.env.PORT ?? "3000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
  dbPath: process.env.DB_PATH ?? "voice_agent.db",
  deepgramApiKey: process.env.DEEPGRAM_API_KEY ?? "",
  // set in production so ICE advertises a reachable address; leave unset locally
  publicIp: process.env.PUBLIC_IP ?? "",
  icePortMin: process.env.ICE_PORT_MIN ? parseInt(process.env.ICE_PORT_MIN, 10) : undefined,
  icePortMax: process.env.ICE_PORT_MAX ? parseInt(process.env.ICE_PORT_MAX, 10) : undefined,
};

export function assertApiKey(): void {
  if (!config.anthropicApiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key."
    );
  }
}
