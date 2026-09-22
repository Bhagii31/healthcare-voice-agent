import { DeepgramClient } from "@deepgram/sdk";
import { config } from "../utils/config";

type DeepgramSocket = Awaited<ReturnType<DeepgramClient["listen"]["v1"]["connect"]>>;

export class DeepgramStream {
  private client: DeepgramClient;
  private socket: DeepgramSocket | null = null;
  private utteranceBuffer = "";

  constructor(private readonly sampleRate: number) {
    this.client = new DeepgramClient({ apiKey: config.deepgramApiKey });
  }

  async connect(
    onSpeechStarted: () => void,
    onFinalTranscript: (text: string) => void
  ): Promise<void> {
    this.socket = await this.client.listen.v1.connect({
      model: "nova-3",
      language: "en",
      encoding: "linear16",
      sample_rate: this.sampleRate,
      channels: 1,
      punctuate: "true",
      interim_results: "true",
      vad_events: "true",
      endpointing: "300",
      Authorization: "",
    });

    let announcedSpeechStart = false;

    this.socket.on("message", (data) => {
      if (data.type === "SpeechStarted") {
        // Don't fire the barge-in signal off raw voice-activity alone — on speakers (not
        // headphones) the mic picks up the agent's own voice, and VAD alone can't tell that
        // apart from the user actually talking. Wait for the next branch instead, which only
        // fires once Deepgram has actually recognized real words.
        announcedSpeechStart = false;
        return;
      }
      if (data.type === "Results") {
        const transcript = data.channel.alternatives[0]?.transcript?.trim();
        if (transcript && !announcedSpeechStart) {
          announcedSpeechStart = true;
          onSpeechStarted();
        }
        if (data.is_final && transcript) {
          this.utteranceBuffer = this.utteranceBuffer ? `${this.utteranceBuffer} ${transcript}` : transcript;
          if (data.speech_final) {
            const finalText = this.utteranceBuffer;
            this.utteranceBuffer = "";
            announcedSpeechStart = false;
            onFinalTranscript(finalText);
          }
        }
      }
    });

    this.socket.connect();
    await this.socket.waitForOpen();
  }

  sendAudio(pcm: Buffer): void {
    this.socket?.sendMedia(pcm);
  }

  close(): void {
    this.socket?.close();
    this.socket = null;
  }
}
