const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

// טעינה ראשונית עם טיפול בשגיאות קובץ
function loadQueue() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }
    } catch (e) { console.error("Critical: Failed to load storage"); }
    return [];
}

function saveQueue(q) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(q, null, 2));
    } catch (e) { console.error("Critical: Failed to save storage"); }
}

let queue = loadQueue();

const server = http.createServer((req, res) => {
    // CORS Headers - סטנדרט אבטחה
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // READ: החזרת התור (כבר ממוין, לכן הפעולה היא O(n) מהירה מאוד)
    if (req.url === '/queue' && req.method === 'GET') {
        const enrichedQueue = queue.map((item, index) => ({
            ...item,
            estimatedTime: index * 10 
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(enrichedQueue));
    } 
    
    // CREATE: הוספה עם וולידציה (הגנה על השרת)
    else if (req.url === '/queue' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                
                // --- וולידציה: כאן את הופכת למיוחדת ---
                if (!data.name || data.name.trim().length < 2) {
                    res.writeHead(400); // שגיאת לקוח - שם קצר מדי
                    return res.end(JSON.stringify({ error: "Invalid Name" }));
                }

                const priority = parseInt(data.priority);
                if (![1, 3, 5].includes(priority)) {
                    res.writeHead(400); // שגיאת לקוח - עדיפות לא חוקית
                    return res.end(JSON.stringify({ error: "Invalid Priority Level" }));
                }

                // הוספה ומיון מיידי - אופטימיזציה של הביצועים
                queue.push({ name: data.name, priority, createdAt: new Date() });
                queue.sort((a, b) => b.priority - a.priority);
                
                saveQueue(queue);
                res.writeHead(201);
                res.end(JSON.stringify({ message: "Success" }));
            } catch (err) {
                res.writeHead(500); // שגיאת שרת פנימית
                res.end(JSON.stringify({ error: "Server Error" }));
            }
        });
    }

    // DELETE: הסרה מהתור
    else if (req.url === '/queue' && req.method === 'DELETE') {
        if (queue.length > 0) {
            queue.shift();
            saveQueue(queue);
            res.writeHead(200);
            res.end(JSON.stringify({ message: "Processed" }));
        } else {
            res.writeHead(404); // התור כבר ריק
            res.end(JSON.stringify({ error: "Queue Empty" }));
        }
    }
});

server.listen(3001, () => console.log('🛡️ Hardened Portfolio Server Running'));