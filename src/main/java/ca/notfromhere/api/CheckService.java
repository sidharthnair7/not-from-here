package ca.notfromhere.api;

import ca.notfromhere.gate.Gate;
import ca.notfromhere.gate.GateResult;
import ca.notfromhere.gate.PhotoMeta;
import ca.notfromhere.gate.Proposal;
import ca.notfromhere.gate.RangeLookup;
import ca.notfromhere.gate.Verdict;
import ca.notfromhere.photo.PhotoMetadata;
import ca.notfromhere.proposer.Proposer;
import ca.notfromhere.sightings.Sighting;
import ca.notfromhere.sightings.SightingService;
import ca.notfromhere.species.Species;
import ca.notfromhere.species.SpeciesList;
import org.springframework.stereotype.Service;
import tools.jackson.databind.json.JsonMapper;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * One check: several photos of ONE subject, each photo a view. Every view goes through every configured proposer,
 * the candidates go to the gate, and the gate's answer is translated into the frontend's shape. On REPORT the
 * sighting is written to the ledger unless the same species was already reported within 100 m in the last 30 days.
 * The report text is a template filled from the gate's evidence only; no model touches it.
 */
@Service
public class CheckService {

    /** One uploaded photo. */
    public record PhotoInput(String fileName, byte[] bytes, String mimeType) {
    }

    /** What the caller claimed about where and when; any part may be missing and is then taken from EXIF or defaults. */
    public record Claim(Double lat, Double lng, LocalDate takenAt) {
    }

    static final double CAMERA_MATCH_TOLERANCE_KM = 5.0;

    private final List<Proposer> proposers;
    private final Gate gate;
    private final SpeciesList speciesList;
    private final SightingService sightings;
    private final double defaultLat;
    private final double defaultLng;
    private final JsonMapper json = JsonMapper.builder().build();

    public CheckService(List<Proposer> proposers, Gate gate, SpeciesList speciesList, SightingService sightings,
                        org.springframework.core.env.Environment env) {
        this.proposers = proposers;
        this.gate = gate;
        this.speciesList = speciesList;
        this.sightings = sightings;
        this.defaultLat = env.getProperty("nfh.default.lat", Double.class, 44.30);
        this.defaultLng = env.getProperty("nfh.default.lng", Double.class, -78.32);
    }

    public List<String> proposerNames() {
        return proposers.stream().map(Proposer::name).toList();
    }

    public CheckResponse check(List<PhotoInput> photos, Claim claim) {
        // 1. What the cameras say
        List<PhotoMetadata> metadata = photos.stream().map(p -> PhotoMetadata.read(p.bytes())).toList();

        // 2. Where and when: the user's claim wins, then the first camera GPS / date, then the defaults
        Optional<PhotoMetadata> withGps = metadata.stream().filter(PhotoMetadata::hasGps).findFirst();
        double lat = claim.lat() != null ? claim.lat() : withGps.map(PhotoMetadata::gpsLat).orElse(defaultLat);
        double lng = claim.lng() != null ? claim.lng() : withGps.map(PhotoMetadata::gpsLng).orElse(defaultLng);
        LocalDate takenAt = claim.takenAt() != null ? claim.takenAt()
                : metadata.stream().map(PhotoMetadata::takenAt).filter(d -> d != null).findFirst().orElse(LocalDate.now());
        PhotoMeta meta = new PhotoMeta(lat, lng, takenAt);

        // 3. Photo integrity evidence: never a refusal, always shown
        List<CheckResponse.PhotoIntegrityOut> integrity = new ArrayList<>();
        for (int i = 0; i < photos.size(); i++) {
            PhotoMetadata m = metadata.get(i);
            Double distance = null;
            Boolean matches = null;
            if (m.hasGps() && claim.lat() != null && claim.lng() != null) {
                distance = Math.round(haversineKm(claim.lat(), claim.lng(), m.gpsLat(), m.gpsLng()) * 10) / 10.0;
                matches = distance <= CAMERA_MATCH_TOLERANCE_KM;
            }
            integrity.add(new CheckResponse.PhotoIntegrityOut(photos.get(i).fileName(), m.hasExif(), m.hasGps(),
                    m.takenAt() == null ? null : m.takenAt().toString(), m.camera(), matches, distance));
        }

        // 4. Every view through every proposer
        List<List<Proposal>> runs = new ArrayList<>();
        for (int i = 0; i < photos.size(); i++) {
            for (Proposer p : proposers) {
                String view = photos.size() > 1 ? "#view" + (i + 1) : "";
                List<Proposal> run = p.propose(photos.get(i).bytes(), photos.get(i).mimeType()).stream()
                        .map(pr -> new Proposal(pr.taxonName(), pr.taxonId(), pr.confidence(), pr.source() + view))
                        .toList();
                runs.add(run);
            }
        }

        // 5. The gate decides
        GateResult result = gate.evaluate(runs, meta);

        // 6. The ledger, only on REPORT
        Long sightingId = null;
        Long duplicateOf = null;
        boolean alreadyReported = false;
        if (result.passed()) {
            Species species = (Species) result.evidence().get("species");
            Optional<Sighting> existing = sightings.findDuplicate(species.taxonId(), lat, lng);
            if (existing.isPresent()) {
                alreadyReported = true;
                duplicateOf = existing.get().getId();
                sightingId = existing.get().getId();
            } else {
                CheckResponse draft = toResponse(runs, result, meta, null, false, null, integrity);
                sightingId = sightings.save(toSighting(result, meta, integrity, photos, json.writeValueAsString(draft))).getId();
            }
        }

        return toResponse(runs, result, meta, sightingId, alreadyReported, duplicateOf, integrity);
    }

    @SuppressWarnings("unchecked")
    private Sighting toSighting(GateResult result, PhotoMeta meta, List<CheckResponse.PhotoIntegrityOut> integrity,
                                List<PhotoInput> photos, String responseJson) {
        Map<String, Object> ev = result.evidence();
        Species species = (Species) ev.get("species");
        Map<String, Object> agreement = (Map<String, Object>) ev.get("agreement");
        Map<String, Object> gbif = ev.get("gbif") instanceof Map<?, ?> m ? (Map<String, Object>) m : null;
        List<String> sources = ev.get("sources") instanceof List<?> l ? (List<String>) l : List.of();
        Boolean cameraMatches = integrity.stream().map(CheckResponse.PhotoIntegrityOut::camera_location_matches)
                .filter(b -> b != null).findFirst().orElse(null);
        List<CheckResponse.NearestOut> nearest = nearest(ev);
        String monthName = meta.takenAt().getMonth().getDisplayName(TextStyle.FULL, Locale.CANADA);
        String reportText = reportText(ev, meta, (int) ev.get("within50Km"), nearest, monthName);
        return new Sighting(species.taxonId(), species.scientificName(), species.commonName(), meta.lat(), meta.lng(),
                meta.takenAt(), Instant.now(),
                (Integer) agreement.get("agreeing"), (Integer) agreement.get("views"),
                (Integer) ev.get("within50Km"), (Integer) ev.get("within200Km"),
                gbif == null ? null : (Integer) gbif.get("within50Km"),
                String.valueOf(ev.get("rangeSource")),
                photos.isEmpty() ? null : sha256(photos.get(0).bytes()),
                cameraMatches, reportText, json.writeValueAsString(ev), json.writeValueAsString(sources), responseJson);
    }

    @SuppressWarnings("unchecked")
    CheckResponse toResponse(List<List<Proposal>> runs, GateResult result, PhotoMeta meta, Long sightingId,
                             boolean alreadyReported, Long duplicateOf, List<CheckResponse.PhotoIntegrityOut> integrity) {
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
        String topName = ev.get("species") instanceof Species s ? s.scientificName()
                : top == null ? "(no candidate)" : top.taxonName();

        int within50 = ev.get("within50Km") instanceof Integer i ? i : 0;
        int within200 = ev.get("within200Km") instanceof Integer i ? i : 0;
        List<CheckResponse.NearestOut> nearest = nearest(ev);
        Map<String, Object> gbif = ev.get("gbif") instanceof Map<?, ?> m ? (Map<String, Object>) m : null;

        Map<Integer, Integer> histogram = ev.get("histogram") instanceof Map<?, ?> m ? (Map<Integer, Integer>) m : Map.of();
        List<Integer> hist = new ArrayList<>();
        for (int mo = 1; mo <= 12; mo++) hist.add(histogram.getOrDefault(mo, 0));
        int month = meta.takenAt().getMonthValue();
        String monthName = meta.takenAt().getMonth().getDisplayName(TextStyle.FULL, Locale.CANADA);

        Map<String, Object> agreementMap = ev.get("agreement") instanceof Map<?, ?> m ? (Map<String, Object>) m : Map.of();
        CheckResponse.AgreementOut agreement = new CheckResponse.AgreementOut(
                agreementMap.get("views") instanceof Integer v ? v : runs.size(),
                agreementMap.get("agreeing") instanceof Integer a ? a : 0,
                agreementMap.get("needed") instanceof Integer n ? n : null);

        // The four trace lines: rules before the failure get their pass text, the failing rule gets the reason,
        // rules after it stay null (never evaluated).
        List<String> trace = new ArrayList<>(4);
        trace.add(failIdx == 1 ? result.reason() : agreementText(runs, topName, agreement));
        trace.add(failIdx == 2 ? result.reason() : topName + " is on the Ontario list");
        trace.add(failIdx == 3 ? result.reason()
                : within50 + " research-grade records within 50 km, last 3 years"
                + (nearest.isEmpty() ? "" : ". Nearest " + nearest.get(0).distance_km() + " km")
                + (gbif == null ? "" : ". GBIF agrees: " + gbif.get("within50Km") + " within 50 km"));
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
                new CheckResponse.RangeOut(50, 3, within50, within200, String.valueOf(ev.getOrDefault("rangeSource", "")),
                        gbif == null ? null : (Integer) gbif.get("within50Km"),
                        gbif == null ? null : (Integer) gbif.get("within200Km")),
                new CheckResponse.SeasonOut(month, hist),
                proposals,
                ev);

        String reportText = verdict == Verdict.REPORT ? reportText(ev, meta, within50, nearest, monthName) : null;
        String reason = alreadyReported
                ? result.reason() + " Already reported within 100 m in the last 30 days; see sighting " + duplicateOf + "."
                : result.reason();
        List<String> sources = ev.get("sources") instanceof List<?> l ? (List<String>) l : List.of();

        Species.Guide howToTell = ev.get("howToTell") instanceof Species.Guide g ? g : null;

        // When nothing was named at all, say what the proposers on this server can name, so a person who dropped
        // an insect photo on a plants-only server learns that instead of guessing the app is broken.
        String note = null;
        if (top == null) {
            String scopes = String.join("; ", proposers.stream().map(Proposer::scope).distinct().toList());
            note = "Nothing was recognised in this photo. The proposer on this server covers " + scopes + ".";
        }

        String hotline = ev.get("hotline") instanceof String h ? h : null;

        return new CheckResponse(verdict.name(), ruleLabel, reason, proposals, trace, nearest, hist, month,
                evidence, reportText, sightingId, alreadyReported, duplicateOf, sources, integrity, agreement, howToTell,
                note, hotline);
    }

    @SuppressWarnings("unchecked")
    private static List<CheckResponse.NearestOut> nearest(Map<String, Object> ev) {
        List<RangeLookup.Observation> observations = ev.get("nearest") instanceof List<?> l
                ? (List<RangeLookup.Observation>) l : List.of();
        return observations.stream()
                .map(o -> new CheckResponse.NearestOut(o.observedOn(), o.distanceKm(), o.place(), o.url(), o.lat(), o.lng()))
                .toList();
    }

    private CheckResponse.ProposalOut toProposalOut(List<Proposal> run) {
        String source = run.isEmpty() ? "unknown" : run.get(0).source();
        List<CheckResponse.CandidateOut> list = run.stream().map(p -> new CheckResponse.CandidateOut(
                p.taxonName(),
                speciesList.byScientificName(p.taxonName()).map(Species::commonName).orElse(null),
                p.confidence())).toList();
        return new CheckResponse.ProposalOut(source, list);
    }

    private static String agreementText(List<List<Proposal>> runs, String topName, CheckResponse.AgreementOut agreement) {
        List<List<Proposal>> nonEmpty = runs.stream().filter(r -> !r.isEmpty()).toList();
        if (nonEmpty.size() >= 2) {
            return agreement.agreeing() + " of " + agreement.views() + " views name " + topName;
        }
        if (nonEmpty.size() == 1) {
            List<Proposal> only = nonEmpty.get(0);
            String runner = only.size() > 1
                    ? " vs " + only.get(1).taxonName() + " " + String.format("%.2f", only.get(1).confidence())
                    : "";
            return "Single view: " + topName + " " + String.format("%.2f", only.get(0).confidence()) + runner;
        }
        return "No proposer produced a candidate";
    }

    @SuppressWarnings("unchecked")
    private static String reportText(Map<String, Object> ev, PhotoMeta meta, int within50,
                                     List<CheckResponse.NearestOut> nearest, String monthName) {
        Species s = (Species) ev.get("species");
        Map<String, Object> agreement = ev.get("agreement") instanceof Map<?, ?> m ? (Map<String, Object>) m : Map.of();
        Map<String, Object> gbif = ev.get("gbif") instanceof Map<?, ?> m ? (Map<String, Object>) m : null;
        int views = agreement.get("views") instanceof Integer v ? v : 1;
        int agreeing = agreement.get("agreeing") instanceof Integer a ? a : 1;
        String identification = views >= 2
                ? agreeing + " of " + views + " independent views agreed"
                : "one view, top candidate at least 2x its runner-up";
        return "Suspected invasive species report\n\n"
                + "Species: " + s.scientificName() + " (" + s.commonName() + ")\n"
                + "Observed: " + meta.takenAt() + " at " + String.format("%.3f, %.3f", meta.lat(), meta.lng()) + "\n"
                + "Identification: " + identification + ".\n"
                + "Listed as invasive in Ontario.\n"
                + "Nearby records: " + within50 + " research-grade iNaturalist observations within 50 km in the last 3 years"
                + (nearest.isEmpty() ? "" : "; nearest " + nearest.get(0).distance_km() + " km (" + nearest.get(0).date() + ")")
                + (gbif == null ? "" : "; GBIF: " + gbif.get("within50Km") + " occurrences within 50 km") + ".\n"
                + "Season: recorded in Ontario in " + monthName + ".\n\n"
                + "Drafted from the gate's evidence only. Please check before sending.";
    }

    static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double r = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * r * Math.asin(Math.sqrt(a));
    }

    static String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
