package com.mes.simulator;

import com.mes.event.ProductionEventRequest; // 기존 이벤트 요청 DTO 경로에 맞게 확인!
import com.mes.event.service.EventService;
import com.mes.workorder.WorkOrder;
import com.mes.workorder.service.WorkOrderService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
public class PlcSimulator {

    private final AtomicBoolean enabled = new AtomicBoolean(false); // 기본값: OFF
    private final WorkOrderService workOrderService;
    private final EventService eventService;

    public PlcSimulator(WorkOrderService workOrderService, EventService eventService) {
        this.workOrderService = workOrderService;
        this.eventService = eventService;
    }

    public boolean isEnabled() {
        return enabled.get();
    }

    public boolean toggle() {
        boolean next = !enabled.get();
        enabled.set(next);
        return next;
    }

    // 2초(2000ms)마다 실행되는 가상 설비 신호 루프
    @Scheduled(fixedRate = 2000)
    public void runVirtualLine() {
        if (!enabled.get()) return;

        // 현재 가동 중(RUNNING)인 작업지시만 필터링
        List<WorkOrder> runningOrders = workOrderService.list().stream()
                .filter(wo -> "RUNNING".equals(wo.status()))
                .toList();

        for (WorkOrder wo : runningOrders) {
            // 90% 확률로 양품(GOOD), 10% 확률로 불량(DEFECT) 판정 시뮬레이션
            String result = ThreadLocalRandom.current().nextInt(100) < 90 ? "GOOD" : "DEFECT";
            String eventId = "PLC-AUTO-" + UUID.randomUUID().toString().substring(0, 8);

            ProductionEventRequest req = new ProductionEventRequest(
                    eventId,
                    wo.id(),
                    "LINE-01-PLC",
                    "PRODUCT_COMPLETED",
                    wo.productType(),
                    1,
                    result,
                    LocalDateTime.now()
            );

            try {
                eventService.recordEvent(req); // 기존 MES 파이프라인 그대로 통과!
            } catch (Exception ignored) {
                // 이미 목표 달성(TARGET_REACHED) 등으로 상태가 바뀐 경우 안전하게 무시
            }
        }
    }
}