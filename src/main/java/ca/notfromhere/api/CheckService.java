package ca.notfromhere.api;

import ca.notfromhere.gate.Gate;
import ca.notfromhere.gate.GateResult;
import ca.notfromhere.gate.PhotoMeta;
import ca.notfromhere.gate.Proposal;
import ca.notfromhere.gate.RangeLookup;
import ca.notfromhere.gate.Verdict;
import ca.notfromhere.proposer.Proposer;
import ca.notfromhere.species.Species;
import ca.notfromhere.species.SpeciesList;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Runs every configured proposer on the photo, hands the candidates to the gate, and translates the gate's answer
 * into the frontend's shape. The report text is a template filled from the gate's evidence only; no model touches it.
 */
@Service
public class CheckService {

    private final List<Proposer> proposers;
    private final Gate gate;
    private final SpeciesList speciesList;

    public CheckService(List<Proposer> proposers, Gate gate, SpeciesList speciesList) {
        this.proposers = proposers;
        this.gate = gate;
        this.speciesList = speciesList;
    }

    public List<String> proposerNames() {
        return proposers.stream().map(Proposer::name).toList();
    }

    public CheckResponse check(byte[] photo, String mimeType, PhotoMeta meta) {
        List<List<Proposal>> runs = new ArrayList<>();
        for (Proposer p : proposers) {
            runs.add(p.propose(photo, mimeType));
        }
        GateResult result = gate.evaluate(runs, meta);
        return toResponse(runs, result, meta);
    }

    @SuppressWarnings("unchecked")
    CheckResponse toResponse(List<List<Proposal>> runs, GateResult result, PhotoMeta meta) {
        Map<String, Object> ev = result.evidence();
        Verdict verdict = result.verdict();
        int failIdx = switch (result.rule()) {
            case "agreement" -> 1;
            case "list" -> 2;
            case "range" -> 3;
            case "season" -> 4;
            default -> 0;
        };

        List<CheckResponse.ProposalOut> proposals = runs.stream().map(this::toProposalOut).toList();
        Proposal top = runs.stream().filter(r -> !r.isEmpty()).map(r -> r.get(0)).findFirst().orElse(null);
        String topName = top == null ? "(no candidate)" : top.taxonName();

        int within50 = ev.get("within50Km") instanceof Integer i ? i : 0;
        int within200 = ev.get("within200Km") instanceof Integer i ? i : 0;
        List<RangeLookup.Observation> observations = ev.get("nearest") instanceof List<?> l
                ? (List<RangeLookup.Observation>) l : List.of();
        List<CheckResponse.NearestOut> nearest = observations.stream()
                .map(o -> new CheckResponse.NearestOut(o.observedOn(), o.distanceKm(), o.place(), o.url())).toList();

        Map<Integer, Integer> histogram = ev.get("histogram") instanceof Map<?, ?> m ? (Map<Integer, Integer>) m : Map.of();
        List<Integer> hist = new ArrayList<>();
        for (int mo = 1; mo <= 12; mo++) hist.add(histogram.getOrDefault(mo, 0));
        int month = meta.takenAt().getMonthValue();
        String monthName = meta.takenAt().getMonth().getDisplayName(TextStyle.FULL, Locale.CANADA);

        // The four trace lines: rules before the failure get their pass text, the failing rule gets the reason,
        // rules after it stay null (never evaluated).
        List<String> trace = new ArrayList<>(4);
        trace.add(failIdx == 1 ? result.reason() : agreementText(runs, topName));
        trace.add(failIdx == 2 ? result.reason() : topName + " is on the Ontario list");
        trace.add(failIdx == 3 ? result.reason()
                : within50 + " research-grade records within 50 km, last 3 years"
                + (nearest.isEmpty() ? "" : ". Nearest " + nearest.get(0).distance_km() + " km"));
        trace.add(failIdx == 4 ? result.reason() : monthName + ": " + hist.get(month - 1) + " Ontario records");
        for (int i = 0; i < 4; i++) {
            if (failIdx > 0 && i + 1 > failIdx) trace.set(i, null);
        }

        String ruleLabel = switch (failIdx) {
            case 1 -> "Decided by rule 1: proposal agreement";
            case 2 -> "Decided by rule 2: Ontario invasive list";
            case 3 -> "Decided by rule 3: range check";
            case 4 -> "Decided by rule 4: season check";
            default -> "All four rules passed";
        };

        CheckResponse.EvidenceOut evidence = new CheckResponse.EvidenceOut(
                failIdx == 0 ? null : failIdx,
                new CheckResponse.TaxonOut(topName, failIdx != 2 && top != null),
                new CheckResponse.RangeOut(50, 3, within50, within200),
                new CheckResponse.SeasonOut(month, hist),
                proposals,
                ev);

        String reportText = verdict == Verdict.REPORT ? reportText(ev, meta, runs, within50, nearest, monthName) : null;

        return new CheckResponse(verdict.name(), ruleLabel, result.reason(), proposals, trace, nearest, hist, month,
                evidence, reportText);
    }

    private CheckResponse.ProposalOut toProposalOut(List<Proposal> run) {
        String source = run.isEmpty() ? "unknown" : run.get(0).source();
        List<CheckResponse.CandidateOut> list = run.stream().map(p -> new CheckResponse.CandidateOut(
                p.taxonName(),
                speciesList.byScientificName(p.taxonName()).map(Species::commonName).orElse(null),
                p.confidence())).toList();
        return new CheckResponse.ProposalOut(source, list);
    }

    private static String agreementText(List<List<Proposal>> runs, String topName) {
        List<List<Proposal>> nonEmpty = runs.stream().filter(r -> !r.isEmpty()).toList();
        if (nonEmpty.size() >= 2) {
            return "Both proposers name " + topName + " ("
                    + String.format("%.2f", nonEmpty.get(0).get(0).confidence()) + " and "
                    + String.format("%.2f", nonEmpty.get(1).get(0).confidence()) + ")";
        }
        if (nonEmpty.size() == 1) {
            List<Proposal> only = nonEmpty.get(0);
            String runner = only.size() > 1
                    ? " vs " + only.get(1).taxonName() + " " + String.format("%.2f", only.get(1).confidence())
                    : "";
            return "Single proposer: " + topName + " " + String.format("%.2f", only.get(0).confidence()) + runner;
        }
        return "No proposer produced a candidate";
    }

    private static String reportText(Map<String, Object> ev, PhotoMeta meta, List<List<Proposal>> runs, int within50,
                                     List<CheckResponse.NearestOut> nearest, String monthName) {
        Species s = (Species) ev.get("species");
        List<List<Proposal>> nonEmpty = runs.stream().filter(r -> !r.isEmpty()).toList();
        String identification = nonEmpty.size() >= 2
                ? "two independent proposers agreed (" + String.format("%.2f", nonEmpty.get(0).get(0).confidence())
                + " and " + String.format("%.2f", nonEmpty.get(1).get(0).confidence()) + ")"
                : "one proposer, " + String.format("%.2f", nonEmpty.get(0).get(0).confidence()) + " confidence, at least 2x its runner-up";
        return "Suspected invasive species report\n\n"
                + "Species: " + s.scientificName() + " (" + s.commonName() + ")\n"
                + "Observed: " + meta.takenAt() + " at " + String.format("%.3f, %.3f", meta.lat(), meta.lng()) + "\n"
                + "Identification: " + identification + ".\n"
                + "Listed as invasive in Ontario.\n"
                + "Nearby records: " + within50 + " research-grade iNaturalist observations within 50 km in the last 3 years"
                + (nearest.isEmpty() ? "" : "; nearest " + nearest.get(0).distance_km() + " km (" + nearest.get(0).date() + ")") + ".\n"
                + "Season: recorded in Ontario in " + monthName + ".\n\n"
                + "Drafted from the gate's evidence only. Please check before sending.";
    }

    static LocalDate today() {
        return LocalDate.now();
    }
}
