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

    private static final RowMapper<WorkOrder> MAPPER = (rs, i) -> new WorkOrder(
            rs.getLong("id"), rs.getString("work_order_no"), rs.getString("product_type"),
            rs.getInt("target_qty"), rs.getString("status"),
            rs.getObject("created_at", LocalDateTime.class),
            rs.getObject("started_at", LocalDateTime.class),
            rs.getObject("stopped_at", LocalDateTime.class),
            rs.getObject("target_reached_at", LocalDateTime.class),
            rs.getObject("completed_at", LocalDateTime.class),
            rs.getObject("updated_at", LocalDateTime.class));

    public long insert(String no, String type, int target) {
        return jdbc.queryForObject(
                "INSERT INTO work_orders (work_order_no, product_type, target_qty) VALUES (?, ?, ?) RETURNING id",
                Long.class, no, type, target);
    }
    public Optional<WorkOrder> findById(long id) {
        return jdbc.query("SELECT * FROM work_orders WHERE id = ?", MAPPER, id).stream().findFirst();
    }
    public Optional<WorkOrder> findByIdForUpdate(long id) {
        return jdbc.query("SELECT * FROM work_orders WHERE id = ? FOR UPDATE", MAPPER, id).stream().findFirst();
    }
    public List<WorkOrder> findAll() {
        return jdbc.query("SELECT * FROM work_orders ORDER BY id DESC", MAPPER);
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