package ca.notfromhere.proposer;

import ca.notfromhere.gate.Proposal;
import ca.notfromhere.species.SpeciesList;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Pl@ntNet's answer shape, parsed offline. The live call is exercised by PlantNetLiveTest (tag "live"). */
class PlantNetProposerTest {

    // The shape documented at my.plantnet.org/doc/api/identify, trimmed to the fields the proposer reads
    static final String GARLIC_MUSTARD = """
            {"query":{"project":"all","images":["photo.jpg"],"organs":["auto"]},
             "language":"en","bestMatch":"Alliaria petiolata (M.Bieb.) Cavara & Grande",
             "results":[
               {"score":0.91,"species":{"scientificNameWithoutAuthor":"Alliaria petiolata","commonNames":["Garlic mustard"]},"gbif":{"id":"3046262"}},
               {"score":0.03,"species":{"scientificNameWithoutAuthor":"Cardamine pratensis","commonNames":["Cuckooflower"]}},
               {"score":0.01,"species":{"scientificNameWithoutAuthor":"Lunaria annua","commonNames":["Honesty"]}},
               {"score":0.005,"species":{"scientificNameWithoutAuthor":"Barbarea vulgaris","commonNames":["Yellow rocket"]}}
             ],
             "remainingIdentificationRequests":499}
            """;

    static final String KNOTWEED_SYNONYM = """
            {"results":[{"score":0.8,"species":{"scientificNameWithoutAuthor":"Fallopia japonica","commonNames":["Japanese knotweed"]}}]}
            """;

    static final String CATTAIL_SUBSPECIES = """
            {"results":[{"score":0.7,"species":{"scientificNameWithoutAuthor":"Phragmites australis subsp. australis"}},
                        {"score":0.2,"species":{"scientificNameWithoutAuthor":"Typha latifolia"}}]}
            """;

    private final SpeciesList speciesList = new SpeciesList();
    private final PlantNetProposer proposer = new PlantNetProposer("https://example.invalid", "test-key", "all", speciesList);

    @Test
    void mapsResultsToProposalsBestFirstWithListIds() {
        List<Proposal> out = proposer.parse(GARLIC_MUSTARD);
        assertEquals(3, out.size(), "capped at three candidates");
        assertEquals("Alliaria petiolata", out.get(0).taxonName());
        assertEquals(56061L, out.get(0).taxonId(), "garlic mustard resolves to its iNaturalist taxon id");
        assertEquals(0.91, out.get(0).confidence(), 1e-9);
        assertEquals(0L, out.get(1).taxonId(), "a plant that is not on the list keeps taxonId 0");
        assertEquals("plantnet:v2/all", out.get(0).source());
    }

    @Test
    void oldSynonymsResolveToTheListName() {
        List<Proposal> out = proposer.parse(KNOTWEED_SYNONYM);
        assertEquals("Reynoutria japonica", out.get(0).taxonName());
        assertEquals(914922L, out.get(0).taxonId());
    }

    @Test
    void subspeciesCollapseToTheBinomialAndLookalikesKeepTheirName() {
        List<Proposal> out = proposer.parse(CATTAIL_SUBSPECIES);
        assertEquals("Phragmites australis", out.get(0).taxonName());
        assertEquals(64237L, out.get(0).taxonId());
        assertEquals("Typha latifolia", out.get(1).taxonName(), "the native lookalike goes through under its own name");
    }

    @Test
    void nothingRecognisedIsAnEmptyList() {
        assertTrue(proposer.parse("").isEmpty(), "Pl@ntNet's 404 (no plant found) becomes an empty body");
        assertTrue(proposer.parse("not json").isEmpty());
        assertTrue(proposer.parse("{\"results\":[]}").isEmpty());
    }

    @Test
    void noKeyMeansNoCallAndNoCandidates() {
        PlantNetProposer noKey = new PlantNetProposer("https://example.invalid", "", "all", speciesList);
        assertTrue(noKey.propose(new byte[]{1, 2, 3}, "image/jpeg").isEmpty());
    }
}
