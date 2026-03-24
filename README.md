# DetectIt — AI-Powered Content Verification Tool (MVP Report)

Welcome to **DetectIt**, a full-stack MVP designed to detect AI-generated images, videos, and web content. 

This document serves as a complete report of the **current condition** of the application, how it functions internally, its folder structure, and how to run it.

---

## 🏗️ 1. Current Condition & State of the App

**Status:** The application's core frontend and backend architecture is **100% complete and fully functional**. However, the actual AI detection logic is currently using **Dummy/Mock services**.

### How it works right now (The "Dummy" Data):
Since we haven't integrated paid APIs (like Hive or OpenAI) yet, the backend simulates the analysis process:

*   **Image/Video Analysis (`imageAnalysis.js`):** It uses a random number generator (`Math.random()`) to calculate the "AI Probability Score". Based on how high this random score is, it attaches fake but realistic-sounding flags like *"GAN artifacts detected"* or *"Unusual texture patterns"*.
*   **Text/URL Analysis (`urlScraper.js` & `textAnalysis.js`):** It successfully scrapes the real text from the provided URL. But for analysis, instead of a real AI model, it uses basic rules. For example, if it finds clickbait words ("shocking", "breaking") or too many capital letters, it lowers the credibility score. 
*   **Reverse Image Search (`reverseImageSearch.js`):** It simulates a search and randomly returns 0 to 5 "matches" from fake sources like unsplash.com or gettyimages.com.

**Overall Score:** The `analysisController.js` combines these mock results to generate the final 0-100% "AI Score" and "Trust Score" shown on the UI.

---

## 📂 2. Complete Folder Structure

Here is the exact layout of the codebase and what each part does:

```text
Detect-It/
├── client/                      # 🎨 REACT FRONTEND (Vite + Tailwind)
│   ├── src/
│   │   ├── api/                 # Axios configuration for calling backend
│   │   │   └── index.js         # Contains functions like analyzeFile(), analyzeUrl()
│   │   ├── components/          # Reusable UI parts
│   │   │   ├── LoadingOverlay.jsx # The cool scanner animation
│   │   │   ├── Navbar.jsx         # Top navigation bar
│   │   │   ├── ResultCard.jsx     # Card shown in the History page
│   │   │   ├── ScoreGauge.jsx     # The animated circular score meter
│   │   │   ├── UploadZone.jsx     # Drag-and-drop file upload box
│   │   │   └── UrlInput.jsx       # Input field for pasting URLs
│   │   ├── pages/               # Main application pages
│   │   │   ├── History.jsx        # Shows all past analyses from Database
│   │   │   ├── Home.jsx           # Landing page with upload/URL inputs
│   │   │   └── ResultDetail.jsx   # Detailed view of a specific analysis score
│   │   ├── App.jsx              # Main routing component
│   │   ├── main.jsx             # React application entry point
│   │   └── index.css            # Global Tailwind styling & animations
│   ├── index.html               # Main HTML file
│   └── tailwind.config.js       # UI Theme & custom animation configs
│
└── server/                      # ⚙️ NODE.JS + EXPRESS BACKEND
    ├── controllers/             # Handles the logic for API requests
    │   └── analysisController.js# Combines scores, generates explanation, saves to DB
    ├── middleware/              # Functions that run before controllers
    │   ├── errorHandler.js      # Catches and formats all server errors
    │   └── upload.js            # Multer config (handles 50MB file uploads in memory)
    ├── models/                  # MongoDB Database Schemas
    │   └── Analysis.js          # Defines how a result is saved in DB
    ├── routes/                  # Defines all API endpoints
    │   └── analysis.js          # POST /api/analyze/file, GET /api/history, etc.
    ├── services/                # 🚨 THE MOCK AI ENGINES
    │   ├── imageAnalysis.js     # Generates dummy image AI score
    │   ├── reverseImageSearch.js# Generates dummy similar image matches
    │   ├── textAnalysis.js      # Uses heuristics to score text credibility
    │   └── urlScraper.js        # REAL scraper: fetches HTML and extracts text/title
    ├── .env                     # Contains PORT and MONGO_URI
    └── index.js                 # Starts the Express server & connects to MongoDB
```

---

## 🛠️ 3. Tech Stack

*   **Frontend:** React 18, Vite, Tailwind CSS v3, React Router. (Glassmorphism UI, Dark Mode)
*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB (Mongoose for schemas)
*   **File Handling:** Multer (Memory Storage)
*   **Web Scraping:** Axios + Cheerio

---

## 🚀 4. How to Run Locally

### Prerequisites
*   Node.js installed
*   MongoDB running locally (or adjust the `MONGO_URI` in `server/.env` to a cloud database)

### Step 1: Start the Backend Server
```bash
cd server
npm install
node index.js
# Or use 'npm run dev' if you have nodemon
```
*(Runs on `http://localhost:5000`)*

### Step 2: Start the Frontend App
```bash
cd client
npm install
npm run dev
```
*(Runs on `http://localhost:3000`)*

---

## ⏭️ 5. Next Steps (Moving from Dummy to Real)

To make this app production-ready with real AI detection, we need to modify the files inside `server/services/`:

1.  **`imageAnalysis.js`**: Replace the `Math.random` code with an Axios call to the **Hive AI API** or **Sightengine API**.
2.  **`textAnalysis.js`**: Send the scraped text to the **OpenAI API (ChatGPT)** with a prompt asking it to score the text for AI-generation likelihood.
3.  **`reverseImageSearch.js`**: Integrate the **Google Vision API** or **TinEye API** to find real matches on the web.

Currently, the architecture is built specifically so that **only these three files need to be changed** to upgrade the app from a Mock MVP to a Real Application. The database, UI, and controllers will handle the real data perfectly.
