package ca.notfromhere.proposer;

import ca.notfromhere.gate.Proposal;
import ca.notfromhere.species.SpeciesList;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The kill check, kept as a test so the number in the README can be re-derived at any time.
 * Needs Ollama running with the configured model, so it is tagged "live" and excluded by default:
 *   mvn test -Dgroups=live -DexcludedGroups=
 * Result on 2026-09-19 with qwen3.5:9b: 6 of 10 top-1 with the catalogue prompt (2 of 10 open-ended).
 */
@Tag("live")
class ProposerLiveTest {

    static final int REQUIRED_TOP1 = 6;

    @Test
    void namesAtLeastSixOfTenTestPhotos() throws Exception {
        SpeciesList speciesList = new SpeciesList();
        OllamaProposer proposer = new OllamaProposer("http://localhost:11434", "qwen3.5:9b", new Catalogue(speciesList), speciesList);

        JsonNode expected;
        try (InputStream in = getClass().getResourceAsStream("/photos/expected.json")) {
            expected = JsonMapper.builder().build().readTree(in).path("photos");
        }

        int hits = 0, total = 0;
        StringBuilder table = new StringBuilder("\n");
        for (JsonNode p : expected) {
            total++;
            String file = p.path("file").asText();
            String want = p.path("scientificName").asText();
            byte[] image = Files.readAllBytes(Path.of(getClass().getResource("/photos/" + file).toURI()));
            List<Proposal> got = proposer.propose(image, "image/jpeg");
            String top = got.isEmpty() ? "(none)" : got.get(0).taxonName();
            boolean ok = top.equalsIgnoreCase(want);
            if (ok) hits++;
            table.append(String.format("%-24s expected %-26s got %-26s %s%n", file, want, top, ok ? "TOP1" : "miss"));
        }
        table.append("TOP-1: ").append(hits).append(" / ").append(total).append('\n');
        System.out.println(table);

        assertTrue(hits >= REQUIRED_TOP1, "proposer named only " + hits + " of " + total + table);
    }
}
