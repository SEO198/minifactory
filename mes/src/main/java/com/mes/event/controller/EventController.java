package com.mes.event.controller; // ← 네 프로젝트 실제 패키지 경로로 맞춰줘!

import com.mes.event.ProductionEventRequest;
import com.mes.event.service.EventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    // 응답 형식을 명확하게 고정하는 전용 DTO
    public record EventResponse(String status, String eventId) {}

    @PostMapping
    public ResponseEntity<EventResponse> receiveEvent(@Valid @RequestBody ProductionEventRequest request) {
        eventService.recordEvent(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(new EventResponse("ACCEPTED", request.eventId()));
    }
}