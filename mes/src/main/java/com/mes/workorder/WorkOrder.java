package com.mes.workorder;

import java.time.LocalDateTime;

public record WorkOrder(
        Long id,
        String workOrderNo,
        String productType,
        int targetQty,
        int goodQty,      // ← 추가!
        int defectQty,    // ← 추가!
        String status,
        LocalDateTime startedAt,
        LocalDateTime stoppedAt,
        LocalDateTime completedAt
) {}