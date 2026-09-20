package ca.notfromhere.proposer;

import ca.notfromhere.gate.Proposal;

import java.util.List;

/**
 * A proposer looks at the photo and names candidates. That is all it is allowed to do. It never sees the gate's
 * rules, and the gate never trusts it: a proposer can get a candidate INTO the gate and nothing more.
 * Implementations: OllamaProposer (local model, default), BedrockProposer (hosted, optional).
 */
public interface Proposer {

    /** Human-readable id that ends up in Proposal.source, e.g. "ollama:qwen3.5:9b". */
    String name();

    /** Up to three candidates, most likely first. An empty list on any failure; the gate turns that into a refusal. */
    List<Proposal> propose(byte[] image, String mimeType);
}
