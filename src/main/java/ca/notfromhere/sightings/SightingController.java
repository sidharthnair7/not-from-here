package ca.notfromhere.sightings;

import ca.notfromhere.gate.RangeLookup;
import ca.notfromhere.species.SpeciesList;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * GET /api/sightings              the ledger, newest first (feeds the record sphere for everyone)
 * GET /api/sightings/{id}         one record with its full evidence snapshot and query URLs
 * GET /api/sightings.geojson      FeatureCollection for any map
 * GET /api/sightings.csv          spreadsheet export
 * GET /api/species/{taxonId}/season   Ontario month histogram for a species ("when to look")
 */
@RestController
public class SightingController {

    private final SightingService sightings;
    private final SpeciesList speciesList;
    private final RangeLookup rangeLookup;

    public SightingController(SightingService sightings, SpeciesList speciesList, RangeLookup rangeLookup) {
        this.sightings = sightings;
        this.speciesList = speciesList;
        this.rangeLookup = rangeLookup;
    }

    @GetMapping("/api/sightings")
    public List<Map<String, Object>> list() {
        return sightings.latest().stream().map(SightingController::summary).toList();
    }

    @GetMapping("/api/sightings/{id}")
    public ResponseEntity<Map<String, Object>> one(@PathVariable long id) {
        return sightings.byId(id).map(s -> {
            Map<String, Object> m = summary(s);
            m.put("report_text", s.getReportText());
            m.put("evidence_json", s.getEvidenceJson());
            m.put("sources_json", s.getSourcesJson());
            m.put("photo_sha256", s.getPhotoSha256());
            return ResponseEntity.ok(m);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping(value = "/api/sightings.geojson", produces = "application/geo+json")
    public Map<String, Object> geoJson() {
        return sightings.geoJson();
    }

    @GetMapping(value = "/api/sightings.csv", produces = "text/csv")
    public ResponseEntity<String> csv() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"not-from-here-sightings.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=utf-8"))
                .body(sightings.csv());
    }

    @GetMapping("/api/species/{taxonId}/season")
    public ResponseEntity<Map<String, Object>> season(@PathVariable long taxonId) {
        return speciesList.byTaxonId(taxonId).map(sp -> {
            RangeLookup.Histogram h = rangeLookup.monthHistogram(taxonId);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("species", sp);
            m.put("available", h.available());
            m.put("histogram", h.counts());
            m.put("source", h.sourceUrl());
            return ResponseEntity.ok(m);
        }).orElse(ResponseEntity.notFound().build());
    }

    static Map<String, Object> summary(Sighting s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("common_name", s.getCommonName());
        m.put("scientific_name", s.getScientificName());
        m.put("inat_taxon_id", s.getTaxonId());
        m.put("lat", s.getLat());
        m.put("lng", s.getLng());
        m.put("observed_on", s.getObservedOn().toString());
        m.put("reported_at", s.getReportedAt().toString());
        m.put("views_agreeing", s.getViewsAgreeing());
        m.put("views_total", s.getViewsTotal());
        m.put("records_within_50km", s.getRecordsWithin50Km());
        m.put("records_within_200km", s.getRecordsWithin200Km());
        m.put("gbif_within_50km", s.getGbifWithin50Km());
        m.put("range_source", s.getRangeSource());
        m.put("camera_location_matches", s.getCameraLocationMatches());
        return m;
    }
}
