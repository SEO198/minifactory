package com.mes.simulator.controller;

import com.mes.simulator.PlcSimulator;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/simulator")
public class SimulatorController {

    private final PlcSimulator simulator;

    public SimulatorController(PlcSimulator simulator) {
        this.simulator = simulator;
    }

    @GetMapping("/status")
    public Map<String, Boolean> status() {
        return Map.of("enabled", simulator.isEnabled());
    }

    @PostMapping("/toggle")
    public Map<String, Boolean> toggle() {
        return Map.of("enabled", simulator.toggle());
    }
}