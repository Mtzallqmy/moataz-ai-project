// Vercel Serverless Function entrypoint
// All /api/* requests are rewritten here (see vercel.json).
// The Express app keeps its original /api/... route paths because
// Vercel rewrites preserve the original request URL.
import app from '../server.js';

export default app;
