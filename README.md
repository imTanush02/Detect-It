# DetectIt — AI-Powered Content Verification Tool

**DetectIt** is a full-stack web application that detects AI-generated images, videos, and text using a multi-layered analysis engine combining machine-learning models with heuristic signals.

---

## ✨ Features

| Capability | How It Works |
|---|---|
| **Image Analysis** | Sends images to HuggingFace's Google ViT classifier. Low classification confidence → higher AI probability. |
| **Video Analysis** | Extracts up to 5 frames via **ffmpeg**, runs each frame through the image analysis pipeline, and averages the scores. |
| **Text AI Detection** | Uses the **NVIDIA NIM API** (Llama 3.3 70B Instruct) as the primary ML signal, combined with local heuristics (AI-trope density, burstiness, clickbait detection). |
| **URL Scraping** | Fetches the page with Axios + Cheerio, extracts the OG image/video, and runs it through the image/video pipeline. |
| **Reverse Image Search** | Deterministic mock based on file size (placeholder for TinEye / Google Vision integration). |
| **History & Detail View** | Every analysis is persisted to MongoDB. Paginated history page and a detailed result view with per-signal breakdowns. |

---

## 📂 Folder Structure

```text
Detect-It/
├── client/                          # React Frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js             # Axios client — analyzeFile, analyzeUrl, analyzeText, fetchHistory, fetchAnalysis
│   │   ├── components/
│   │   │   ├── LoadingOverlay.jsx    # Full-screen scanner animation
│   │   │   ├── Navbar.jsx           # Top navigation bar
│   │   │   ├── ResultCard.jsx       # History list card
│   │   │   ├── ScoreGauge.jsx       # Animated circular score meter
│   │   │   ├── TextInput.jsx        # Textarea for pasting raw text
│   │   │   ├── UploadZone.jsx       # Drag-and-drop file upload
│   │   │   └── UrlInput.jsx         # URL input field
│   │   ├── pages/
│   │   │   ├── History.jsx          # Paginated list of past analyses
│   │   │   ├── Home.jsx             # Landing page with 3-tab input (Upload / URL / Text)
│   │   │   └── ResultDetail.jsx     # Detailed breakdown of a single analysis
│   │   ├── App.jsx                  # React Router setup
│   │   ├── main.jsx                 # Application entry point
│   │   └── index.css                # Global styles & animations
│   ├── index.html
│   └── tailwind.config.js
│
└── server/                          # Node.js + Express Backend
    ├── controllers/
    │   └── analysisController.js     # Orchestrates all services, computes weighted scores, saves to DB
    ├── middleware/
    │   ├── errorHandler.js          # Central error handler
    │   └── upload.js                # Multer (memory storage, 50 MB limit)
    ├── models/
    │   └── Analysis.js              # Mongoose schema (inputType, aiScore, trustScore, explanation, details)
    ├── routes/
    │   └── analysis.js              # POST /analyze/file, /analyze/url, /analyze/text — GET /history, /analysis/:id
    ├── services/
    │   ├── imageAnalysis.js         # HuggingFace ViT classification with retry logic
    │   ├── videoAnalysis.js         # ffmpeg frame extraction → per-frame image analysis
    │   ├── textAnalysis.js          # NVIDIA NIM (Llama 3.3 70B) + heuristic signals
    │   ├── reverseImageSearch.js    # Deterministic mock (TinEye placeholder)
    │   └── urlScraper.js            # Axios + Cheerio HTML scraper
    ├── .env                         # PORT, MONGO_URI, HUGGINGFACE_API_KEY, NVIDIA_API_KEY
    └── index.js                     # Express server bootstrap & MongoDB connection
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS v3, React Router v6 |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose) |
| **AI / ML** | HuggingFace Inference API (Google ViT), NVIDIA NIM API (Llama 3.3 70B Instruct) |
| **Media Processing** | ffmpeg (video frame extraction), Multer (file uploads) |
| **Web Scraping** | Axios, Cheerio |

---

## 🔌 API Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/analyze/file` | Upload an image or video for analysis (multipart/form-data) |
| `POST` | `/api/analyze/url` | Submit a URL — scrapes OG image/video and runs through the pipeline |
| `POST` | `/api/analyze/text` | Submit raw text for AI-generation detection |
| `GET` | `/api/history?page=1&limit=12` | Paginated list of all past analyses |
| `GET` | `/api/analysis/:id` | Detailed result for a single analysis |

---

## ⚙️ How the Detection Engine Works

### Image Pipeline
1. The uploaded image buffer is sent to the **Google ViT** model on HuggingFace.
2. If the top classification label has **low confidence** (< 60%), the image is flagged as likely AI-generated (score ≈ 80).
3. If the top two labels have nearly identical confidence (difference < 5%), an additional penalty is applied.
4. Includes retry logic and graceful fallback for HuggingFace free-tier timeouts.

### Video Pipeline
1. The video is written to a temp file and **ffmpeg** extracts up to 5 frames.
2. Each frame is individually sent through the image analysis pipeline.
3. The final score is the **average** of all frame scores.

### Text Pipeline
1. **NVIDIA NIM API** (Llama 3.3 70B Instruct) receives the text with a structured system prompt and returns a JSON verdict including AI probability, confidence, detection signals (repetition, burstiness, unnatural tone, generic phrasing), and reasoning.
2. **Heuristic analysis** runs in parallel — checks for AI trope phrases, clickbait words, sentence uniformity (burstiness), excessive punctuation and capitalization.
3. When NVIDIA is available, its score overrides the heuristic baseline. When unavailable, the heuristic score is used as a fallback.

### Score Calculation
The controller combines image/video and text scores using a **weighted formula**:
- If the ML model reported high confidence → 85% weight to the primary (image/video) signal.
- Otherwise → 60/40 split between the primary signal and text analysis.
- **Trust Score** = `100 − AI Score`.

---

## 🚀 How to Run Locally

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** (local instance or MongoDB Atlas URI)
- **ffmpeg** installed and in your system PATH (required for video analysis)

### Environment Variables

Create a `server/.env` file:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/detectit
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxx
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxxxxxxx
```

> **Note:** The app works without the API keys — image analysis returns a fallback score and text analysis falls back to heuristic-only mode.

### Step 1 — Start the Backend

```bash
cd server
npm install
node index.js
```
Server runs on `http://localhost:5000`.

### Step 2 — Start the Frontend

```bash
cd client
npm install
npm run dev
```
App runs on `http://localhost:3000` (proxied to the backend).

---

## 🗺️ Roadmap

- [ ] Replace the mock reverse image search with a real **TinEye** or **Google Vision** integration.
- [ ] Add user authentication and per-user analysis history.
- [ ] Deploy frontend to **Vercel** and backend to **Render**.
- [ ] Add batch analysis (analyse multiple files in one request).
- [ ] Support audio deepfake detection.
