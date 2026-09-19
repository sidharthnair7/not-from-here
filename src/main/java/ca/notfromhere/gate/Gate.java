package ca.notfromhere.gate;

import ca.notfromhere.species.Species;
import ca.notfromhere.species.SpeciesList;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * The gate. Four deterministic rules, evaluated in order; the first failure returns a refusal that names the rule
 * and carries the raw evidence. No model runs in here. A proposer can only ever get a candidate INTO the gate;
 * it can never talk its way OUT of it.
 *
 * <ol>
 *   <li>Agreement: two proposers must name the same top species; one proposer must be at least 2x as confident
 *       in its top pick as in its runner-up.</li>
 *   <li>List membership: the species must be on ontario_invasives.json.</li>
 *   <li>Range: at least 3 research-grade iNaturalist records within 50 km in the last 3 years. Zero within
 *       200 km is NEW_RANGE (never auto-reported; routed to the hotline).</li>
 *   <li>Season: the photo's month must have a non-zero count in the Ontario month histogram.</li>
 * </ol>
 */
@Component
public class Gate {

    static final int MIN_RECORDS_WITHIN_50_KM = 3;
    static final double SINGLE_PROPOSER_CONFIDENCE_RATIO = 2.0;

    private final SpeciesList speciesList;
    private final RangeLookup rangeLookup;

    public Gate(SpeciesList speciesList, RangeLookup rangeLookup) {
        this.speciesList = speciesList;
        this.rangeLookup = rangeLookup;
    }

    /**
     * @param runs one list of proposals per proposer that ran (one or two proposers), each list ordered
     *             best-first as the proposer returned it
     * @param meta where and when the photo was taken
     */
    public GateResult evaluate(List<List<Proposal>> runs, PhotoMeta meta) {
        List<List<Proposal>> nonEmpty = runs == null ? List.of() : runs.stream().filter(r -> r != null && !r.isEmpty()).toList();
        if (nonEmpty.isEmpty()) {
            return refuse(Verdict.NOT_VERIFIED_SPLIT, "agreement", "No proposer produced a candidate.",
                    Map.of("proposals", runs == null ? List.of() : runs));
        }

        // Rule 1: agreement
        Proposal top = nonEmpty.get(0).get(0);
        if (nonEmpty.size() >= 2) {
            for (List<Proposal> other : nonEmpty.subList(1, nonEmpty.size())) {
                if (!sameTaxon(top, other.get(0))) {
                    return refuse(Verdict.NOT_VERIFIED_SPLIT, "agreement",
                            "The proposers disagree on the species: \"" + top.taxonName() + "\" vs \"" + other.get(0).taxonName() + "\".",
                            Map.of("proposals", nonEmpty));
                }
            }
        } else {
            List<Proposal> only = nonEmpty.get(0);
            if (only.size() >= 2) {
                Proposal runnerUp = only.get(1);
                if (top.confidence() < SINGLE_PROPOSER_CONFIDENCE_RATIO * runnerUp.confidence()) {
                    return refuse(Verdict.NOT_VERIFIED_SPLIT, "agreement",
                            String.format("Single proposer is not confident enough: %.2f for \"%s\" vs %.2f for \"%s\" (needs %.0fx).",
                                    top.confidence(), top.taxonName(), runnerUp.confidence(), runnerUp.taxonName(), SINGLE_PROPOSER_CONFIDENCE_RATIO),
                            Map.of("proposals", nonEmpty));
                }
            }
        }

        // Rule 2: list membership
        Optional<Species> onList = resolve(top);
        if (onList.isEmpty()) {
            Map<String, Object> evidence = new LinkedHashMap<>();
            evidence.put("proposal", top);
            lookalikeOf(top.taxonName()).ifPresent(s -> evidence.put("listedLookalike", s));
            return refuse(Verdict.NOT_ON_LIST, "list",
                    "\"" + top.taxonName() + "\" is not on the Ontario invasive list.", evidence);
        }
        Species species = onList.get();

        // Rule 3: range
        RangeLookup.RangeResult range = rangeLookup.range(species.taxonId(), meta.lat(), meta.lng());
        Map<String, Object> rangeEvidence = new LinkedHashMap<>();
        rangeEvidence.put("species", species);
        rangeEvidence.put("within50Km", range.countWithin50Km());
        rangeEvidence.put("within200Km", range.countWithin200Km());
        rangeEvidence.put("nearest", range.nearest());
        if (range.countWithin200Km() == 0) {
            rangeEvidence.put("hotline", speciesList.hotline());
            return refuse(Verdict.NEW_RANGE, "range",
                    "No research-grade record of " + species.commonName() + " within 200 km in the last 3 years. Not auto-reported; call the Invading Species Hotline.",
                    rangeEvidence);
        }
        if (range.countWithin50Km() < MIN_RECORDS_WITHIN_50_KM) {
            return refuse(Verdict.INSUFFICIENT_RECORDS, "range",
                    "Only " + range.countWithin50Km() + " research-grade record(s) within 50 km; the gate needs " + MIN_RECORDS_WITHIN_50_KM + ".",
                    rangeEvidence);
        }

        // Rule 4: season
        Map<Integer, Integer> histogram = rangeLookup.monthHistogram(species.taxonId());
        int month = meta.takenAt().getMonthValue();
        boolean histogramAvailable = histogram != null && !histogram.isEmpty();
        if (histogramAvailable && histogram.getOrDefault(month, 0) == 0) {
            Map<String, Object> evidence = new LinkedHashMap<>(rangeEvidence);
            evidence.put("month", month);
            evidence.put("histogram", histogram);
            return refuse(Verdict.OUT_OF_SEASON, "season",
                    species.commonName() + " has never been recorded in Ontario in month " + month + ".", evidence);
        }

        // Pass: everything the report writer is allowed to see, and nothing else
        Map<String, Object> evidence = new LinkedHashMap<>(rangeEvidence);
        evidence.put("proposals", nonEmpty);
        evidence.put("month", month);
        evidence.put("histogram", histogramAvailable ? histogram : Map.of());
        evidence.put("seasonDataAvailable", histogramAvailable);
        evidence.put("photo", meta);
        return new GateResult(Verdict.REPORT, "all",
                species.commonName() + " (" + species.scientificName() + "): proposers agree, on the Ontario list, "
                        + range.countWithin50Km() + " records within 50 km, in season.", evidence);
    }

    private Optional<Species> resolve(Proposal p) {
        if (p.taxonId() > 0) {
            Optional<Species> byId = speciesList.byTaxonId(p.taxonId());
            if (byId.isPresent()) return byId;
        }
        return speciesList.byScientificName(p.taxonName());
    }

    private Optional<Species> lookalikeOf(String name) {
        if (name == null || name.isBlank()) return Optional.empty();
        String wanted = name.toLowerCase();
        return speciesList.all().stream()
                .filter(s -> s.lookalike() != null && s.lookalike().toLowerCase().contains(wanted))
                .findFirst();
    }

    private static boolean sameTaxon(Proposal a, Proposal b) {
        if (a.taxonId() > 0 && b.taxonId() > 0) return a.taxonId() == b.taxonId();
        return a.taxonName() != null && b.taxonName() != null
                && a.taxonName().trim().equalsIgnoreCase(b.taxonName().trim());
    }

    private static GateResult refuse(Verdict verdict, String rule, String reason, Map<String, Object> evidence) {
        return new GateResult(verdict, rule, reason, evidence);
    }
}
