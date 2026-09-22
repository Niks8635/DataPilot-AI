# DataPilot AI — AI Data Analyst Platform

> **"Your data. Your questions. AI-powered answers."**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FNiks8635%2FDataPilot-AI&root-directory=frontend)

DataPilot AI is an enterprise-grade, end-to-end automated data analytics SaaS platform. It automates the full workflow of a professional data analyst:
`UPLOAD → UNDERSTAND → PROFILE → CLEAN → ANALYZE → FIND INSIGHTS → VISUALIZE → BUILD DASHBOARD → ASK QUESTIONS → GENERATE REPORT`

---

## 🌟 Key Capabilities

1. **Multi-Format Ingestion**: Supports `.csv`, `.xlsx`, `.xls`, `.json`, and `.parquet` with automatic encoding detection and delimiter sniffing.
2. **Spreadsheet Preview Engine**: Virtualized, sortable, searchable, filterable grid with per-column data types and null badges. Original data is permanently immutable.
3. **Data Profiling Engine**: In-depth statistics (mean, median, mode, std, quartiles, IQR, skewness, kurtosis, cardinality, mode, and date spans).
4. **Data Quality Engine**: Calibrated 0–100 Quality Score evaluating structural health, completeness, uniqueness, consistency, and outliers.
5. **Interactive Data Cleaning Engine**: Suggests smart actions (duplicate removal, median/mode imputation, whitespace trimming, outlier clipping) with an audit trail and immutable versioning.
6. **Exploratory Data Analysis (EDA)**: Automatic bivariate breakdowns, chronological trends, distributions, and Pearson correlation matrices.
7. **Automated Interactive Dashboards**: Tailors KPI cards (Total Volume, Financial Driver, Quality Rating) and auto-recommends charts (Line, Bar, Donut, Scatter).
8. **Conversational "Ask Your Data"**: Natural language questions translated into safe, sandboxed Pandas operations with tabular outputs and auto-rendered charts.
9. **AST Zero-Trust Sandbox**: Prohibits filesystem access, system commands, arbitrary imports, network sockets, or OS primitives with strict 5s timeouts.
10. **Executive Report Generator**: Boardroom-ready briefs with print-to-PDF layout and CSV/Excel data export.
11. **Multi-Dataset Relationships**: Automatic detection of shared keys and foreign key join opportunities.
12. **Pre-Bundled Demo Dataset**: One-click exploration with a realistic 600-row global sales dataset.

---

## 🏗️ Architecture

DataPilot AI follows a modern, decoupled monorepo architecture:

```
DataPilot AI/
├── frontend/                     # Next.js 14/16 App Router, React, TypeScript, Tailwind CSS
│   ├── app/                      # App router pages (dashboard, datasets, dashboards, ask-data, reports)
│   ├── components/               # Recharts DynamicChart, DataGrid, Profiler, CleanerModal
│   ├── lib/                      # API client, utilities, formatters
│   └── types/                    # TypeScript interfaces matching backend models
├── backend/                      # Python FastAPI, Pydantic v2, SQLAlchemy
│   ├── app/
│   │   ├── api/v1/               # Clean REST endpoints (/datasets, /analysis, /ask-data, etc.)
│   │   ├── analysis/             # Profiler, Quality Engine, Statistics, EDA, Relationships
│   │   ├── cleaning/             # Suggested cleaning engine & audit trail
│   │   ├── sandbox/              # AST-validated Python/Pandas execution sandbox
│   │   ├── ai/                   # Multi-provider LLM abstraction (Gemini, OpenAI, Anthropic, Rules)
│   │   └── reports/              # Executive HTML/PDF report builder
│   └── tests/                    # Pytest suite for analysis, cleaning, and security sandbox
├── docker-compose.yml            # Containerized setup (PostgreSQL, Backend, Frontend)
└── .env.example                  # Documented environment variables
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.11)
- **Node.js**: 18+ (tested on Node 20 & 24)
- **npm** or **pnpm**

---

### Step 1: Backend Setup

```bash
# Navigate to backend
cd backend

# (Optional) Create and activate a virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server (Default: SQLite zero-config local storage)
uvicorn app.main:app --reload --port 8000
```

Backend will be online at: `http://localhost:8000`
Interactive Swagger Documentation: `http://localhost:8000/docs`

---

### Step 2: Frontend Setup

```bash
# Navigate to frontend (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

Frontend will be online at: `http://localhost:3000`

---

### Step 3: Run with Docker Compose

To run the complete production stack (PostgreSQL + Backend + Frontend):

```bash
docker-compose up --build
```

---

## 🔑 Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./datapilot.db` or PostgreSQL |
| `SECRET_KEY` | JWT encryption secret | `your-secure-secret-key-32chars` |
| `AI_PROVIDER` | LLM provider (`auto`, `gemini`, `openai`, `anthropic`) | `auto` |
| `GEMINI_API_KEY` | Google Gemini Flash API Key | `AIzaSy...` |
| `OPENAI_API_KEY` | OpenAI API Key | `sk-...` |
| `ANTHROPIC_API_KEY` | Anthropic Claude API Key | `sk-ant-...` |
| `SUPABASE_URL` | Supabase Project URL (Optional) | `https://xyz.supabase.co` |
| `SUPABASE_KEY` | Supabase Anon Key (Optional) | `your-anon-key` |
| `NEXT_PUBLIC_API_URL`| Frontend API destination | `http://localhost:8000/api/v1` |

> [!NOTE]
> If no AI API key is provided, DataPilot AI automatically switches to its deterministic analytical narrative engine. The platform runs with full functionality without requiring an API key.

---

## 🧪 Running Tests

Verify the analytical algorithms, duplicate detection, profiling, and AST execution security sandbox:

```bash
cd backend
$env:PYTHONPATH="."
pytest tests/ -v
```

---

## 🚢 Production Deployment

### Frontend (Vercel)
1. Push your repository to GitHub.
2. Import the `frontend` folder into [Vercel](https://vercel.com).
3. Set Environment Variable: `NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api/v1`.
4. Deploy!

### Backend (Render / Railway / Fly.io)
1. Connect repository and select the `backend` folder as root directory.
2. Build Command: `pip install -r requirements.txt`.
3. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Add environment variables: `DATABASE_URL`, `SECRET_KEY`, `AI_PROVIDER`, etc.

### Database (Supabase / PostgreSQL)
1. In Supabase, create a new project.
2. Go to **Project Settings** → **Database** → **Connection String** (URI).
3. Set `DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`.
4. Tables and schemas are automatically created on startup by SQLAlchemy.

---

## 🛡️ Security & Zero-Trust Sandbox

- **AST Validation**: Code execution parses candidate Python AST trees. Nodes like `Import`, `ImportFrom`, `Global`, and calls to `open`, `eval`, `exec`, `os`, `sys`, `subprocess`, `requests` are blocked before execution.
- **Resource Constraints**: Queries run in an isolated ThreadPool worker with a 5-second hard timeout.
- **Tenant Isolation**: Users only access datasets, dashboards, and reports associated with their account.
- **Data Immutability**: Uploaded raw datasets are stored with read-only integrity. Cleaning operations generate new versions with an audit trail.

---

## 📄 License
MIT License. Built for data analysts, business intelligence teams, and modern decision-makers.
