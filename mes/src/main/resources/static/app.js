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

// 시간 포맷 변환 헬퍼 ("2026-11-16T13:00:40.384" -> "11-16 13:00:40")
function formatTime(isoString) {
    if (!isoString) return "-";
    return isoString.replace("T", " ").substring(5, 19);
}

// 3. 테이블 행 렌더링
function renderTable(list) {
    const tbody = document.getElementById("workOrderBody");
    tbody.innerHTML = "";

    list.forEach(wo => {
        const badgeClass = STATUS_STYLES[wo.status] || STATUS_STYLES.READY;
        const endTime = wo.completedAt || wo.stoppedAt; // 완료시각 우선, 없으면 정지시각 표시
        const endLabel = wo.completedAt ? "완료" : (wo.stoppedAt ? "정지" : "종료");

        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-800/40 transition";
        tr.innerHTML = `
            <td class="py-3.5 px-6 text-slate-400">#${wo.id}</td>
            <td class="py-3.5 px-6 font-semibold text-white">${wo.workOrderNo}</td>
            <td class="py-3.5 px-6 text-slate-300">${wo.productType}</td>
            <td class="py-3.5 px-6 font-mono">
                            <span class="text-cyan-400 font-bold">${wo.goodQty}</span> / ${wo.targetQty} EA
                            <span class="text-xs text-rose-400 ml-1">(불량 ${wo.defectQty})</span>
                        </td>
            <td class="py-3.5 px-6 text-xs font-mono text-slate-400 space-y-0.5">
                <div><span class="text-emerald-400">시작:</span> ${formatTime(wo.startedAt)}</div>
                <div><span class="text-amber-400">${endLabel}:</span> ${formatTime(endTime)}</div>
            </td>
            <td class="py-3.5 px-6">
                <span class="px-2.5 py-1 rounded-full text-xs font-bold ${badgeClass}">
                    ${wo.status}
                </span>
            </td>
            <td class="py-3.5 px-6 text-right space-x-1">
                            <button onclick="simulateEvent(${wo.id}, '${wo.productType}', 'GOOD')" class="bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/50 px-2.5 py-1 rounded-md text-xs font-bold transition">+양품1</button>
                            <button onclick="simulateEvent(${wo.id}, '${wo.productType}', 'DEFECT')" class="bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/50 px-2.5 py-1 rounded-md text-xs font-bold transition">+불량1</button>
                            <span class="text-slate-700 mx-1">|</span>
                            <button onclick="controlOrder(${wo.id}, 'start')" class="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-600/50 px-2.5 py-1 rounded-md text-xs font-semibold transition">시작</button>
                            <button onclick="controlOrder(${wo.id}, 'stop')" class="bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-600/50 px-2.5 py-1 rounded-md text-xs font-semibold transition">정지</button>
                            <button onclick="controlOrder(${wo.id}, 'complete')" class="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-600/50 px-2.5 py-1 rounded-md text-xs font-semibold transition">완료</button>
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

// 4-1. 가짜 설비(PLC/센서) 생산 이벤트 시뮬레이터 함수
async function simulateEvent(workOrderId, productType, result) {
    // 중복 방지용 고유 eventId 자동 생성 (예: SIM-1731734700123-482)
    const uniqueEventId = `SIM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    // 한국 로컬 시간 ISO 문자열 생성 ("2026-11-16T14:25:00")
    const nowIso = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 19);

    const payload = {
        eventId: uniqueEventId,
        workOrderId: workOrderId,
        deviceId: "LINE-01-SIM",
        eventType: "PRODUCT_COMPLETED",
        productType: productType,
        quantity: 1,
        result: result, // "GOOD" 또는 "DEFECT"
        occurredAt: nowIso
    };

    try {
        const res = await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(`설비 신호 거부됨: ${err.message || "가동 중(RUNNING) 상태인지 확인하세요!"}`);
            return;
        }

        // 실적 반영 후 대시보드 즉시 새로고침 (목표 수량 도달 시 TARGET_REACHED 자동 반영!)
        await loadWorkOrders();
    } catch (e) {
        console.error("이벤트 전송 실패:", e);
        alert("서버 통신 중 오류가 발생했습니다.");
    }
}

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