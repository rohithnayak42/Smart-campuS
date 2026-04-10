/**
 * VERCEL COMPATIBILITY BRIDGE & LOCAL SERVER
 * This file connects Vercel's root directory search to your consolidated
 * backend inside the /api folder.
 */
const app = require('./app');

// Local Development Support: If run directly, start the server
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Smart Campus Engine running on http://localhost:${PORT}`);
        console.log(`Diagnostic Link: http://localhost:${PORT}/api/health`);
    });
}

// Standard export for Vercel serverless environment
module.exports = app;
