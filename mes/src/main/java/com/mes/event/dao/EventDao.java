package com.mes.event.dao;

import com.mes.event.ProductionEventRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

@Repository
public class EventDao {

    private final JdbcTemplate jdbcTemplate;

    public EventDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // 1. 설계서 컬럼 전체를 반영한 원시 이벤트 기록
    public void insertEvent(ProductionEventRequest req) {
        String sql = """
                INSERT INTO production_events
                (event_id, work_order_id, device_id, event_type, product_type, quantity, result, occurred_at, received_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, now())
                """;
        jdbcTemplate.update(sql,
                req.eventId(),
                req.workOrderId(),
                req.deviceId(),
                req.eventType(),
                req.productType(),
                req.quantity(),
                req.result(),
                Timestamp.valueOf(req.occurredAt())
        );
    }

    // 2. 누적 양품(GOOD) / 불량(DEFECT) 수량 갱신 및 최신 누적 양품 수량 반환
    public int incrementAndGetGoodQty(Long workOrderId, int quantity, boolean isGood) {
        int goodInc = isGood ? quantity : 0;
        int defectInc = isGood ? 0 : quantity;

        String upsertSql = """
                INSERT INTO production_results (work_order_id, good_qty, defect_qty, updated_at)
                VALUES (?, ?, ?, now())
                ON CONFLICT (work_order_id)
                DO UPDATE SET
                    good_qty = production_results.good_qty + EXCLUDED.good_qty,
                    defect_qty = production_results.defect_qty + EXCLUDED.defect_qty,
                    updated_at = now()
                RETURNING good_qty
                """;

        Integer currentGoodQty = jdbcTemplate.queryForObject(upsertSql, Integer.class, workOrderId, goodInc, defectInc);
        return currentGoodQty != null ? currentGoodQty : 0;
    }

    public List<Map<String, Object>> findRecentEvents(int limit) {
        String sql = """
        SELECT id, event_id, work_order_id, device_id, product_type, quantity, result, occurred_at
        FROM production_events
        ORDER BY id DESC
        LIMIT ?
        """;
        return jdbcTemplate.queryForList(sql, limit);
    }
}