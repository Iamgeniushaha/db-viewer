let lastConnectionInfo = null;

document.getElementById("db-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = new FormData(e.target);
    const data = Object.fromEntries(form.entries());
    lastConnectionInfo = data;

    const res = await fetch("/api/db/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "mysql", ...data }),
    });

    const json = await res.json();
    const result = document.getElementById("result");

    if (json.success) {
        result.innerHTML = `<p>✅ 연결에 성공했습니다!</p>`;

        if (json.tables && json.tables.length > 0) {
            const links = json.tables.map(
                table => `<a href="#" class="table-link" data-name="${table}">${table}</a>`
            ).join(", ");

            result.innerHTML += `<p>📦 테이블 목록: ${links}</p>`;

            document.querySelectorAll(".table-link").forEach(link => {
                link.addEventListener("click", async (event) => {
                    event.preventDefault();
                    const tableName = link.dataset.name;

                    const res = await fetch("/api/db/get-table-data", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            ...lastConnectionInfo,
                            table: tableName
                        }),
                    });

                    const json = await res.json();
                    if (json.success) {
                        const dataHtml = json.data.length > 0
                            ? `<table border="1"><tr>${Object.keys(json.data[0]).map(col => `<th>${col}</th>`).join("")}</tr>` +
                            json.data.map(row =>
                                `<tr>${Object.values(row).map(val => `<td>${val}</td>`).join("")}</tr>`
                            ).join("") +
                            `</table>`
                            : `<p>📂 데이터가 없습니다.</p>`;

                        result.innerHTML += `<h3>${tableName} 테이블 데이터</h3>${dataHtml}`;
                    } else {
                        result.innerHTML += `<p>❌ 테이블 데이터 조회 실패: ${json.message}</p>`;
                    }
                });
            });

        } else {
            result.innerHTML += `<p>📂 테이블이 존재하지 않습니다.</p>`;
        }
    } else {
        result.textContent = `❌ 실패: ${json.message}`;
    }
});
