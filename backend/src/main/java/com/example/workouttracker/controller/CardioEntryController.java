package com.example.workouttracker.controller;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.workouttracker.dto.CardioEntryRequest;
import com.example.workouttracker.dto.CardioEntryResponse;
import com.example.workouttracker.service.CardioService;

import jakarta.validation.Valid;

@RestController
public class CardioEntryController {
	private final CardioService cardioService;

	public CardioEntryController(CardioService cardioService) {
		this.cardioService = cardioService;
	}

	@PostMapping("/api/workout-exercises/{id}/cardio-entries")
	public ResponseEntity<CardioEntryResponse> create(@PathVariable Long id, @Valid @RequestBody CardioEntryRequest request) {
		CardioEntryResponse response = cardioService.create(id, request);
		return ResponseEntity.created(URI.create("/api/cardio-entries/" + response.id())).body(response);
	}

	@PutMapping("/api/cardio-entries/{id}")
	public CardioEntryResponse update(@PathVariable Long id, @Valid @RequestBody CardioEntryRequest request) {
		return cardioService.update(id, request);
	}

	@DeleteMapping("/api/cardio-entries/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		cardioService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
