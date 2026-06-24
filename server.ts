import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin securely from an environment variable
// We do not commit serviceAccountKey.json to version control.
// The stringified JSON should be placed in FIREBASE_SERVICE_ACCOUNT_KEY.
const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (serviceAccountEnv) {
  try {
    const serviceAccount = JSON.parse(serviceAccountEnv);
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log("Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin. Please ensure FIREBASE_SERVICE_ACCOUNT_KEY is valid JSON.", error);
  }
} else {
  console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not set. Firebase Admin is not initialized.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", firebaseAdminInitialized: getApps().length > 0 });
  });

  // Parse Shift Report via Gemini API
  app.post("/api/parse-shift-report", async (req, res) => {
    try {
      const { fileData, mimeType } = req.body;
      if (!fileData || !mimeType) {
        return res.status(400).json({ error: "Missing file data or mime type." });
      }

      // Initialize Gemini Client
      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: {
          parts: [
            {
              inlineData: {
                data: fileData, // Base64 data (without data:image/png;base64, prefix)
                mimeType,
              }
            },
            {
              text: "Extract the list of sold items from this daily shift sales report (which could be a photo, CSV, or PDF). Return the data as a JSON array of objects. Map the product names to 'name', the quantity sold to 'quantity', the selling price per unit to 'sellPrice', and the cost price per unit to 'costPrice' if available (otherwise 0). If it's just a summary, try to infer the items or return as detailed as possible."
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: "Name of the product/item sold.",
                },
                quantity: {
                  type: Type.NUMBER,
                  description: "Quantity sold.",
                },
                sellPrice: {
                  type: Type.NUMBER,
                  description: "Selling price per unit.",
                },
                costPrice: {
                  type: Type.NUMBER,
                  description: "Cost price per unit (use 0 if unknown).",
                }
              },
              required: ["name", "quantity", "sellPrice"]
            }
          }
        }
      });

      const jsonStr = response.text?.trim() || "[]";
      let parsedItems = [];
      try {
        parsedItems = JSON.parse(jsonStr);
      } catch (e) {
        parsedItems = [];
      }

      res.json({ items: parsedItems });

    } catch (error: any) {
      console.error("Gemini Parse Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Example proxy endpoint for Firebase usage
  app.get("/api/verify-token", async (req, res) => {
    // A placeholder for token verification or other admin SDK use cases
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (getApps().length === 0) {
      return res.status(503).json({ error: "Firebase Admin is not configured." });
    }

    try {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await getAuth().verifyIdToken(token);
      res.json({ uid: decodedToken.uid });
    } catch (error: any) {
      res.status(401).json({ error: "Invalid token", details: error.message });
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
    // Production asset serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
