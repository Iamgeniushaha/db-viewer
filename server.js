const express = require("express");
const cors = require("cors");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config(); // 꼭 상단에 있어야 함

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

// 📁 server.js 또는 app.js
const { Configuration, OpenAIApi } = require("openai");

app.post("/api/ask-ai", async (req, res) => {
    const { tableSchema, question } = req.body;

    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY, // 노출 방지!
    });
    const openai = new OpenAIApi(configuration);

    try {
        const prompt = `
당신은 SQL 전문가입니다. 아래는 데이터베이스 테이블 구조입니다:

${tableSchema}

질문: ${question}

이 질문에 대해 적절한 MySQL 쿼리를 생성하기만 하시오. 다른 어떤 사족도 붙이지 말고 오직 코드만 첨부하시오.
`;

        const completion = await openai.createChatCompletion({
            model: "gpt-4.1-nano",
            messages: [{ role: "user", content: prompt }],
        });

        const answer = completion.data.choices[0].message.content;
        res.json({ success: true, answer });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
