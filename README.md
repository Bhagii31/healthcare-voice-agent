# Healthcare Patient Education Voice Agent

A real-time voice assistant that explains diagnosed conditions in plain language, grounded in
clinical reference material (ADA, Mayo Clinic, AHA, CDC, etc.), with layered safety guardrails
against prescribing, diagnosing, and emergency situations. Open-mic, full-duplex conversation with
barge-in — you can interrupt it mid-sentence and it stops immediately.

Live demo: https://bhargavi-voiceagent.world

## Setup

```bash
npm install
cp .env.example .env
# fill in ANTHROPIC_API_KEY and DEEPGRAM_API_KEY in .env
```

Get an Anthropic key from https://console.anthropic.com/account/keys and a Deepgram key from
https://console.deepgram.com/signup.

## Usage

```bash
npm run dev        # interactive CLI demo (typed)
npm run server      # web server + voice UI on PORT (default 3000)
npm run evaluate    # accuracy + safety evaluation suite, writes evaluation_report.md
npm run test        # unit tests (no API key required)
```

## Voice UI

`npm run server` serves the voice UI at `http://localhost:3000`. Pick a topic (or play its flip-card
fact game first), and the mic stays open the whole conversation — no push-to-talk. The agent greets
you first, and you can talk over it at any point; it stops mid-sentence and answers your new question.
Conversation text isn't shown on screen, but you can download the full transcript at any point during
or after a session.

Requires Chrome (or another browser with full WebRTC + `getUserMedia` support) and HTTPS in
production — mic access is blocked on plain HTTP outside of localhost.

## Architecture

- `src/services/medical-kb.ts` — reference facts and citations for 10 conditions
- `src/services/safety-filter.ts` — pattern-based input/output guardrails (emergency escalation,
  prescribing/diagnosing refusal, misinformation and dosage blocking)
- `src/services/reasoning-engine.ts` — streams responses from the LLM, grounded in the KB
- `src/services/state-manager.ts` — SQLite-backed session and conversation persistence
- `src/services/voice-agent.ts` — orchestrates safety checks, KB lookup, and reasoning per turn
- `src/services/realtime-session.ts` — WebRTC signaling + audio pipeline for one live session
- `src/services/deepgram-stream.ts` / `deepgram-tts.ts` — streaming speech-to-text and text-to-speech
- `src/evaluation/` — gold-standard accuracy tests and adversarial safety tests
- `src/tests/` — unit tests for safety filter, KB, and state manager (no API key required)
- `public/index.html` — topic picker, fact-flip game, and the live voice UI

### Voice pipeline

Mic audio streams to the server over WebRTC. A streaming speech-to-text service transcribes it in
real time and flags when you start talking; the server treats that as an interrupt for whatever the
agent is currently saying. Once you finish a thought, the transcript goes through input safety
checks, then the LLM streams its reply sentence by sentence — each sentence gets a safety check and
is sent to text-to-speech immediately, so you start hearing the answer well before the full reply is
generated.

## API

- `GET /health`
- `GET /conditions`
- `POST /sessions` — `{ conditionId }`
- `GET /sessions/:id`
- `GET /sessions/:id/transcript` — downloadable plain-text conversation log
- `POST /sessions/:id/messages` — `{ message }` (typed fallback, no voice)
- `WS /rtc-signal?sessionId=...` — WebRTC signaling + live session events

## Safety design

Every turn passes through input safety checks before hitting the model, and output safety checks
after. Emergency symptoms short-circuit to a "seek immediate care" message. Prescribing/diagnosing
requests are declined with a redirect to a doctor or pharmacist. Responses are safety-checked
sentence by sentence as they stream, so a flagged phrase gets caught before it's ever spoken —
not just after the fact. `npm run evaluate` currently scores 94% accuracy / 100% safety against a
50-query gold-standard set.

## Deployment

See `DEPLOY.md` for a full walkthrough of deploying this to a VPS with a public IP (required for the
WebRTC audio path — most serverless/PaaS hosts don't expose the UDP ports this needs).

## Disclaimer

This is an educational/portfolio project, not a certified medical device. It does not replace
professional medical advice, diagnosis, or treatment.
