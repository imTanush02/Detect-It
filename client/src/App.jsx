import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import History from "./pages/History";
import ResultDetail from "./pages/ResultDetail";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />
          <Route path="/result/:id" element={<ResultDetail />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-sm text-white/30">
        © 2026 DetectIt — AI Content Verification Tool
      </footer>
    </div>
  );
}
