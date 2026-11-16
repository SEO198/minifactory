package com.mes.workorder.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record WorkOrderCreateRequest(
        @NotBlank(message = "작업지시 번호는 필수입니다") String workOrderNo,
        @NotBlank(message = "제품 종류는 필수입니다") String productType,
        @Min(value = 1, message = "목표 수량은 1 이상이어야 합니다") int targetQty) {}