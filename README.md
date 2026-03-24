# DetectIt — AI-Powered Content Verification Tool

A full-stack MVP for detecting AI-generated images, videos, and web content. Upload files or paste URLs, and get an instant AI probability score with detailed analysis.

## Tech Stack

| Layer        | Technology                              |
| ------------ | --------------------------------------- |
| Frontend     | React 18 + Vite + Tailwind CSS         |
| Backend      | Node.js + Express                       |
| Database     | MongoDB + Mongoose                      |
| File Upload  | Multer (memory storage)                 |
| URL Scraping | Axios + Cheerio                         |
| AI Analysis  | Mock services (pluggable for real APIs) |

## Folder Structure

```
Detect-It/
├── client/                  # React frontend
│   ├── src/
│   │   ├── api/             # Axios API layer
│   │   ├── components/      # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── UploadZone.jsx
│   │   │   ├── UrlInput.jsx
│   │   │   ├── ScoreGauge.jsx
│   │   │   ├── ResultCard.jsx
│   │   │   └── LoadingOverlay.jsx
│   │   ├── pages/           # Route pages
│   │   │   ├── Home.jsx
│   │   │   ├── History.jsx
│   │   │   └── ResultDetail.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── server/                  # Express backend
    ├── controllers/         # Request handlers
    │   └── analysisController.js
    ├── middleware/           # Express middleware
    │   ├── upload.js
    │   └── errorHandler.js
    ├── models/              # Mongoose schemas
    │   └── Analysis.js
    ├── routes/              # API routes
    │   └── analysis.js
    ├── services/            # Analysis engines (mock)
    │   ├── imageAnalysis.js
    │   ├── textAnalysis.js
    │   ├── urlScraper.js
    │   └── reverseImageSearch.js
    └── index.js             # Entry point
```

## API Routes

| Method | Endpoint            | Description                       |
| ------ | ------------------- | --------------------------------- |
| POST   | `/api/analyze/file` | Upload image/video for analysis   |
| POST   | `/api/analyze/url`  | Submit URL for scraping & scoring |
| GET    | `/api/history`      | Paginated analysis history        |
| GET    | `/api/analysis/:id` | Single analysis details           |

## Sample API Response

```json
{
  "_id": "6600abc123...",
  "inputType": "image",
  "inputSource": "photo.jpg",
  "aiScore": 72,
  "trustScore": 28,
  "explanation": "This content shows MODERATE indicators of AI generation. Image analysis flags: GAN artifacts detected; Unusual texture patterns.",
  "details": {
    "imageAnalysis": {
      "provider": "MockVision",
      "aiProbability": 78.42,
      "confidence": 0.91,
      "flags": ["GAN artifacts detected", "Unusual texture patterns"]
    },
    "reverseSearch": {
      "provider": "MockReverseSearch",
      "totalMatches": 3,
      "hasExactMatch": false,
      "sources": [{ "domain": "unsplash.com", "similarity": 0.87 }]
    }
  },
  "createdAt": "2026-03-24T06:00:00.000Z"
}
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally (or a connection string)

### 1. Setup environment

```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB connection string
```

### 2. Install & run backend

```bash
cd server
npm install
npm run dev
```

### 3. Install & run frontend

```bash
cd client
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and proxies API calls to the backend on port `5000`.

## Environment Variables

| Variable     | Default                             | Description         |
| ------------ | ----------------------------------- | ------------------- |
| `MONGO_URI`  | `mongodb://localhost:27017/detectit` | MongoDB connection  |
| `PORT`       | `5000`                              | Backend server port |

## Features

- 🎯 Upload images/videos with drag-and-drop
- 🔗 Paste URLs for content scraping & analysis
- 📊 Animated AI Probability & Trust Score gauges
- 📝 Detailed explanation with flags per analysis layer
- 📜 Paginated history dashboard
- 🌙 Dark-mode glassmorphism UI
- ⚡ Loading animations during analysis
- ❌ Comprehensive error handling
