const API_BASE = "/api/work-orders";
let statusChart = null;

// 상태별 Tailwind 배지 스타일 매핑
const STATUS_STYLES = {
    READY: "bg-slate-800 text-slate-300 border border-slate-600",
    RUNNING: "bg-emerald-950 text-emerald-400 border border-emerald-700 animate-pulse",
    STOPPED: "bg-amber-950 text-amber-400 border border-amber-700",
    TARGET_REACHED: "bg-sky-950 text-sky-400 border border-sky-700",
    COMPLETED: "bg-indigo-950 text-indigo-400 border border-indigo-700"
};

// 1. 작업지시 목록 조회 + KPI + 차트 동시 업데이트
async function loadWorkOrders() {
    const res = await fetch(API_BASE);
    const list = await res.json();

    updateDashboardStats(list);
    renderTable(list);
}

// 2. KPI 카드 및 Chart.js 도넛 그래프 갱신
function updateDashboardStats(list) {
    const counts = { READY: 0, RUNNING: 0, STOPPED: 0, TARGET_REACHED: 0, COMPLETED: 0 };
    list.forEach(wo => {
        if (counts[wo.status] !== undefined) counts[wo.status]++;
    });

    document.getElementById("kpiTotal").textContent = list.length;
    document.getElementById("kpiRunning").textContent = counts.RUNNING;
    document.getElementById("kpiStopped").textContent = counts.STOPPED;
    document.getElementById("kpiCompleted").textContent = counts.COMPLETED;

    const ctx = document.getElementById("statusChart").getContext("2d");
    const chartData = [counts.READY, counts.RUNNING, counts.STOPPED, counts.TARGET_REACHED + counts.COMPLETED];

    if (statusChart) {
        statusChart.data.datasets[0].data = chartData;
        statusChart.update();
    } else {
        statusChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["대기(READY)", "가동(RUNNING)", "정지(STOPPED)", "완료(DONE)"],
                datasets: [{
                    data: chartData,
                    backgroundColor: ["#475569", "#10b981", "#f59e0b", "#6366f1"],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { color: "#94a3b8", font: { size: 11 }, boxWidth: 10 }
                    }
                },
                cutout: "68%"
            }
        });
    }
}

// 3. 테이블 행 렌더링
function renderTable(list) {
    const tbody = document.getElementById("workOrderBody");
    tbody.innerHTML = "";

    list.forEach(wo => {
        const badgeClass = STATUS_STYLES[wo.status] || STATUS_STYLES.READY;
        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-800/40 transition";
        tr.innerHTML = `
            <td class="py-3.5 px-6 text-slate-400">#${wo.id}</td>
            <td class="py-3.5 px-6 font-semibold text-white">${wo.workOrderNo}</td>
            <td class="py-3.5 px-6 text-slate-300">${wo.productType}</td>
            <td class="py-3.5 px-6 font-mono text-sky-300">${wo.targetQty} EA</td>
            <td class="py-3.5 px-6">
                <span class="px-2.5 py-1 rounded-full text-xs font-bold ${badgeClass}">
                    ${wo.status}
                </span>
            </td>
            <td class="py-3.5 px-6 text-right space-x-1.5">
                <button onclick="controlOrder(${wo.id}, 'start')" class="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-600/50 px-3 py-1 rounded-md text-xs font-semibold transition">시작</button>
                <button onclick="controlOrder(${wo.id}, 'stop')" class="bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-600/50 px-3 py-1 rounded-md text-xs font-semibold transition">정지</button>
                <button onclick="controlOrder(${wo.id}, 'complete')" class="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-600/50 px-3 py-1 rounded-md text-xs font-semibold transition">완료</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 4. 작업지시 등록
document.getElementById("createForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
        workOrderNo: document.getElementById("workOrderNo").value.trim(),
        productType: document.getElementById("productType").value.trim(),
        targetQty: Number(document.getElementById("targetQty").value)
    };

    const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const err = await res.json();
        alert(err.message || "등록 실패");
        return;
    }

    e.target.reset();
    loadWorkOrders();
});

// 5. 상태 제어
async function controlOrder(id, action) {
    const res = await fetch(`${API_BASE}/${id}/${action}`, { method: "POST" });
    if (!res.ok) {
        const err = await res.json();
        alert(err.message || "상태 변경 실패");
        return;
    }
    loadWorkOrders();
}

document.getElementById("refreshBtn").addEventListener("click", loadWorkOrders);
loadWorkOrders();