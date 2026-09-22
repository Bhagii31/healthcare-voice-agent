# Healthcare Patient Education Voice Agent

A patient education assistant that explains diagnosed conditions in plain language, grounded in
clinical reference material (ADA, Mayo Clinic, AHA, CDC, etc.), with multi-layer safety guardrails
against prescribing, diagnosing, and emergency situations.

## Setup

```bash
npm install
cp .env.example .env
# add your Anthropic API key to .env
```

Get an API key from https://console.anthropic.com/account/keys.

## Usage

```bash
npm run dev        # interactive CLI demo (typed)
npm run server      # Express API + voice web UI on PORT (default 3000)
npm run evaluate    # accuracy + safety evaluation suite, writes evaluation_report.md
npm run test        # unit tests (no API key required)
```

## Voice UI

`npm run server` also serves a browser voice UI at `http://localhost:3000`. It uses the browser's
built-in Web Speech API — `SpeechRecognition` for mic input (speech-to-text) and
`speechSynthesis` for spoken replies (text-to-speech) — so there's no extra API key or per-request
cost for voice. Works in Chrome; Safari/Firefox have limited `SpeechRecognition` support. Pick a
condition, tap the mic, ask a question out loud, and the agent speaks its answer back while
showing the transcript and safety/citation metrics.

## Architecture

- `src/services/medical-kb.ts` — reference facts and citations for 10 conditions
- `src/services/safety-filter.ts` — pattern-based input/output guardrails (emergency escalation,
  prescribing/diagnosing refusal, misinformation and dosage blocking)
- `src/services/reasoning-engine.ts` — wraps the Anthropic Messages API, grounds responses in the KB
- `src/services/state-manager.ts` — SQLite-backed session and conversation persistence
- `src/services/voice-agent.ts` — orchestrates safety checks, KB lookup, and reasoning per turn
- `src/evaluation/` — gold-standard accuracy tests and adversarial safety tests
- `src/tests/` — unit tests for safety filter, KB, and state manager (no API key required)
- `public/index.html` — browser voice UI (mic input + spoken replies), served by `src/server.ts`

## API

- `GET /health`
- `GET /conditions`
- `POST /sessions` — `{ conditionId }`
- `GET /sessions/:id`
- `POST /sessions/:id/messages` — `{ message }`

## Safety design

Every turn passes through input safety checks before hitting the model, and output safety checks
after. Emergency symptoms short-circuit to a "seek immediate care" message. Prescribing/diagnosing
requests are declined with a redirect to a doctor or pharmacist. Model responses are additionally
scanned for dosage instructions and known misinformation patterns before being returned.

## Disclaimer

This is an educational/portfolio project, not a certified medical device. It does not replace
professional medical advice, diagnosis, or treatment.
