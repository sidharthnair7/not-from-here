package ca.notfromhere.gate;

/** Every possible outcome of the gate. REPORT is the only pass; each refusal names the rule that produced it. */
public enum Verdict {
    REPORT,
    NOT_VERIFIED_SPLIT,
    NOT_ON_LIST,
    NEW_RANGE,
    INSUFFICIENT_RECORDS,
    OUT_OF_SEASON
}
