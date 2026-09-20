package ca.notfromhere.proposer;

import ca.notfromhere.gate.Proposal;
import ca.notfromhere.species.SpeciesList;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * The default proposer: a local vision model through Ollama's /api/chat, JSON mode, thinking off, low temperature.
 * Verified 2026-09-19 with qwen3.5:9b (has the "vision" capability in `ollama show`): about 2.5 s per photo on an
 * RTX 3070. Anything that goes wrong (Ollama down, bad JSON, a name not in the catalogue) degrades to fewer or zero
 * candidates; it never throws into the controller, and zero candidates is a refusal at the gate.
 */
@Component
@ConditionalOnProperty(name = "nfh.llm.provider", havingValue = "ollama", matchIfMissing = true)
public class OllamaProposer implements Proposer {

    static final int MAX_CANDIDATES = 3;

    private final RestClient http;
    private final JsonMapper json = JsonMapper.builder().build();
    private final String model;
    private final Catalogue catalogue;
    private final SpeciesList speciesList;

    public OllamaProposer(@Value("${nfh.ollama.url:http://localhost:11434}") String baseUrl,
                          @Value("${nfh.ollama.model:qwen3.5:9b}") String model,
                          Catalogue catalogue, SpeciesList speciesList) {
        this.http = RestClient.builder().baseUrl(baseUrl).build();
        this.model = model;
        this.catalogue = catalogue;
        this.speciesList = speciesList;
    }

    @Override
    public String name() {
        return "ollama:" + model;
    }

    @Override
    public List<Proposal> propose(byte[] image, String mimeType) {
        String raw = ask(image);
        return parse(raw);
    }

    /** One chat call, one image, JSON forced. Returns the model's content string or "" on any failure. */
    String ask(byte[] image) {
        Map<String, Object> body = Map.of(
                "model", model,
                "stream", false,
                "format", "json",
                "think", false,
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", catalogue.prompt(),
                        "images", List.of(Base64.getEncoder().encodeToString(image)))),
                "options", Map.of("temperature", 0.0, "seed", 7, "num_predict", 300));
        try {
            String response = http.post().uri("/api/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(json.writeValueAsString(body))
                    .retrieve()
                    .body(String.class);
            if (response == null) return "";
            return json.readTree(response).path("message").path("content").asText("");
        } catch (RuntimeException e) {
            return "";
        }
    }

    /** Turns the model's JSON into Proposals. Names are matched to the Ontario list; unknown names keep taxonId 0. */
    List<Proposal> parse(String content) {
        List<Proposal> out = new ArrayList<>();
        if (content == null || content.isBlank()) return out;
        JsonNode candidates;
        try {
            candidates = json.readTree(content).path("candidates");
        } catch (RuntimeException e) {
            return out;
        }
        for (JsonNode c : candidates) {
            if (out.size() >= MAX_CANDIDATES) break;
            String name = c.path("scientificName").asText("").trim();
            if (name.isEmpty()) continue;
            int paren = name.indexOf('(');
            if (paren > 0) name = name.substring(0, paren).trim(); // "Genus species (common)" -> "Genus species"
            double confidence = c.path("confidence").asDouble(0.0);
            confidence = Math.max(0.0, Math.min(1.0, confidence));
            long taxonId = speciesList.byScientificName(name).map(s -> s.taxonId()).orElse(0L);
            out.add(new Proposal(name, taxonId, confidence, name()));
        }
        return out;
    }
}
