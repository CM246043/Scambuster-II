import express from "express";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust Cloud Run/Nginx proxy headers for rate limiting
  app.set('trust proxy', 1);

  // Use Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Vite handles CSP in dev
    crossOriginEmbedderPolicy: false,
  }));

  app.use(cors());
  app.use(express.json());

  // Rate limiting to prevent abuse
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { error: "Too many requests from this IP, please try again later." },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  app.use("/api/", limiter);

  // Server-side Gemini API analyze route
  app.post("/api/analyze", async (req, res) => {
    const { content } = req.body;
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Missing or invalid content to analyze." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured on the server. Please set it in Settings > Secrets."
      });
    }

    const prompt = `Analyze the following message for potential scam indicators and safety signals. Provide a detailed report.
    
    CRITICAL ANALYSIS CRITERIA:
    1. LIVE REPUTATION CHECK: Perform a Google Search for any names, businesses, or phone numbers.
    2. AMBIGUITY PROTOCOL: If the search returns multiple common results without clear indicators of which one is being discussed, DO NOT fail. Instead, report "Multiple results found, insufficient context to verify specific reputation" and assign a LOW/NEUTRAL risk score unless the message content itself is suspicious.
    3. REPUTATION THRESHOLDING: 
       - If NO negative information, fraud reports, or consumer complaints are found after a thorough search, grant a "Safe" green light (Risk Score: 1%).
       - Evaluate threat level proportionately to the volume/severity of negative data (e.g., Ripoff Report, BBB complaints, social media exposures).
    4. Identity Obscurity: If a name is entirely obscure but not associated with negative data, keep risk low (1-5%). High risk requires evidence of deceptive intent or negative history.
    
    Message Content to Analyze:
    ${content}`;

    const maxRetries = 3;
    let lastError: any = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                riskLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
                score: { type: Type.NUMBER },
                scamType: { type: Type.STRING },
                verdict: { type: Type.STRING },
                indicators: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      status: { type: Type.STRING, enum: ['PASS', 'FAIL'] }
                    },
                    required: ["label", "status"]
                  }
                },
                explanation: { type: Type.STRING },
                recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                supervisorThought: { type: Type.STRING },
                reputationFindings: { type: Type.STRING }
              },
              required: [
                "riskLevel",
                "score",
                "scamType",
                "verdict",
                "indicators",
                "explanation",
                "recommendations",
                "supervisorThought",
                "reputationFindings"
              ]
            }
          }
        });

        let responseText = response.text || "";
        if (!responseText) {
          throw new Error("Empty response from AI engine.");
        }

        if (responseText.startsWith("```json")) {
          responseText = responseText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (responseText.startsWith("```")) {
          responseText = responseText.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        const data = JSON.parse(responseText);
        return res.json(data);
      } catch (error: any) {
        lastError = error;
        const msg = error.message?.toLowerCase() || "";

        if (msg.includes("safety")) {
          return res.status(400).json({ error: "Intercept Blocked: Safety filters triggered for this content." });
        }

        const isTransient = msg.includes("rpc failed") || 
                          msg.includes("500") || 
                          msg.includes("quota") || 
                          msg.includes("limit") ||
                          msg.includes("timeout") ||
                          msg.includes("xhr error") ||
                          msg.includes("unavailable");

        if (isTransient && i < maxRetries - 1) {
          console.warn(`Transient error on attempt ${i + 1}, retrying in ${1000 * (i + 1)}ms...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }

        break;
      }
    }

    console.error("Gemini Error:", lastError);
    const msg = lastError?.message?.toLowerCase() || "";
    if (msg.includes("quota") || msg.includes("limit") || msg.includes("429")) {
      return res.status(429).json({ error: "Analysis nodes are currently saturated. Please wait 60 seconds and try again." });
    } else if (msg.includes("rpc failed") || msg.includes("xhr error") || msg.includes("500")) {
      return res.status(502).json({ error: "Secure Link Interrupted: The analysis node failed to respond. This is often a temporary network blip. Please try your scan again." });
    } else {
      return res.status(500).json({ error: lastError?.message || "Analysis node timed out. This can happen with extremely complex or ambiguous content. Try simplifying the text." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SECURE SERVER INITIATED: http://localhost:${PORT}`);
  });
}

startServer();
