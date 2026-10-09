package com.example.workouttracker.service;

public final class TextFormatting {

	private TextFormatting() {
	}

	public static String titleCase(String value) {
		if (value == null) {
			return null;
		}
		String text = value.replaceAll("(?U)\\s+", " ").strip();
		if (text.isEmpty()) {
			return null;
		}

		StringBuilder formatted = new StringBuilder(text.length());
		boolean firstLetter = true;
		for (int offset = 0; offset < text.length();) {
			int character = text.codePointAt(offset);
			if (Character.isLetter(character)) {
				formatted.appendCodePoint(firstLetter ? Character.toUpperCase(character) : Character.toLowerCase(character));
				firstLetter = false;
			} else {
				formatted.appendCodePoint(character);
				if (character == ' ' || character == '-' || character == '/') {
					firstLetter = true;
				}
			}
			offset += Character.charCount(character);
		}
		return formatted.toString();
	}
}
