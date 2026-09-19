package ca.notfromhere.gate;

import ca.notfromhere.species.Species;
import ca.notfromhere.species.SpeciesList;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pure unit tests: the real species list, a fake RangeLookup, no Spring context, no network.
 * One test per rule, plus the pass. If any of these go red, the gate's contract changed.
 */
class GateTest {

    // iNaturalist ids as they appear in ontario_invasives.json (looked up live 2026-09-19)
    static final long PHRAGMITES = 64237;
    static final long LANTERNFLY = 324726;

    static final PhotoMeta PETERBOROUGH_SEPTEMBER = new PhotoMeta(44.30, -78.32, LocalDate.of(2026, 9, 19));

    /** A RangeLookup the test controls completely. */
    static class FakeRange implements RangeLookup {
        int within50 = 218;
        int within200 = 300;
        Map<Integer, Integer> histogram = Map.of(6, 1002, 7, 1655, 8, 2264, 9, 1622);

        @Override
        public RangeResult range(long taxonId, double lat, double lng) {
            List<Observation> nearest = within200 == 0 ? List.of()
                    : List.of(new Observation(401358622L, "2026-09-18", 6.7, "https://www.inaturalist.org/observations/401358622"));
            return new RangeResult(within50, within200, nearest);
        }

        @Override
        public Map<Integer, Integer> monthHistogram(long taxonId) {
            return histogram;
        }
    }

    final SpeciesList speciesList = new SpeciesList();
    final FakeRange range = new FakeRange();
    final Gate gate = new Gate(speciesList, range);

    static Proposal p(String name, long id, double confidence, String source) {
        return new Proposal(name, id, confidence, source);
    }

    @Test
    void reportsWhenEveryRulePasses() {
        List<List<Proposal>> runs = List.of(
                List.of(p("Phragmites australis", PHRAGMITES, 0.91, "ollama"), p("Typha latifolia", 0, 0.05, "ollama")),
                List.of(p("Phragmites australis", PHRAGMITES, 0.88, "bedrock")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.REPORT, result.verdict());
        assertEquals("all", result.rule());
        assertEquals(218, result.evidence().get("within50Km"));
        assertEquals(9, result.evidence().get("month"));
        assertTrue(result.passed());
        assertNotNull(result.evidence().get("nearest"));
    }

    @Test
    void refusesWhenTwoProposersDisagree() {
        List<List<Proposal>> runs = List.of(
                List.of(p("Phragmites australis", PHRAGMITES, 0.9, "ollama")),
                List.of(p("Reynoutria japonica", 914922, 0.9, "bedrock")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.NOT_VERIFIED_SPLIT, result.verdict());
        assertEquals("agreement", result.rule());
        assertEquals(runs, result.evidence().get("proposals"));
    }

    @Test
    void refusesWhenSingleProposerIsNotTwiceAsConfident() {
        List<List<Proposal>> runs = List.of(
                List.of(p("Phragmites australis", PHRAGMITES, 0.5, "ollama"), p("Reynoutria japonica", 914922, 0.4, "ollama")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.NOT_VERIFIED_SPLIT, result.verdict());
        assertEquals("agreement", result.rule());
    }

    @Test
    void passesAgreementWhenSingleProposerIsConfident() {
        List<List<Proposal>> runs = List.of(
                List.of(p("Phragmites australis", PHRAGMITES, 0.9, "ollama"), p("Reynoutria japonica", 914922, 0.2, "ollama")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.REPORT, result.verdict());
    }

    @Test
    void refusesSpeciesNotOnTheListAndNamesTheListedLookalike() {
        // Cow parsnip is native; the list says giant hogweed is its lookalike
        List<List<Proposal>> runs = List.of(List.of(p("Cow parsnip", 0, 0.95, "ollama")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.NOT_ON_LIST, result.verdict());
        assertEquals("list", result.rule());
        Species lookalike = (Species) result.evidence().get("listedLookalike");
        assertNotNull(lookalike);
        assertEquals("Giant hogweed", lookalike.commonName());
    }

    @Test
    void refusesNewRangeWhenNothingWithin200KmAndGivesTheHotline() {
        range.within50 = 0;
        range.within200 = 0;
        List<List<Proposal>> runs = List.of(List.of(p("Lycorma delicatula", LANTERNFLY, 0.95, "ollama")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.NEW_RANGE, result.verdict());
        assertEquals("range", result.rule());
        assertEquals("1-800-563-7711", result.evidence().get("hotline"));
        assertEquals(List.of(), result.evidence().get("nearest"));
    }

    @Test
    void refusesInsufficientRecordsWhenFewerThanThreeWithin50Km() {
        range.within50 = 2;
        range.within200 = 40;
        List<List<Proposal>> runs = List.of(List.of(p("Lycorma delicatula", LANTERNFLY, 0.95, "ollama")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.INSUFFICIENT_RECORDS, result.verdict());
        assertEquals("range", result.rule());
        assertEquals(2, result.evidence().get("within50Km"));
    }

    @Test
    void refusesOutOfSeasonWhenTheMonthHasNoOntarioRecords() {
        range.histogram = Map.of(6, 100, 7, 200, 8, 300); // nothing in September
        List<List<Proposal>> runs = List.of(List.of(p("Phragmites australis", PHRAGMITES, 0.95, "ollama")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.OUT_OF_SEASON, result.verdict());
        assertEquals("season", result.rule());
        assertEquals(9, result.evidence().get("month"));
    }

    @Test
    void passesButFlagsWhenNoHistogramIsAvailable() {
        range.histogram = Map.of();
        List<List<Proposal>> runs = List.of(List.of(p("Phragmites australis", PHRAGMITES, 0.95, "ollama")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.REPORT, result.verdict());
        assertEquals(false, result.evidence().get("seasonDataAvailable"));
    }

    @Test
    void refusesWhenNoProposerProducedAnything() {
        GateResult result = gate.evaluate(List.of(List.of()), PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.NOT_VERIFIED_SPLIT, result.verdict());
        assertFalse(result.passed());
    }

    @Test
    void speciesListLoadsAllSixteenWithIdsAndHotline() {
        assertEquals(16, speciesList.all().size());
        assertEquals("1-800-563-7711", speciesList.hotline());
        assertTrue(speciesList.byTaxonId(PHRAGMITES).isPresent());
        assertTrue(speciesList.byScientificName("reynoutria japonica").isPresent());
        assertTrue(speciesList.all().stream().allMatch(s -> s.taxonId() > 0));
    }
}
