import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
});

/** Upload an image or video file for analysis */
export async function analyzeFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/analyze/file", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/** Analyze a URL */
export async function analyzeUrl(url) {
  const { data } = await api.post("/analyze/url", { url });
  return data;
}

/** Analyze raw text for AI-generation signals */
export async function analyzeText(text) {
  const { data } = await api.post("/analyze/text", { text });
  return data;
}

/** Fetch paginated history */
export async function fetchHistory(page = 1, limit = 12) {
  const { data } = await api.get("/history", { params: { page, limit } });
  return data;
}

/** Fetch a single analysis by ID */
export async function fetchAnalysis(id) {
  const { data } = await api.get(`/analysis/${id}`);
  return data;
}

export default api;
