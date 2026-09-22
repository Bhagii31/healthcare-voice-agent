import { DeepgramClient } from "@deepgram/sdk";
import { config } from "../utils/config";
import { logger } from "../utils/logger";

type DeepgramTtsSocket = Awaited<ReturnType<DeepgramClient["speak"]["v1"]["connect"]>>;

export class DeepgramTts {
  private client: DeepgramClient;
  private socket: DeepgramTtsSocket | null = null;

  constructor(private readonly sampleRate: number) {
    this.client = new DeepgramClient({ apiKey: config.deepgramApiKey });
  }

  async connect(onAudio: (pcm: Buffer) => void): Promise<void> {
    this.socket = await this.client.speak.v1.connect({
      model: "aura-2-thalia-en",
      encoding: "linear16",
      sample_rate: String(this.sampleRate),
      Authorization: "",
    });

    this.socket.on("message", (data) => {
      // The SDK delivers audio frames as a Blob (its cross-platform binary wrapper) even in
      // Node, not a Buffer/ArrayBuffer, so that's what actually needs checking here.
      if (data instanceof Blob) {
        data
          .arrayBuffer()
          .then((buf) => onAudio(Buffer.from(buf)))
          .catch((err) => logger.error("Failed to read TTS audio blob", { error: (err as Error).message }));
      } else if (data instanceof ArrayBuffer) {
        onAudio(Buffer.from(data));
      } else if (ArrayBuffer.isView(data)) {
        onAudio(Buffer.from(data.buffer, data.byteOffset, data.byteLength));
      } else if (Buffer.isBuffer(data)) {
        onAudio(data);
      }
    });

    this.socket.connect();
    await this.socket.waitForOpen();
  }

  speak(text: string): void {
    if (!text.trim()) return;
    this.socket?.sendText({ type: "Speak", text });
    this.socket?.sendFlush({ type: "Flush" });
  }

  clear(): void {
    this.socket?.sendClear({ type: "Clear" });
  }

  close(): void {
    this.socket?.close();
    this.socket = null;
  }
}
