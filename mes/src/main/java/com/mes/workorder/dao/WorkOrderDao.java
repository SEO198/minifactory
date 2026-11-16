package com.mes.workorder.dao;

import com.mes.workorder.WorkOrder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class WorkOrderDao {
    private final JdbcTemplate jdbc;
    public WorkOrderDao(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    private static final RowMapper<WorkOrder> MAPPER = (rs, rowNum) -> new WorkOrder(
            rs.getLong("id"),
            rs.getString("work_order_no"),
            rs.getString("product_type"),
            rs.getInt("target_qty"),
            rs.getInt("good_qty"),      // ← 추가!
            rs.getInt("defect_qty"),    // ← 추가!
            rs.getString("status"),
            rs.getTimestamp("started_at") != null ? rs.getTimestamp("started_at").toLocalDateTime() : null,
            rs.getTimestamp("stopped_at") != null ? rs.getTimestamp("stopped_at").toLocalDateTime() : null,
            rs.getTimestamp("completed_at") != null ? rs.getTimestamp("completed_at").toLocalDateTime() : null
    );

    private static final String BASE_SELECT = """
        SELECT w.*,
               COALESCE(r.good_qty, 0) AS good_qty,
               COALESCE(r.defect_qty, 0) AS defect_qty
        FROM work_orders w
        LEFT JOIN production_results r ON w.id = r.work_order_id
        """;

    public long insert(String no, String type, int target) {
        return jdbc.queryForObject(
                "INSERT INTO work_orders (work_order_no, product_type, target_qty) VALUES (?, ?, ?) RETURNING id",
                Long.class, no, type, target);
    }
    public Optional<WorkOrder> findById(Long id) {
        String sql = """
            SELECT w.*,
                   COALESCE(r.good_qty, 0) AS good_qty,
                   COALESCE(r.defect_qty, 0) AS defect_qty
            FROM work_orders w
            LEFT JOIN production_results r ON w.id = r.work_order_id
            WHERE w.id = ?
            """;
        return jdbc.query(sql, MAPPER, id).stream().findFirst();
    }
    public Optional<WorkOrder> findByIdForUpdate(long id) {
        String sql = """
            SELECT w.*,
                   COALESCE(r.good_qty, 0) AS good_qty,
                   COALESCE(r.defect_qty, 0) AS defect_qty
            FROM work_orders w
            LEFT JOIN production_results r ON w.id = r.work_order_id
            WHERE w.id = ?
            FOR UPDATE OF w
            """;
        return jdbc.query(sql, MAPPER, id).stream().findFirst();
    }
    public List<WorkOrder> findAll() {
        return jdbc.query(BASE_SELECT + " ORDER BY w.id DESC", MAPPER);
    }
    public void markRunning(long id) {
        jdbc.update("UPDATE work_orders SET status = 'RUNNING', started_at = COALESCE(started_at, now()), updated_at = now() WHERE id = ?", id);
    }
    public void markStopped(long id) {
        jdbc.update("UPDATE work_orders SET status = 'STOPPED', stopped_at = now(), updated_at = now() WHERE id = ?", id);
    }
    public void markTargetReached(long id) {
        jdbc.update("UPDATE work_orders SET status = 'TARGET_REACHED', target_reached_at = now(), updated_at = now() WHERE id = ?", id);
    }
    public void markCompleted(long id) {
        jdbc.update("UPDATE work_orders SET status = 'COMPLETED', completed_at = now(), updated_at = now() WHERE id = ?", id);
    }
}