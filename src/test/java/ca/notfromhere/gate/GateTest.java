package ca.notfromhere.gate;

import ca.notfromhere.species.Species;
import ca.notfromhere.species.SpeciesList;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pure unit tests: the real species list, a fake RangeLookup and a fake OccurrenceLookup, no Spring context,
 * no network. One test per rule and per branch, plus the pass. If any of these go red, the gate's contract changed.
 */
class GateTest {

    // iNaturalist ids as they appear in ontario_invasives.json (looked up live 2026-09-19)
    static final long PHRAGMITES = 64237;
    static final long KNOTWEED = 914922;
    static final long LANTERNFLY = 324726;

    static final PhotoMeta PETERBOROUGH_SEPTEMBER = new PhotoMeta(44.30, -78.32, LocalDate.of(2026, 9, 19));
    static final List<String> INAT_URLS = List.of("https://api.inaturalist.org/v1/observations?near", "https://api.inaturalist.org/v1/observations?wide");

    /** A RangeLookup the test controls completely. */
    static class FakeRange implements RangeLookup {
        boolean available = true;
        int within50 = 218;
        int within200 = 300;
        Map<Integer, Integer> histogram = Map.of(6, 1002, 7, 1655, 8, 2264, 9, 1622);
        boolean histogramAvailable = true;

        @Override
        public RangeResult range(long taxonId, double lat, double lng) {
            if (!available) return RangeResult.unavailable(INAT_URLS);
            List<Observation> nearest = within200 == 0 ? List.of()
                    : List.of(new Observation(401358622L, "2026-09-18", 6.7, 44.2426, -78.3426, "Cavan Monaghan, ON",
                    "https://www.inaturalist.org/observations/401358622"));
            return new RangeResult(true, within50, within200, nearest, INAT_URLS);
        }

        @Override
        public Histogram monthHistogram(long taxonId) {
            return histogramAvailable ? new Histogram(true, histogram, "https://api.inaturalist.org/v1/observations/histogram?x")
                    : Histogram.unavailable("https://api.inaturalist.org/v1/observations/histogram?x");
        }
    }

    /** A GBIF stand-in: present or absent, with its own counts. */
    static class FakeOccurrences implements OccurrenceLookup {
        boolean present = true;
        int within50 = 327;
        int within200 = 5859;

        @Override
        public Optional<Corroboration> corroborate(String scientificName, double lat, double lng) {
            return present ? Optional.of(new Corroboration("gbif", 5376075L, within50, within200,
                    List.of("https://api.gbif.org/v1/species/match?name=x", "https://api.gbif.org/v1/occurrence/search?near", "https://api.gbif.org/v1/occurrence/search?wide")))
                    : Optional.empty();
        }
    }

    final SpeciesList speciesList = new SpeciesList();
    final FakeRange range = new FakeRange();
    final FakeOccurrences gbif = new FakeOccurrences();
    final Gate gate = new Gate(speciesList, range, gbif);

    static Proposal p(String name, long id, double confidence, String source) {
        return new Proposal(name, id, confidence, source);
    }

    @Test
    void reportsWhenEveryRulePasses() {
        List<List<Proposal>> runs = List.of(
                List.of(p("Phragmites australis", PHRAGMITES, 0.91, "view1"), p("Typha latifolia", 0, 0.05, "view1")),
                List.of(p("Phragmites australis", PHRAGMITES, 0.88, "view2")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.REPORT, result.verdict());
        assertEquals("all", result.rule());
        assertEquals(218, result.evidence().get("within50Km"));
        assertEquals("inaturalist", result.evidence().get("rangeSource"));
        assertEquals(9, result.evidence().get("month"));
        assertTrue(result.passed());
        assertNotNull(result.evidence().get("nearest"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void carriesTheQueryUrlsAndTheGbifCorroborationInTheEvidence() {
        List<List<Proposal>> runs = List.of(List.of(p("Phragmites australis", PHRAGMITES, 0.95, "view1")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        List<String> sources = (List<String>) result.evidence().get("sources");
        assertEquals(6, sources.size()); // 2 iNaturalist range queries + 3 GBIF queries + 1 histogram query
        assertTrue(sources.stream().anyMatch(s -> s.contains("gbif.org")));
        assertTrue(sources.stream().anyMatch(s -> s.contains("histogram")));
        Map<String, Object> corroboration = (Map<String, Object>) result.evidence().get("gbif");
        assertEquals(327, corroboration.get("within50Km"));
    }

    @Test
    void refusesWhenTwoViewsDisagree() {
        List<List<Proposal>> runs = List.of(
                List.of(p("Phragmites australis", PHRAGMITES, 0.9, "view1")),
                List.of(p("Reynoutria japonica", KNOTWEED, 0.9, "view2")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.NOT_VERIFIED_SPLIT, result.verdict());
        assertEquals("agreement", result.rule());
        assertEquals(runs, result.evidence().get("proposals"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void acceptsTwoOfThreeViewsAndRecordsTheDissent() {
        List<List<Proposal>> runs = List.of(
                List.of(p("Phragmites australis", PHRAGMITES, 0.9, "view1")),
                List.of(p("Typha latifolia", 0, 0.7, "view2")),
                List.of(p("Phragmites australis", PHRAGMITES, 0.8, "view3")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.REPORT, result.verdict());
        Map<String, Object> agreement = (Map<String, Object>) result.evidence().get("agreement");
        assertEquals(3, agreement.get("views"));
        assertEquals(2, agreement.get("agreeing"));
        assertEquals(2, agreement.get("needed"));
    }

    @Test
    void refusesOneOfThreeViews() {
        List<List<Proposal>> runs = List.of(
                List.of(p("Phragmites australis", PHRAGMITES, 0.9, "view1")),
                List.of(p("Typha latifolia", 0, 0.7, "view2")),
                List.of(p("Reynoutria japonica", KNOTWEED, 0.8, "view3")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.NOT_VERIFIED_SPLIT, result.verdict());
        assertTrue(result.reason().contains("1 of 3"));
    }

    @Test
    void refusesWhenSingleViewIsNotTwiceAsConfident() {
        List<List<Proposal>> runs = List.of(
                List.of(p("Phragmites australis", PHRAGMITES, 0.5, "view1"), p("Reynoutria japonica", KNOTWEED, 0.4, "view1")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.NOT_VERIFIED_SPLIT, result.verdict());
        assertEquals("agreement", result.rule());
    }

    @Test
    void passesAgreementWhenSingleViewIsConfident() {
        List<List<Proposal>> runs = List.of(
                List.of(p("Phragmites australis", PHRAGMITES, 0.9, "view1"), p("Reynoutria japonica", KNOTWEED, 0.2, "view1")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.REPORT, result.verdict());
    }

    @Test
    void refusesSpeciesNotOnTheListAndNamesTheListedLookalike() {
        // Cow parsnip is native; the list says giant hogweed is its lookalike
        List<List<Proposal>> runs = List.of(List.of(p("Cow parsnip", 0, 0.95, "view1")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.NOT_ON_LIST, result.verdict());
        assertEquals("list", result.rule());
        Species lookalike = (Species) result.evidence().get("listedLookalike");
        assertNotNull(lookalike);
        assertEquals("Giant hogweed", lookalike.commonName());
    }

    @Test
    void identityRefusalsCarryASourcedHowToTellGuide() {
        // wild parsnip vs golden alexanders, the confusion the model actually makes
        List<List<Proposal>> runs = List.of(
                List.of(p("Zizia aurea", 0, 0.85, "view1"), p("Pastinaca sativa", 59778, 0.60, "view1")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.NOT_VERIFIED_SPLIT, result.verdict());
        Species.Guide guide = (Species.Guide) result.evidence().get("howToTell");
        assertNotNull(guide);
        assertEquals("https://www.ontario.ca/page/wild-parsnip", guide.source());
        assertTrue(guide.tell().get(0).contains("Wild parsnip"));

        // cow parsnip alone: not on the list, guide comes from the listed lookalike (giant hogweed)
        GateResult cow = gate.evaluate(List.of(List.of(p("Heracleum maximum", 0, 0.95, "view1"))), PETERBOROUGH_SEPTEMBER);
        assertEquals(Verdict.NOT_ON_LIST, cow.verdict());
        Species.Guide hogweed = (Species.Guide) cow.evidence().get("howToTell");
        assertNotNull(hogweed);
        assertEquals("https://www.ontario.ca/page/giant-hogweed", hogweed.source());
    }

    @Test
    void refusesNewRangeWhenNothingWithin200KmAndGivesTheHotline() {
        range.within50 = 0;
        range.within200 = 0;
        List<List<Proposal>> runs = List.of(List.of(p("Lycorma delicatula", LANTERNFLY, 0.95, "view1")));

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
        List<List<Proposal>> runs = List.of(List.of(p("Lycorma delicatula", LANTERNFLY, 0.95, "view1")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.INSUFFICIENT_RECORDS, result.verdict());
        assertEquals("range", result.rule());
        assertEquals(2, result.evidence().get("within50Km"));
    }

    @Test
    void decidesRangeFromGbifWhenINaturalistIsUnreachable() {
        range.available = false;
        gbif.within50 = 12;
        gbif.within200 = 80;
        List<List<Proposal>> runs = List.of(List.of(p("Phragmites australis", PHRAGMITES, 0.95, "view1")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.REPORT, result.verdict());
        assertEquals("gbif (iNaturalist unavailable)", result.evidence().get("rangeSource"));
        assertEquals(12, result.evidence().get("within50Km"));
    }

    @Test
    void refusesWhenNoRangeSourceCanBeReached() {
        range.available = false;
        gbif.present = false;
        List<List<Proposal>> runs = List.of(List.of(p("Phragmites australis", PHRAGMITES, 0.95, "view1")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.INSUFFICIENT_RECORDS, result.verdict());
        assertEquals("none", result.evidence().get("rangeSource"));
        assertTrue(result.reason().contains("cannot be verified"));
    }

    @Test
    void refusesOutOfSeasonWhenTheMonthHasNoOntarioRecords() {
        range.histogram = Map.of(6, 100, 7, 200, 8, 300); // nothing in September
        List<List<Proposal>> runs = List.of(List.of(p("Phragmites australis", PHRAGMITES, 0.95, "view1")));

        GateResult result = gate.evaluate(runs, PETERBOROUGH_SEPTEMBER);

        assertEquals(Verdict.OUT_OF_SEASON, result.verdict());
        assertEquals("season", result.rule());
        assertEquals(9, result.evidence().get("month"));
    }

    @Test
    void passesButFlagsWhenNoHistogramIsAvailable() {
        range.histogramAvailable = false;
        List<List<Proposal>> runs = List.of(List.of(p("Phragmites australis", PHRAGMITES, 0.95, "view1")));

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
