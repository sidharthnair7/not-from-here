package ca.notfromhere.proposer;

import ca.notfromhere.gate.Proposal;
import ca.notfromhere.species.SpeciesList;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * The hosted proposer: Pl@ntNet's identification API (plants only). It exists so a copy of this app can run on a
 * small server with no GPU and still check a stranger's own photo. Same contract as every proposer: it names
 * candidates and nothing more; the gate decides. Pl@ntNet answers with real species names, so a plant that is not on
 * the Ontario list is refused by rule 2 under its own name ("Taraxacum officinale is not on the Ontario invasive
 * list"), and a native lookalike (Typha latifolia) is refused with the how-to-tell guide, exactly like the local model.
 * A photo with no plant in it produces zero candidates, which the gate turns into a refusal.
 *
 * Selected with nfh.llm.provider=plantnet and a key in PLANTNET_API_KEY (free tier: 500 identifications a day).
 */
@Component
@ConditionalOnProperty(name = "nfh.llm.provider", havingValue = "plantnet")
public class PlantNetProposer implements Proposer {

    static final int MAX_CANDIDATES = 3;

    /** Names Pl@ntNet may use for a listed species (older synonyms) mapped to the name on the Ontario list. */
    static final Map<String, String> SYNONYMS = Map.of(
            "fallopia japonica", "Reynoutria japonica",
            "polygonum cuspidatum", "Reynoutria japonica",
            "cynanchum rossicum", "Vincetoxicum rossicum");

    private final RestClient http;
    private final JsonMapper json = JsonMapper.builder().build();
    private final String apiKey;
    private final String project;
    private final SpeciesList speciesList;

    public PlantNetProposer(@Value("${nfh.plantnet.url:https://my-api.plantnet.org}") String baseUrl,
                            @Value("${nfh.plantnet.key:}") String apiKey,
                            @Value("${nfh.plantnet.project:all}") String project,
                            SpeciesList speciesList) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(30));
        this.http = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.project = project;
        this.speciesList = speciesList;
    }

    @Override
    public String name() {
        return "plantnet:v2/" + project;
    }

    @Override
    public String scope() {
        return "plants only (Pl@ntNet)";
    }

    @Override
    public List<Proposal> propose(byte[] image, String mimeType) {
        return parse(ask(image, mimeType));
    }

    /** One multipart POST, one image, organ "auto". Returns the JSON body, "" when no plant was found or on any failure. */
    String ask(byte[] image, String mimeType) {
        if (apiKey.isEmpty()) return "";
        String ext = mimeType != null && mimeType.contains("png") ? "png" : "jpg";
        ByteArrayResource photo = new ByteArrayResource(image) {
            @Override
            public String getFilename() {
                return "photo." + ext;
            }
        };
        MultiValueMap<String, Object> parts = new LinkedMultiValueMap<>();
        parts.add("images", photo);
        parts.add("organs", "auto");
        try {
            String response = http.post()
                    .uri(uri -> uri.path("/v2/identify/" + project)
                            .queryParam("api-key", apiKey)
                            .queryParam("include-related-images", "false")
                            .queryParam("no-reject", "false")
                            .queryParam("nb-results", MAX_CANDIDATES)
                            .queryParam("lang", "en")
                            .build())
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(parts)
                    .retrieve()
                    .body(String.class);
            return response == null ? "" : response;
        } catch (HttpClientErrorException e) {
            // 404 is Pl@ntNet's "no plant recognised in this image"; anything else is treated the same way: no candidates
            return "";
        } catch (RuntimeException e) {
            return "";
        }
    }

    /** Pl@ntNet's results, best first, as Proposals. Names are matched to the Ontario list; other plants keep taxonId 0. */
    List<Proposal> parse(String body) {
        List<Proposal> out = new ArrayList<>();
        if (body == null || body.isBlank()) return out;
        JsonNode results;
        try {
            results = json.readTree(body).path("results");
        } catch (RuntimeException e) {
            return out;
        }
        for (JsonNode r : results) {
            if (out.size() >= MAX_CANDIDATES) break;
            String name = r.path("species").path("scientificNameWithoutAuthor").asText("").trim();
            if (name.isEmpty()) continue;
            name = canonical(name);
            double confidence = r.path("score").asDouble(0.0);
            confidence = Math.max(0.0, Math.min(1.0, confidence));
            long taxonId = speciesList.byScientificName(name).map(s -> s.taxonId()).orElse(0L);
            out.add(new Proposal(name, taxonId, confidence, name()));
        }
        return out;
    }

    /** "Phragmites australis subsp. australis" -> "Phragmites australis"; known synonyms -> the list's name. */
    static String canonical(String name) {
        String[] words = name.trim().split("\s+");
        String binomial = words.length >= 2 ? words[0] + " " + words[1] : name.trim();
        return SYNONYMS.getOrDefault(binomial.toLowerCase(), binomial);
    }
}
