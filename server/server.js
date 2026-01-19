import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// Store the latest payload (for demo)
let latestPayload = null;

app.post("/data", (req, res) => {
  console.log("✅ Received data from n8n:", req.body);
  latestPayload = req.body;
  res.json({ success: true });
});

app.get("/data", (req, res) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    "Surrogate-Control": "no-store"
  });
  res.json(latestPayload || { message: "No data yet" });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Express API listening on http://localhost:${PORT}`);
});