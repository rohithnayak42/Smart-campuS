try {
    const app = require('../app');
    
    // Vercel serverless functions handle the application as a single exported handler
    module.exports = app;
} catch (err) {
    console.error('--- CRITICAL VERCEL BOOT ERROR ---');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    
    // Fallback minimal handler to prevent generic 500 without info
    module.exports = (req, res) => {
        res.status(500).json({
            error: 'Critical Startup Failure',
            details: err.message,
            tip: 'Check Vercel Logs for full stack trace.'
        });
    };
}
