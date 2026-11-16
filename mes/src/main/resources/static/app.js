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
    updateKpiSummary(list);
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

async function toggleSimulator() {
    const res = await fetch('/api/simulator/toggle', { method: 'POST' });
    const data = await res.json();
    updateSimButton(data.enabled);
}

function updateSimButton(enabled) {
    const btn = document.getElementById('simToggleBtn');
    if (enabled) {
        btn.textContent = '🤖 가상 PLC: ON (2초마다 자동생산)';
        btn.className = 'px-4 py-2 rounded-lg font-semibold text-sm bg-emerald-600 text-white animate-pulse';
    } else {
        btn.textContent = '🤖 가상 PLC: OFF';
        btn.className = 'px-4 py-2 rounded-lg font-semibold text-sm bg-slate-700 text-slate-300 hover:bg-slate-600 transition';
    }
}

let isLogOpen = false;

function toggleEventLog() {
    isLogOpen = !isLogOpen;
    const panel = document.getElementById('eventLogPanel');
    const icon = document.getElementById('logToggleIcon');

    if (isLogOpen) {
        panel.classList.remove('hidden');
        icon.textContent = '▲ 접기';
        loadEventLogs();
    } else {
        panel.classList.add('hidden');
        icon.textContent = '▼ 펼치기';
    }
}

// 6. 이벤트 로그
async function loadEventLogs() {
    if (!isLogOpen) return; // 닫혀 있을 땐 불필요한 API 호출 생략!

    const res = await fetch('/api/events');
    const logs = await res.json();
    const panel = document.getElementById('eventLogPanel');

    if (logs.length === 0) {
        panel.innerHTML = '<div class="text-slate-500">[SYSTEM] 아직 수신된 설비 이벤트가 없습니다.</div>';
        return;
    }

    panel.innerHTML = logs.map(log => {
        const isGood = log.result === 'GOOD';
        const badgeColor = isGood ? 'text-emerald-400' : 'text-rose-400 font-bold';
        const time = log.occurred_at ? log.occurred_at.replace('T', ' ').substring(0, 19) : '-';
        return `
            <div class="flex items-center gap-3 border-b border-slate-900 pb-1">
                <span class="text-slate-500">[${time}]</span>
                <span class="text-sky-400">[${log.device_id}]</span>
                <span class="text-slate-300">WO-#${log.work_order_id} (${log.product_type})</span>
                <span class="${badgeColor}">➔ ${log.result} (+${log.quantity})</span>
                <span class="text-slate-600 ml-auto">ID: ${log.event_id}</span>
            </div>
        `;
    }).join('');
}

// 7. KPI 실시간 계산 & 10% 임계치 알람 로직
function updateKpiSummary(orders) {
    // 1. 전체 작업지시의 양품(goodQty) 및 불량(defectQty) 합산
    let totalGood = 0;
    let totalDefect = 0;

    orders.forEach(o => {
        totalGood += (o.goodQty || 0);
        totalDefect += (o.defectQty || 0);
    });

    const totalProduced = totalGood + totalDefect;

    // 2. 양품률 & 불량률 계산 (생산량이 0일 때 0 나누기 방지!)
    const yieldRate = totalProduced === 0 ? 100.0 : (totalGood / totalProduced) * 100;
    const defectRate = totalProduced === 0 ? 0.0 : (totalDefect / totalProduced) * 100;

    // 3. 숫자 바인딩
    document.getElementById('kpiTotalQty').textContent = `${totalProduced.toLocaleString()} EA`;
    document.getElementById('kpiQtyBreakdown').textContent = `(양품 ${totalGood.toLocaleString()} / 불량 ${totalDefect.toLocaleString()})`;
    document.getElementById('kpiYieldRate').textContent = `${yieldRate.toFixed(1)}%`;
    document.getElementById('kpiDefectRate').textContent = `${defectRate.toFixed(1)}%`;

    // 4. 불량률 10.0% 초과 시 경고 알람 & 카드 강조 처리 (최소 모수 5개 이상일 때 발동)
    const isWarning = totalProduced >= 5 && defectRate > 10.0;
    const alertBanner = document.getElementById('defectAlertBanner');
    const defectCard = document.getElementById('kpiDefectCard');
    const defectRateEl = document.getElementById('kpiDefectRate');
    const defectBadge = document.getElementById('kpiDefectBadge');

    if (isWarning) {
        alertBanner.classList.remove('hidden');
        document.getElementById('defectAlertDetail').textContent =
            `현재 누적 불량률 ${defectRate.toFixed(1)}% (불량 ${totalDefect}EA / 총 ${totalProduced}EA) — 하단 로그 콘솔에서 불량 발생 원인을 확인하세요.`;

        defectCard.className = 'bg-rose-950/50 border border-rose-500 rounded-xl p-5 transition-colors';
        defectRateEl.className = 'text-2xl font-bold text-rose-400';
        defectBadge.textContent = '⚠️ 경고 (>10%)';
        defectBadge.className = 'px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-600 text-white';
    } else {
        alertBanner.classList.add('hidden');
        defectCard.className = 'bg-slate-900 border border-slate-800 rounded-xl p-5 transition-colors';
        defectRateEl.className = 'text-2xl font-bold text-slate-100';
        defectBadge.textContent = '정상';
        defectBadge.className = 'px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800';
    }
}

setInterval(() => {
    loadWorkOrders();
    loadEventLogs(); // 콘솔이 열려 있을 때만 1.5초마다 로그도 실시간 갱신!
}, 1500);

fetch('/api/simulator/status').then(r => r.json()).then(d => updateSimButton(d.enabled));