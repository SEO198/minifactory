package com.mes.event.service;

import com.mes.workorder.WorkOrder;
import com.mes.workorder.dao.WorkOrderDao;
import com.mes.event.ProductionEventRequest;
import com.mes.event.dao.EventDao;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventService {

    private final EventDao eventDao;
    private final WorkOrderDao workOrderDao;

    public EventService(EventDao eventDao, WorkOrderDao workOrderDao) {
        this.eventDao = eventDao;
        this.workOrderDao = workOrderDao;
    }

    @Transactional
    public void recordEvent(ProductionEventRequest req) {
        // 1. 작업지시 존재 여부 확인 및 행 잠금(FOR UPDATE)으로 동시성 방어
        WorkOrder workOrder = workOrderDao.findByIdForUpdate(req.workOrderId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 작업지시 ID입니다: " + req.workOrderId()));

        // 2. 현재 가동 중(RUNNING)인 라인인지 검증 (대기/정지/완료 상태면 실적 거부)
        if (!"RUNNING".equals(workOrder.status())) {
            throw new IllegalStateException("가동 중(RUNNING)인 작업지시만 실적을 등록할 수 있습니다. 현재 상태: " + workOrder.status());
        }

        // 3. 설비가 만든 제품 타입과 지시된 제품 타입 일치 여부 검증 (오투입 사고 방어)
        if (!workOrder.productType().equals(req.productType())) {
            throw new IllegalArgumentException(
                    String.format("제품 타입 불일치! 지시 품목: %s, 설비 보고 품목: %s", workOrder.productType(), req.productType())
            );
        }

        // 4. 원시 생산 이벤트 이력 저장 (event_id 중복 시 DB UNIQUE 제약조건으로 차단)
        try {
            eventDao.insertEvent(req);
        } catch (DuplicateKeyException e) {
            throw new IllegalStateException("이미 처리된 중복 이벤트 ID입니다: " + req.eventId());
        }

        // 5. 누적 양품/불량 수량 반영 후, 누적 양품 수량이 목표 수량 이상이면 TARGET_REACHED 자동 전환
        boolean isGood = "GOOD".equals(req.result());
        int currentGoodQty = eventDao.incrementAndGetGoodQty(req.workOrderId(), req.quantity(), isGood);

        if (currentGoodQty >= workOrder.targetQty()) {
            workOrderDao.markTargetReached(req.workOrderId());
        }
    }
}