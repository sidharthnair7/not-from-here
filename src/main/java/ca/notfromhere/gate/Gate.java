package ca.notfromhere.gate;

import ca.notfromhere.species.Species;
import ca.notfromhere.species.SpeciesList;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
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
 *   <li>Agreement. One view: the top pick must be at least 2x as confident as the runner-up. Two or more views
 *       (several photos of the same subject, or several proposers): at least two thirds of the views, and never
 *       fewer than two, must name the same top species.</li>
 *   <li>List membership: the species must be on ontario_invasives.json.</li>
 *   <li>Range: at least 3 research-grade iNaturalist records within 50 km in the last 3 years. Zero within
 *       200 km is NEW_RANGE (never auto-reported; routed to the hotline). GBIF is counted beside it as an
 *       independent corroboration, and decides the rule on its own only when iNaturalist cannot be reached.</li>
 *   <li>Season: the photo's month must have a non-zero count in the Ontario month histogram.</li>
 * </ol>
 * Every decision carries the URLs of the queries it was made from.
 */
@Component
public class Gate {

    static final int MIN_RECORDS_WITHIN_50_KM = 3;
    static final double SINGLE_PROPOSER_CONFIDENCE_RATIO = 2.0;

    private final SpeciesList speciesList;
    private final RangeLookup rangeLookup;
    private final OccurrenceLookup occurrenceLookup;

    public Gate(SpeciesList speciesList, RangeLookup rangeLookup, OccurrenceLookup occurrenceLookup) {
        this.speciesList = speciesList;
        this.rangeLookup = rangeLookup;
        this.occurrenceLookup = occurrenceLookup;
    }

    /**
     * @param runs one list of proposals per view (a photo run through a proposer), each list best-first
     * @param meta where and when the photo was taken
     */
    public GateResult evaluate(List<List<Proposal>> runs, PhotoMeta meta) {
        List<List<Proposal>> views = runs == null ? List.of() : runs.stream().filter(r -> r != null && !r.isEmpty()).toList();
        if (views.isEmpty()) {
            return refuse(Verdict.NOT_VERIFIED_SPLIT, "agreement", "No proposer produced a candidate.",
                    Map.of("proposals", runs == null ? List.of() : runs));
        }

        // Rule 1: agreement
        Map<String, Object> agreement = new LinkedHashMap<>();
        agreement.put("views", views.size());
        Proposal top;
        if (views.size() == 1) {
            List<Proposal> only = views.get(0);
            top = only.get(0);
            agreement.put("agreeing", 1);
            if (only.size() >= 2) {
                Proposal runnerUp = only.get(1);
                if (top.confidence() < SINGLE_PROPOSER_CONFIDENCE_RATIO * runnerUp.confidence()) {
                    Map<String, Object> evidence = new LinkedHashMap<>();
                    evidence.put("proposals", views);
                    evidence.put("agreement", agreement);
                    guideFor(views, null).ifPresent(g -> evidence.put("howToTell", g));
                    return refuse(Verdict.NOT_VERIFIED_SPLIT, "agreement",
                            String.format("Single view is not confident enough: %.2f for \"%s\" vs %.2f for \"%s\" (needs %.0fx).",
                                    top.confidence(), top.taxonName(), runnerUp.confidence(), runnerUp.taxonName(), SINGLE_PROPOSER_CONFIDENCE_RATIO),
                            evidence);
                }
            }
        } else {
            // majority of top-1 picks across views
            Map<String, List<Proposal>> byTaxon = new LinkedHashMap<>();
            for (List<Proposal> v : views) byTaxon.computeIfAbsent(key(v.get(0)), k -> new ArrayList<>()).add(v.get(0));
            List<Proposal> majority = byTaxon.values().stream().max((a, b) -> Integer.compare(a.size(), b.size())).orElseThrow();
            int needed = Math.max(2, (int) Math.ceil(views.size() * 2.0 / 3.0));
            agreement.put("agreeing", majority.size());
            agreement.put("needed", needed);
            agreement.put("topPicks", views.stream().map(v -> v.get(0)).toList());
            if (majority.size() < needed) {
                Map<String, Object> evidence = new LinkedHashMap<>();
                evidence.put("proposals", views);
                evidence.put("agreement", agreement);
                guideFor(views, null).ifPresent(g -> evidence.put("howToTell", g));
                return refuse(Verdict.NOT_VERIFIED_SPLIT, "agreement",
                        "The views do not agree on the species: " + majority.size() + " of " + views.size()
                                + " name \"" + majority.get(0).taxonName() + "\" (needs " + needed + ").",
                        evidence);
            }
            top = majority.stream().max((a, b) -> Double.compare(a.confidence(), b.confidence())).orElseThrow();
        }

        // Rule 2: list membership
        Optional<Species> onList = resolve(top);
        if (onList.isEmpty()) {
            Map<String, Object> evidence = new LinkedHashMap<>();
            evidence.put("proposal", top);
            evidence.put("proposals", views);
            evidence.put("agreement", agreement);
            Optional<Species> listed = lookalikeOf(top.taxonName());
            listed.ifPresent(s -> evidence.put("listedLookalike", s));
            guideFor(views, listed.orElse(null)).ifPresent(g -> evidence.put("howToTell", g));
            return refuse(Verdict.NOT_ON_LIST, "list",
                    "\"" + top.taxonName() + "\" is not on the Ontario invasive list.", evidence);
        }
        Species species = onList.get();

        // Rule 3: range, iNaturalist decides, GBIF corroborates (and decides only if iNaturalist is unreachable)
        RangeLookup.RangeResult inat = rangeLookup.range(species.taxonId(), meta.lat(), meta.lng());
        Optional<OccurrenceLookup.Corroboration> gbif = occurrenceLookup.corroborate(species.scientificName(), meta.lat(), meta.lng());

        List<String> sources = new ArrayList<>(inat.sourceUrls());
        gbif.ifPresent(g -> sources.addAll(g.sourceUrls()));

        Map<String, Object> rangeEvidence = new LinkedHashMap<>();
        rangeEvidence.put("species", species);
        rangeEvidence.put("proposals", views);
        rangeEvidence.put("agreement", agreement);
        int within50, within200;
        if (inat.available()) {
            within50 = inat.countWithin50Km();
            within200 = inat.countWithin200Km();
            rangeEvidence.put("rangeSource", "inaturalist");
        } else if (gbif.isPresent()) {
            within50 = gbif.get().countWithin50Km();
            within200 = gbif.get().countWithin200Km();
            rangeEvidence.put("rangeSource", "gbif (iNaturalist unavailable)");
        } else {
            rangeEvidence.put("rangeSource", "none");
            rangeEvidence.put("sources", sources);
            return refuse(Verdict.INSUFFICIENT_RECORDS, "range",
                    "Neither iNaturalist nor GBIF could be reached, so the range cannot be verified. Nothing is reported on a guess.",
                    rangeEvidence);
        }
        rangeEvidence.put("within50Km", within50);
        rangeEvidence.put("within200Km", within200);
        rangeEvidence.put("nearest", inat.nearest());
        gbif.ifPresent(g -> rangeEvidence.put("gbif", Map.of("taxonKey", g.taxonKey(),
                "within50Km", g.countWithin50Km(), "within200Km", g.countWithin200Km())));
        rangeEvidence.put("sources", sources);

        if (within200 == 0) {
            rangeEvidence.put("hotline", speciesList.hotline());
            return refuse(Verdict.NEW_RANGE, "range",
                    "No research-grade record of " + species.commonName() + " within 200 km in the last 3 years. Not auto-reported; call the Invading Species Hotline, " + speciesList.hotline() + ".",
                    rangeEvidence);
        }
        if (within50 < MIN_RECORDS_WITHIN_50_KM) {
            return refuse(Verdict.INSUFFICIENT_RECORDS, "range",
                    "Only " + within50 + " research-grade record(s) within 50 km; the gate needs " + MIN_RECORDS_WITHIN_50_KM + ".",
                    rangeEvidence);
        }

        // Rule 4: season
        RangeLookup.Histogram histogram = rangeLookup.monthHistogram(species.taxonId());
        int month = meta.takenAt().getMonthValue();
        if (histogram.available()) sources.add(histogram.sourceUrl());
        if (histogram.available() && histogram.counts().getOrDefault(month, 0) == 0) {
            Map<String, Object> evidence = new LinkedHashMap<>(rangeEvidence);
            evidence.put("month", month);
            evidence.put("histogram", histogram.counts());
            return refuse(Verdict.OUT_OF_SEASON, "season",
                    species.commonName() + " has never been recorded in Ontario in month " + month + ".", evidence);
        }

        // Pass: everything the report writer is allowed to see, and nothing else
        Map<String, Object> evidence = new LinkedHashMap<>(rangeEvidence);
        evidence.put("month", month);
        evidence.put("histogram", histogram.available() ? histogram.counts() : Map.of());
        evidence.put("seasonDataAvailable", histogram.available());
        evidence.put("photo", meta);
        return new GateResult(Verdict.REPORT, "all",
                species.commonName() + " (" + species.scientificName() + "): " + agreement.get("agreeing") + " of "
                        + agreement.get("views") + " view(s) agree, on the Ontario list, "
                        + within50 + " records within 50 km, in season.", evidence);
    }

    private static String key(Proposal p) {
        return p.taxonId() > 0 ? "id:" + p.taxonId() : "name:" + (p.taxonName() == null ? "" : p.taxonName().trim().toLowerCase());
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

    private static GateResult refuse(Verdict verdict, String rule, String reason, Map<String, Object> evidence) {
        return new GateResult(verdict, rule, reason, evidence);
    }

    /**
     * For a refusal about identity (rules 1 and 2): the guide of the first listed species that appears anywhere in the
     * candidates, or of the listed species whose lookalike was named. "That's cow parsnip, and here is how giant hogweed
     * differs" is more useful to a person in a field than the refusal alone.
     */
    private Optional<Species.Guide> guideFor(List<List<Proposal>> views, Species listedLookalikeOf) {
        if (listedLookalikeOf != null && listedLookalikeOf.guide() != null) return Optional.of(listedLookalikeOf.guide());
        for (List<Proposal> v : views) {
            for (Proposal p : v) {
                Optional<Species> sp = resolve(p);
                if (sp.isPresent() && sp.get().guide() != null) return Optional.of(sp.get().guide());
                Optional<Species> la = lookalikeOf(p.taxonName());
                if (la.isPresent() && la.get().guide() != null) return Optional.of(la.get().guide());
            }
        }
        return Optional.empty();
    }
}
