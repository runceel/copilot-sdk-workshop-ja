package main

import (
	"strings"
	"testing"
)

func TestReportPrompt(t *testing.T) {
	target := "https://example.com/review?language=ja"
	prompt := reportPrompt(target)

	for _, expected := range []string{
		target,
		"`browser_navigate`",
		"`read_latest_accessibility_snapshot`",
		"`accessibility_rule_lookup`",
		"# Accessibility review",
		"## Review limits",
	} {
		if !strings.Contains(prompt, expected) {
			t.Errorf("reportPrompt() is missing %q", expected)
		}
	}
	if strings.Contains(prompt, "%!") {
		t.Errorf("reportPrompt() contains a formatting error: %s", prompt)
	}
}
