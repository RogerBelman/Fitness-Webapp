package com.example.workouttracker;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.example.workouttracker.service.TextFormatting;

class TextFormattingTests {
	@Test
	void titlesCapitalizeEachWordAndNormalizeSpacing() {
		assertThat(TextFormatting.titleCase("  bENCH   pRESS  ")).isEqualTo("Bench Press");
		assertThat(TextFormatting.titleCase("push\tDAY\nA")).isEqualTo("Push Day A");
		assertThat(TextFormatting.titleCase("\u00a0UPPER\u00a0BODY\u00a0")).isEqualTo("Upper Body");
	}

	@Test
	void titlesHandlePunctuationNumbersAndAccentedLetters() {
		assertThat(TextFormatting.titleCase("FARMER'S carry")).isEqualTo("Farmer's Carry");
		assertThat(TextFormatting.titleCase("push-UP / PULL-down")).isEqualTo("Push-Up / Pull-Down");
		assertThat(TextFormatting.titleCase("5k RUN (éPAULE)")).isEqualTo("5K Run (Épaule)");
	}

	@Test
	void emptyOptionalTitlesStayNull() {
		assertThat(TextFormatting.titleCase(null)).isNull();
		assertThat(TextFormatting.titleCase(" \t\n ")).isNull();
	}
}
