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
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", firebaseAdminInitialized: getApps().length > 0 });
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
