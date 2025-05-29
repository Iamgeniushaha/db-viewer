const express = require("express");
const cors = require("cors");
const path = require("path");
const mysql = require("mysql2/promise");

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', '/lobby.html'));
});
app.get('/viewer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', '/viewer.html'));
});
app.use(express.static(path.join(__dirname, "./public")));


// DB 연결 테스트 및 테이블 목록 반환
app.post("/api/db/test-connection", async (req, res) => {
    const { host, port, user, password, database } = req.body;

    try {
        const conn = await mysql.createConnection({ host, port, user, password, database });

        const [rows] = await conn.query("SHOW TABLES");
        await conn.end();

        const tableKey = Object.keys(rows[0])[0]; // 예: 'Tables_in_databaseName'
        const tables = rows.map(row => row[tableKey]);

        res.json({ success: true, tables });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 테이블 데이터 조회
app.post("/api/db/get-table-data", async (req, res) => {
    const { host, port, user, password, database, table } = req.body;

    try {
        const conn = await mysql.createConnection({ host, port, user, password, database });
        const [rows] = await conn.query(`SELECT * FROM \`${table}\` LIMIT 100`);
        await conn.end();

        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
