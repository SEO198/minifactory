package com.mes.event;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDateTime;

public record ProductionEventRequest(
        @NotBlank(message = "이벤트 ID는 필수입니다.")
        String eventId,

        @NotNull(message = "작업지시 ID는 필수입니다.")
        Long workOrderId,

        @NotBlank(message = "설비 ID는 필수입니다.")
        String deviceId,

        @NotBlank(message = "이벤트 타입은 필수입니다.")
        @Pattern(regexp = "PRODUCT_COMPLETED", message = "eventType은 PRODUCT_COMPLETED만 허용됩니다.")
        String eventType,

        @NotBlank(message = "제품 타입은 필수입니다.")
        String productType,

        @NotNull(message = "생산 수량은 필수입니다.")
        @Min(value = 1, message = "생산 수량은 1 이상이어야 합니다.")
        Integer quantity,

        @NotBlank(message = "결과(GOOD 또는 DEFECT)는 필수입니다.")
        @Pattern(regexp = "GOOD|DEFECT", message = "result는 GOOD 또는 DEFECT만 허용됩니다.")
        String result,

        @NotNull(message = "설비 발생 시각(occurredAt)은 필수입니다.")
        LocalDateTime occurredAt
) {
}