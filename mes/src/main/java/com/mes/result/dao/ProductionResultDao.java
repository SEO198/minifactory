package com.mes.result.dao;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ProductionResultDao {
    private final JdbcTemplate jdbc;
    public ProductionResultDao(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public void insertInitial(long workOrderId) {
        jdbc.update("INSERT INTO production_results (work_order_id) VALUES (?)", workOrderId);
    }
}