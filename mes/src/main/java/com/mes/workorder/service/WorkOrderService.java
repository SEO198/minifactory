package com.mes.workorder.service;

import com.mes.common.ApiException;
import com.mes.result.dao.ProductionResultDao;
import com.mes.workorder.WorkOrder;
import com.mes.workorder.dao.WorkOrderDao;
import com.mes.workorder.dto.WorkOrderCreateRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class WorkOrderService {
    private final WorkOrderDao dao;
    private final ProductionResultDao resultDao;
    public WorkOrderService(WorkOrderDao dao, ProductionResultDao resultDao) {
        this.dao = dao;
        this.resultDao = resultDao;
    }

    @Transactional
    public WorkOrder create(WorkOrderCreateRequest req) {
        long id = dao.insert(req.workOrderNo(), req.productType(), req.targetQty());
        resultDao.insertInitial(id);
        return get(id);
    }
    public List<WorkOrder> list() { return dao.findAll(); }

    @Transactional
    public WorkOrder start(long id) {
        WorkOrder wo = lock(id);
        if (!List.of("READY", "STOPPED").contains(wo.status()))
            throw new ApiException(HttpStatus.CONFLICT, "시작할 수 없는 상태입니다: " + wo.status());
        dao.markRunning(id);
        return get(id);
    }
    @Transactional
    public WorkOrder stop(long id) {
        WorkOrder wo = lock(id);
        if (!"RUNNING".equals(wo.status()))
            throw new ApiException(HttpStatus.CONFLICT, "가동 중인 작업만 중지할 수 있습니다: " + wo.status());
        dao.markStopped(id);
        return get(id);
    }
    @Transactional
    public WorkOrder complete(long id) {
        WorkOrder wo = lock(id);
        if (!List.of("RUNNING", "STOPPED", "TARGET_REACHED").contains(wo.status()))
            throw new ApiException(HttpStatus.CONFLICT, "완료 처리할 수 없는 상태입니다: " + wo.status());
        dao.markCompleted(id);
        return get(id);
    }

    private WorkOrder get(long id) {
        return dao.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "작업지시를 찾을 수 없습니다"));
    }
    private WorkOrder lock(long id) {
        return dao.findByIdForUpdate(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "작업지시를 찾을 수 없습니다"));
    }
}