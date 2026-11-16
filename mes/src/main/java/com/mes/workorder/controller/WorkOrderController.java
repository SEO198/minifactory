package com.mes.workorder.controller;

import com.mes.workorder.WorkOrder;
import com.mes.workorder.dto.WorkOrderCreateRequest;
import com.mes.workorder.service.WorkOrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/work-orders")
public class WorkOrderController {
    private final WorkOrderService service;
    public WorkOrderController(WorkOrderService service) { this.service = service; }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public WorkOrder create(@Valid @RequestBody WorkOrderCreateRequest req) { return service.create(req); }

    @GetMapping
    public List<WorkOrder> list() { return service.list(); }

    @PostMapping("/{id}/start")
    public WorkOrder start(@PathVariable long id) { return service.start(id); }

    @PostMapping("/{id}/stop")
    public WorkOrder stop(@PathVariable long id) { return service.stop(id); }

    @PostMapping("/{id}/complete")
    public WorkOrder complete(@PathVariable long id) { return service.complete(id); }
}