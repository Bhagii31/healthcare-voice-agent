import type { WebSocket as WSWebSocket } from "ws";
import { RTCPeerConnection } from "werift";
import OpusScript = require("opusscript");
import { VoiceAgent } from "./voice-agent";
import { DeepgramStream } from "./deepgram-stream";
import { DeepgramTts } from "./deepgram-tts";
import { logger } from "../utils/logger";
import { config } from "../utils/config";

const OPUS_SAMPLE_RATE = 48000;
const OPUS_CHANNELS = 1;
const TTS_SAMPLE_RATE = 24000;

type ClientMessage =
  | { type: "offer"; sdp: string }
  | { type: "ice"; candidate: unknown };

function stripForSpeech(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^#+\s*/gm, "")
    .replace(/`/g, "")
    .trim();
}

function createPeerConnection(): RTCPeerConnection {
  if (!config.publicIp) {
    // Local dev: default host-candidate behavior already works fine on one machine.
    return new RTCPeerConnection();
  }
  return new RTCPeerConnection({
    iceLite: true,
    iceAdditionalHostAddresses: [config.publicIp],
    icePortRange: config.icePortMin && config.icePortMax ? [config.icePortMin, config.icePortMax] : undefined,
  });
}

export function handleRealtimeConnection(ws: WSWebSocket, sessionId: string, agent: VoiceAgent): void {
  const pc = createPeerConnection();
  const deepgramStt = new DeepgramStream(OPUS_SAMPLE_RATE);
  const deepgramTts = new DeepgramTts(TTS_SAMPLE_RATE);
  const decoder = new OpusScript(OPUS_SAMPLE_RATE, OPUS_CHANNELS, OpusScript.Application.VOIP);

  // Bumped on every new user turn AND every detected barge-in. A turn keeps emitting events
  // only while its generation is still the current one — this is what makes an interrupt
  // immediate: we don't need to cancel the in-flight LLM call, we just stop forwarding its
  // output the instant a newer generation exists.
  let generation = 0;

  const send = (payload: unknown) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
  };
  const sendAudio = (pcm: Buffer) => {
    if (ws.readyState === ws.OPEN) ws.send(pcm);
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) send({ type: "ice", candidate: event.candidate });
  };

  pc.ontrack = (event) => {
    const track = event.track;
    if (track.kind !== "audio") return;
    track.onReceiveRtp.subscribe((rtp) => {
      try {
        const pcm = decoder.decode(rtp.payload);
        deepgramStt.sendAudio(pcm);
      } catch (err) {
        logger.error("Failed to decode incoming audio frame", { error: (err as Error).message });
      }
    });
  };

  async function runTurn(transcript: string) {
    if (!transcript.trim()) return;
    const myGen = ++generation;
    send({ type: "user_transcript", text: transcript });
    try {
      for await (const event of agent.askStream(sessionId, transcript)) {
        if (myGen !== generation) return;
        send(event);
        if (event.type === "chunk") {
          deepgramTts.speak(stripForSpeech(event.text));
        } else if (event.type === "done" && event.response.citations.length === 0 && event.response.confidence <= 0.5) {
          // Safety-redirect / emergency / prescribing-decline responses skip the chunk stream
          // entirely, so speak the full redirect text directly.
          deepgramTts.speak(stripForSpeech(event.response.text));
        }
      }
    } catch (err) {
      logger.error("Failed to generate realtime response", { error: (err as Error).message });
      if (myGen === generation) send({ type: "error", message: "Failed to generate response" });
    }
  }

  deepgramTts
    .connect((pcm) => sendAudio(pcm))
    .then(() => {
      const myGen = ++generation;
      const greeting = agent.greet(sessionId);
      if (myGen !== generation) return;
      send({ type: "chunk", text: greeting.text });
      deepgramTts.speak(stripForSpeech(greeting.text));
      send({ type: "done", response: greeting });
    })
    .catch((err) => {
      logger.error("Failed to connect to Deepgram TTS", { error: (err as Error).message });
    });

  deepgramStt
    .connect(
      () => {
        // A new generation immediately invalidates whatever turn is currently streaming,
        // which is what makes this a real interrupt rather than a queued one.
        generation++;
        deepgramTts.clear();
        send({ type: "user_speech_started" });
      },
      (transcript) => {
        void runTurn(transcript);
      }
    )
    .catch((err) => {
      logger.error("Failed to connect to Deepgram STT", { error: (err as Error).message });
      send({ type: "error", message: "Speech recognition unavailable" });
    });

  ws.on("message", async (raw) => {
    let message: ClientMessage;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (message.type === "offer") {
      await pc.setRemoteDescription({ type: "offer", sdp: message.sdp });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      send({ type: "answer", sdp: pc.localDescription?.sdp });
    } else if (message.type === "ice" && message.candidate) {
      try {
        await pc.addIceCandidate(message.candidate as never);
      } catch (err) {
        logger.error("Failed to add ICE candidate", { error: (err as Error).message });
      }
    }
  });

  ws.on("close", () => {
    generation++;
    decoder.delete();
    deepgramStt.close();
    deepgramTts.close();
    pc.close();
  });
}
