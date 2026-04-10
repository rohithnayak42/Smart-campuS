const app = require('./api/app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Smart Campus Local Server running on http://localhost:${PORT}`);
    console.log(`Diagnostic Link: http://localhost:${PORT}/api/health`);
});
