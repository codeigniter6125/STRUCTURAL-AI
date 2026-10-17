# StructuralAI — Architectural Specification & Engineering Design

## 1. System Architecture Overview

StructuralAI is a full-stack civil infrastructure audit portal built for structural engineering forensics, IS 456 / IRC 112 compliance verification, and IoT asset monitoring.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Client (React 19 SPA)                           │
│  - Strict Supabase Authentication (Session Guard & RLS)                     │
│  - Real Image Capture / Drag-and-Drop Upload                                │
│  - Responsive Dashboard, B-203 Deep Dive, Risk Matrix, Certificates         │
│  - English / Hindi (हिन्दी) Bilingual Localization                          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Relative Production Calls (/api/*)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                API Serverless Layer (Vercel Node.js / Express)              │
│                                                                             │
│  ├── POST /api/analyze                                                      │
│  │     └── Roboflow Serverless Workflow API                                 │
│  │           (kumar-ritovash/workflows/building-infrastructure-defects-logic│
│  │     └── Physics & Limit-State Calculation Engine (IS 456 / IRC 112)      │
│  │                                                                          │
│  ├── POST /api/generate-report                                              │
│  │     └── Gemini 2.5 Flash / IS 456 Deterministic Engineering Engine       │
│  │                                                                          │
│  ├── GET/POST /api/telemetry                                                │
│  │     └── IoT Sensor Telemetry Stream (Vibration, Tilt, Strain, Crack Gap) │
│  │                                                                          │
│  └── POST /api/roboflow/test                                                │
│        └── Serverless Health & Latency Verification                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
┌──────────────────────────────────────┐┌─────────────────────────────────────┐
│       Roboflow Inference Cloud       ││       Supabase Cloud Database       │
│  - Defect Segmentation & Bounding    ││  - Multi-Tenant Isolation (user_id) │
│  - Crack, Spall, Efflorescence,      ││  - Tables: profiles, buildings,     │
│    Corrosion, Exposed Rebar Classes  ││    inspections, defects, telemetry  │
└──────────────────────────────────────┘└─────────────────────────────────────┘
```

## 2. API Contract & Production Endpoints

### `POST /api/analyze`
- **Payload:** `{ image: string (base64 or URL), element: string, buildingCode?: string, locationDetails?: string }`
- **Output:** Normalized CAD coordinates (`box2d`), defect types, confidence, estimated crack width (mm), path length (mm), surface coverage (%), composite Structural Health Index (SHI 0–100), IS 456 limit state classification, and CPWD safety precautions.

### `POST /api/generate-report`
- **Payload:** `{ building: Building, inspection: Inspection, defects: Defect[], telemetry?: TelemetryRecord[] }`
- **Output:** 9-section forensic report object with markdown synthesis, load-bearing failure mode analysis, IS 456 limit state evaluation, and repair directives.

### `GET /api/telemetry`
- **Query / Body:** `{ buildingId?: string, limit?: number }`
- **Output:** Array of sensor telemetry records including triaxial accelerometers, optical tell-tales, strain gauges, and inclinometers.

### `POST /api/roboflow/test`
- **Output:** Connectivity diagnostic showing workflow availability, latency (ms), and HTTP status.

## 3. Environment & Security Boundaries
- Secrets (`ROBOFLOW_API_KEY`, `GEMINI_API_KEY`) reside exclusively in server-side environment variables and are never bundled into client assets.
- Supabase anonymous keys (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are utilized with Row Level Security (RLS) policies enforcing multi-tenant isolation.
