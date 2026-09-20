package ca.notfromhere.sightings;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * The verified-sightings ledger. Only REPORT verdicts get in. Before a new record is written, the ledger looks for the
 * same species within DUPLICATE_RADIUS_M in the last DUPLICATE_WINDOW; if one exists, the new check is answered with
 * that record instead of creating another. Hotlines drown in duplicates; this is the app's answer to that.
 */
@Service
public class SightingService {

    static final double DUPLICATE_RADIUS_M = 100.0;
    static final Duration DUPLICATE_WINDOW = Duration.ofDays(30);

    /**
     * Where a person stood is personal data (DDIA ch. 1, "data systems, law and society"). The exact position stays in
     * the database for the duplicate check; everything public is rounded to three decimals, about 100 m.
     */
    public static double publicCoord(double v) {
        return Math.round(v * 1000.0) / 1000.0;
    }

    private final SightingRepository repository;

    public SightingService(SightingRepository repository) {
        this.repository = repository;
    }

    public Optional<Sighting> findDuplicate(long taxonId, double lat, double lng) {
        Instant since = Instant.now().minus(DUPLICATE_WINDOW);
        return repository.findByTaxonIdAndReportedAtAfter(taxonId, since).stream()
                .filter(s -> distanceMetres(lat, lng, s.getLat(), s.getLng()) <= DUPLICATE_RADIUS_M)
                .findFirst();
    }

    @Transactional
    public Sighting save(Sighting sighting) {
        return repository.save(sighting);
    }

    /** The erasure path: a record can be removed on request, and the removal is real, not a flag. */
    @Transactional
    public boolean delete(long id) {
        if (!repository.existsById(id)) return false;
        repository.deleteById(id);
        return true;
    }

    public List<Sighting> latest() {
        return repository.findTop500ByOrderByReportedAtDesc();
    }

    public Optional<Sighting> byId(long id) {
        return repository.findById(id);
    }

    /** GeoJSON FeatureCollection, one Point per sighting, properties are the columns a mapper needs. */
    public Map<String, Object> geoJson() {
        List<Map<String, Object>> features = new ArrayList<>();
        for (Sighting s : latest()) {
            features.add(Map.of(
                    "type", "Feature",
                    "geometry", Map.of("type", "Point", "coordinates", List.of(publicCoord(s.getLng()), publicCoord(s.getLat()))),
                    "properties", properties(s)));
        }
        return Map.of("type", "FeatureCollection", "features", features);
    }

    /** CSV with a fixed header. Text fields are quoted; quotes inside are doubled. */
    public String csv() {
        StringBuilder sb = new StringBuilder();
        sb.append("id,common_name,scientific_name,inat_taxon_id,latitude,longitude,observed_on,reported_at,")
          .append("views_agreeing,views_total,records_within_50km,records_within_200km,gbif_within_50km,range_source,")
          .append("camera_location_matches,photo_sha256,report_text\n");
        for (Sighting s : latest()) {
            sb.append(s.getId()).append(',')
              .append(q(s.getCommonName())).append(',')
              .append(q(s.getScientificName())).append(',')
              .append(s.getTaxonId()).append(',')
              .append(publicCoord(s.getLat())).append(',')
              .append(publicCoord(s.getLng())).append(',')
              .append(s.getObservedOn()).append(',')
              .append(s.getReportedAt()).append(',')
              .append(s.getViewsAgreeing()).append(',')
              .append(s.getViewsTotal()).append(',')
              .append(s.getRecordsWithin50Km()).append(',')
              .append(s.getRecordsWithin200Km()).append(',')
              .append(s.getGbifWithin50Km() == null ? "" : s.getGbifWithin50Km()).append(',')
              .append(q(s.getRangeSource())).append(',')
              .append(s.getCameraLocationMatches() == null ? "" : s.getCameraLocationMatches()).append(',')
              .append(q(s.getPhotoSha256())).append(',')
              .append(q(s.getReportText())).append('\n');
        }
        return sb.toString();
    }

    static Map<String, Object> properties(Sighting s) {
        Map<String, Object> p = new java.util.LinkedHashMap<>();
        p.put("id", s.getId());
        p.put("common_name", s.getCommonName());
        p.put("scientific_name", s.getScientificName());
        p.put("inat_taxon_id", s.getTaxonId());
        p.put("observed_on", s.getObservedOn().toString());
        p.put("reported_at", s.getReportedAt().toString());
        p.put("views_agreeing", s.getViewsAgreeing());
        p.put("views_total", s.getViewsTotal());
        p.put("records_within_50km", s.getRecordsWithin50Km());
        p.put("records_within_200km", s.getRecordsWithin200Km());
        p.put("gbif_within_50km", s.getGbifWithin50Km());
        p.put("range_source", s.getRangeSource());
        p.put("camera_location_matches", s.getCameraLocationMatches());
        return p;
    }

    static String q(String v) {
        if (v == null) return "";
        return '"' + v.replace("\"", "\"\"").replace("\r", "").replace("\n", " / ") + '"';
    }

    static double distanceMetres(double lat1, double lng1, double lat2, double lng2) {
        double r = 6371000.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * r * Math.asin(Math.sqrt(a));
    }
}
