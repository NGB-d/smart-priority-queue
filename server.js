const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

// טעינת נתונים
function loadQueue() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }
    } catch (e) { console.error("Error loading file"); }
    return [{ name: "שרה כהן", priority: 5 }, { name: "ישראל ישראלי", priority: 1 }];
}

function saveQueue(q) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(q, null, 2));
}

let queue = loadQueue();

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // כאן נמצא התיקון - הכל בתוך הפונקציה שמקבלת את req ו-res
    if (req.url === '/queue' && req.method === 'GET') {
        queue.sort((a, b) => b.priority - a.priority);
        
        // אלגוריתם העשרת הנתונים (Data Enrichment)
        const enrichedQueue = queue.map((item, index) => ({
            ...item,
            estimatedTime: index * 10 
        }));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(enrichedQueue));
    } 
    
    else if (req.url === '/queue' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const data = JSON.parse(body);
            queue.push({ name: data.name, priority: parseInt(data.priority) });
            saveQueue(queue);
            res.writeHead(201);
            res.end(JSON.stringify({ message: "Added" }));
        });
    }

    else if (req.url === '/queue' && req.method === 'DELETE') {
        queue.sort((a, b) => b.priority - a.priority);
        queue.shift();
        saveQueue(queue);
        res.writeHead(200);
        res.end(JSON.stringify({ message: "Deleted" }));
    }
    else if (req.url === '/queue/reset' && req.method === 'POST') {
        queue = []; 
        saveQueue(queue);
        res.writeHead(200);
        res.end(JSON.stringify({ message: "Queue Cleared" }));
    }
});

server.listen(3001, () => console.log('🚀 Portfolio Server Running on 3001'));