package com.mes.workorder;

import java.time.LocalDateTime;

public record WorkOrder(long id, String workOrderNo, String productType, int targetQty,
                        String status, LocalDateTime createdAt, LocalDateTime startedAt,
                        LocalDateTime stoppedAt, LocalDateTime targetReachedAt,
                        LocalDateTime completedAt, LocalDateTime updatedAt) {}