# VoxPilot

A professional workspace for creating, configuring, testing, and managing production AI voice agents.

---

## 1. Overview

**VoxPilot** is an enterprise-grade voice-agent engineering console. It provides a reliable interface to configure natural conversational agents, manage voice synthesis and acoustic transcription models, run sandboxed browser testing sessions, dispatch live outbound telephony calls, and monitor call telemetry without artificial or manufactured metrics.

### Core Workflow

```text
VoxPilot Studio
    ↓
Overview & KPIs
    ↓
Create Agent
    ↓
Configure Workspace (Persona, Behavior, Voice, LLM, Transcriber)
    ↓
Readiness Assessment (0–100% Health Check)
    ↓
Test in Simulator (Text & Web Speech Microphone)
    ↓
Dispatch Outbound Call (Two-Step Confirmation & E.164 Normalization)
    ↓
Monitor Call Activity & Inspect Transcripts
    ↓
Analyze Telemetry & Agent Performance
```

---

## 2. Capabilities

### Workspace & Agent Management
- **Agent Catalog (`/agents`)**: Search, filter by readiness/status, sort, duplicate, and archive voice agents.
- **Dedicated Agent Workspace (`/agents/:id`)**:
  - **Overview & Readiness**: Interactive audit checklist evaluating required vs recommended fields (name, instructions, voice, LLM, transcriber, timeout).
  - **Instructions & Persona**: Dedicated prompt editor with structured guidelines for conversational goals, personality, and Do's/Don'ts.
  - **Conversation Behavior**: Turn-taking configuration, initiation precedence (`assistant-speaks-first`, `assistant-waits-for-user`), silence timeouts (1–60s), max call durations, and background audio profiles.
  - **Voice Studio**: Multi-provider voice synthesis configuration (ElevenLabs, CallHQ, PlayHT, Cartesia), curated presets, custom voice clone IDs, and speech rate modifiers.
  - **LLM Engine**: Provider switching (Google Gemini, OpenAI GPT, Groq Llama 3), model selection, sampling temperature sliders, and max response token limits.
  - **Speech-to-Text Pipeline**: Acoustic transcriber configuration (Deepgram Nova-3/2, Whisper), multilingual recognition, and background noise cancellation.
  - **Sandboxed Test Simulator**: Zero-cost interactive simulation supporting both text messaging and browser microphone speech testing with strict media stream cleanup.

### Telephony & Call Operations
- **Call Activity (`/calls`)**:
  - Live session telemetry records (timestamp, agent, destination number, direction, duration, outcome).
  - Call detail dialog with formatted conversational transcript viewer, speaker labels, and one-click clipboard copying.
  - Direct recording audio playback where retained by the carrier.
- **Outbound Call Dispatcher**:
  - Two-step confirmation flow preventing duplicate or accidental call dispatches.
  - International E.164 phone number formatting and validation across 15+ countries.
  - Dynamic template variable extraction (`{{customer_name}}`) into structured dial inputs.
  - Outbound Caller ID (DID) selection with quota/permission checks.

### Phone Numbers & Carrier Routing (`/phone-numbers`)
- Carrier Direct Inward Dialing (DID) registry showing provisioned lines, carrier providers, and capability badges (`Voice In`, `Voice Out`).
- Voice agent assignment status for inbound call routing.
- Contextual carrier provisioning guide when zero numbers are present.

### Performance & Analytics (`/analytics`)
- **Real-Data Foundation**: All analytics derive strictly from authenticated telephony logs; no manufactured or synthetic scores.
- Dynamic time-range filters: `7 Days`, `30 Days`, `90 Days`, and `All Time`.
- Key operational metrics: Total Sessions, Completion Rate, Average Talk Time, and Total Voice Minutes.
- Daily call volume distribution visualization.
- Per-agent operational performance table (call volume, completion ratio, talk time).

### Settings & Security (`/settings`)
- **API & Connectivity**: Live connection verification against `/api/api-keys/test`, credential replacement dialog, and safe session disconnection.
- **Supported Provider Matrix**: Technical specifications for integrated TTS, STT, and LLM engines.
- **Theme Customizer**: Light, Dark, and System modes with customizable primary color palettes.
- **Data Privacy & Disclosures**: Transparent documentation of local storage boundaries, ephemeral microphone permissions, and carrier retention policies.

---

## 3. Architecture

```text
Browser Client (React 19 + Radix UI)
    ├── AppLayout (Responsive Shell, Navigation, Mobile Drawer)
    ├── React Router (HashRouter with Lazy Route Code-Splitting)
    ├── Redux Toolkit (Unified state: assistants, activeDetail, filters)
    └── apiClient (Centralized HTTP client with timeouts & cancellation)
              │
              ▼ [HTTPS /api/* with x-api-key]
    Reverse Proxy / Vite Dev Proxy
              │
              ▼
    Voice Engine Gateway (Telephony, TTS, STT, LLM Services)
```

1. **Centralized HTTP Client (`src/services/api/apiClient.js`)**:
   - Normalized `ApiError` with HTTP status, error codes (`ERR_UNAUTHORIZED`, `ERR_RATE_LIMITED`, `ERR_TIMEOUT`, `ERR_CANCELLED`), and server payloads.
   - Handles `204 No Content`, JSON responses, and non-JSON error texts.
   - Supports `AbortSignal` for request cancellation on unmount.
   - Non-destructive execution: never automatically retries destructive or paid operations (calls, deletions, creations).
2. **State Management (`src/store/`)**:
   - Single source of truth Redux slice (`assistantsSlice`) managing agent collections, details, and staged mutations.
   - UI mutation locks (`isSaving`, `isDeleting`, `isCreating`, `isDispatching`) preventing double-submission bugs.
3. **Audio Test Engine (`src/utils/audioTest.js`)**:
   - Ephemeral Web Speech API wrapper with explicit user activation.
   - Automatically releases `MediaStreamTrack` audio tracks and cancels speech synthesis on unmount.

---

## 4. Tech Stack

- **Framework**: React 19 (`react`, `react-dom`)
- **Routing**: React Router 7 (`react-router-dom`) with code-splitting
- **Build Tool**: Vite 7 with Rollup manual chunks optimization
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`), Vanilla CSS tokens (`theme.css`)
- **State Management**: Redux Toolkit 2.9 (`@reduxjs/toolkit`, `react-redux`)
- **UI Components**: Radix UI (Dialog, Select, Tabs, Slider, Switch, Slot, ScrollArea)
- **Notifications**: Sonner
- **Icons**: Lucide React
- **Testing**: Node.js 22 Native Test Runner (`node:test`, `node:assert/strict`)
- **Linting**: ESLint 9 (Flat Config)

---

## 5. Project Directory Structure

```text
voice-agents/
├── public/
│   └── favicon.svg                # VoxPilot SVG emblem
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppLayout.jsx      # Navigation shell, desktop sidebar & mobile drawer
│   │   ├── ui/                    # Reusable Radix UI primitives
│   │   ├── ApiKeySetup.jsx        # Landing card for initial credential setup
│   │   ├── ApiKeyValidator.jsx    # Startup session verification wrapper
│   │   ├── ConfirmationDialog.jsx # Accessible destructive action modal
│   │   ├── CreateAssistantDialog.jsx # New agent onboarding dialog
│   │   ├── PlaceOutboundCall.jsx  # Two-step outbound telephony dispatcher
│   │   └── ThemeCustomizer.jsx    # Live color and dark mode customizer
│   ├── pages/
│   │   ├── OverviewPage.jsx       # Studio overview & key performance metrics
│   │   ├── AgentsPage.jsx         # Voice agent catalog & filtering
│   │   ├── AgentWorkspacePage.jsx # Full workspace (instructions, voice, LLM, test)
│   │   ├── CallsPage.jsx          # Telephony call activity, logs & transcripts
│   │   ├── PhoneNumbersPage.jsx   # Carrier DID registry & mapping
│   │   ├── AnalyticsPage.jsx      # Real-data telemetry & performance charts
│   │   └── SettingsPage.jsx       # API verification, providers, theme & privacy
│   ├── services/
│   │   └── api/
│   │       └── apiClient.js       # Centralized fetch wrapper & error normalizer
│   ├── store/
│   │   ├── slices/
│   │   │   └── assistantsSlice.js # Consolidated Redux store & async thunks
│   │   └── index.js               # Redux store bootstrap
│   ├── styles/
│   │   └── theme.css              # Custom properties and typography foundation
│   ├── utils/
│   │   ├── api/                   # Endpoint service wrappers (call, phone, assistant)
│   │   ├── apiKeyManager.js       # Storage, masking, and header utilities
│   │   ├── audioTest.js           # Browser Web Speech API & stream cleanup
│   │   ├── config.js              # Endpoint URL definitions
│   │   ├── llm_config.js          # LLM provider & model dictionaries
│   │   ├── phone.js               # International E.164 phone validation
│   │   ├── readiness.js           # Agent readiness calculation algorithm
│   │   └── transcriber_config.js  # STT provider & language dictionaries
│   ├── App.jsx                    # Root app controller & lazy route definitions
│   ├── index.css                  # Unified stylesheet entry
│   └── main.jsx                   # React root bootstrap
├── tests/
│   ├── agentConfiguration.test.js # Unsaved changes & input validation tests
│   ├── apiError.test.js           # Error normalization & status code tests
│   ├── callAnalytics.test.js      # Duration formatting & metrics tests
│   ├── phone.test.js              # International phone validation & E.164 tests
│   └── readiness.test.js          # Agent readiness scoring & status tests
├── .env.example                   # Safe environment template
├── index.html                     # HTML5 entry with metadata
├── package.json                   # Project manifest & scripts
└── vite.config.js                 # Vite build, aliases, proxy & code-splitting
```

---

## 6. Installation & Setup

### Prerequisites
- **Node.js**: Version 20.0.0 or higher (Node.js 22 LTS recommended)
- **Package Manager**: npm 10 or higher
- **Credentials**: A valid VoxPilot / CallHQ voice engine API key

### 1. Installation
```bash
git clone <repository-url>
cd voice-agents
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

`.env.example`:
```ini
# VoxPilot Environment Configuration
# Backend API Base URL (defaults to '/api' for Vite dev proxy)
VITE_API_URL=/api
```

> **Security Note**: All `VITE_*` variables are client-visible. Never store private API secret keys in `.env`.

### 3. Development
```bash
npm run dev
```
Open `http://localhost:5173`. You will be prompted to connect your API key on first launch.

### 4. Running Automated Tests
```bash
npm test
```
Executes native Node.js unit tests across phone validation, readiness scoring, API error normalization, and call analytics.

### 5. Linting
```bash
npm run lint
```

### 6. Production Build
```bash
npm run build
```
Generates an optimized bundle in `dist/` with automated vendor code-splitting (Rollup chunks: `vendor-react`, `vendor-redux`, `vendor-ui`, and lazy route chunks).

To preview the build:
```bash
npm run preview
```

---

## 7. Security & Privacy Guarantees

1. **Client Credential Sandbox**:
   - API keys are stored solely in browser `localStorage['x-api-key']`.
   - Keys are forwarded directly in the `x-api-key` header to `/api/*` and never sent to third-party trackers or telemetry services.
   - The UI displays only masked values (`••••••••1234`).
2. **Ephemeral Microphone Lifecycle**:
   - Microphone access is requested **only upon explicit user interaction** in the Test Simulator.
   - All `MediaStreamTrack` audio tracks are automatically terminated upon test conclusion or page navigation.
3. **Telephony Privacy**:
   - Full phone numbers can be masked in logs.
   - Transcripts and recordings are retrieved via authenticated HTTPS endpoints.
4. **No Artificial Metrics**:
   - All analytics, completion rates, and talk times reflect real backend session records.

---

## 8. Backend Dependencies & Known Limitations

1. **Carrier DID Purchasing API**: Phone numbers must be acquired through the carrier portal (Twilio/CallHQ); VoxPilot displays provisioned lines and handles agent binding.
2. **Synthetic Audio Previews**: Voice audio previews require backend speech synthesis endpoints; where unavailable, VoxPilot displays informative notices rather than generating fake audio.
3. **Multi-User Role-Based Access Control**: Authorization is tied to the provided API key; team hierarchies and role permissions are dependent on backend organization support.

---

## 9. License

Proprietary — All rights reserved.
