// Vercel entry point. Vercel runs this file as a serverless function and
// passes every request to the Express app (see backend/vercel.json).
// Locally you still use `npm run dev`, which starts src/server.js instead.
import { createApp } from "../src/app.js";

export default createApp();
