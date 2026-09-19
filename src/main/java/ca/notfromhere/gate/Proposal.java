package ca.notfromhere.gate;

/**
 * One species candidate from a proposer (a vision model). taxonId is 0 when the proposer only gave a name
 * and the name could not be matched to the Ontario list. source names the proposer, e.g. "ollama:qwen3.5:9b".
 */
public record Proposal(String taxonName, long taxonId, double confidence, String source) {
}
