package ca.notfromhere.gate;

import java.util.Map;

/**
 * The gate's answer. On REPORT, rule is "all" and evidence carries everything the report writer is allowed to see.
 * On a refusal, rule names the rule that failed and evidence is the raw data that failed it, serialised as-is to the UI.
 */
public record GateResult(Verdict verdict, String rule, String reason, Map<String, Object> evidence) {

    public boolean passed() {
        return verdict == Verdict.REPORT;
    }
}
