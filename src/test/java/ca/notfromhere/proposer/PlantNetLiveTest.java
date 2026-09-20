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
 * The same kill check as ProposerLiveTest, run against Pl@ntNet for the plant photos in the test set, so the README's
 * per-proposer table can be re-derived. Needs PLANTNET_API_KEY in the environment; tagged "live", excluded by default:
 *   PLANTNET_API_KEY=... mvn test -Dgroups=live -DexcludedGroups= -Dtest=PlantNetLiveTest
 */
@Tag("live")
class PlantNetLiveTest {

    @Test
    void namesThePlantPhotos() throws Exception {
        String key = System.getenv("PLANTNET_API_KEY");
        assertTrue(key != null && !key.isBlank(), "PLANTNET_API_KEY not set");
        SpeciesList speciesList = new SpeciesList();
        PlantNetProposer proposer = new PlantNetProposer("https://my-api.plantnet.org", key, "all", speciesList);

        JsonNode expected;
        try (InputStream in = getClass().getResourceAsStream("/photos/expected.json")) {
            expected = JsonMapper.builder().build().readTree(in).path("photos");
        }

        int hits = 0, total = 0;
        StringBuilder table = new StringBuilder("\n");
        for (JsonNode p : expected) {
            String file = p.path("file").asText();
            String want = p.path("scientificName").asText();
            String kind = speciesList.byScientificName(want).map(s -> s.kind()).orElse("?");
            if (!"plant".equals(kind)) continue; // Pl@ntNet is plants only; the insects are the local model's job
            byte[] bytes = Files.readAllBytes(Path.of("src/test/resources/photos/" + file));
            List<Proposal> got = proposer.propose(bytes, "image/jpeg");
            String top = got.isEmpty() ? "(nothing)" : got.get(0).taxonName();
            boolean hit = top.equalsIgnoreCase(want);
            if (hit) hits++;
            total++;
            table.append(String.format("%-28s want %-28s got %-28s %s%n", file, want, top, hit ? "OK" : "miss"));
        }
        System.out.println(table);
        System.out.println("Pl@ntNet top-1: " + hits + " of " + total + " plant photos");
        assertTrue(total > 0);
    }
}
