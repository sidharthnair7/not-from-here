package ca.notfromhere.inat;

import ca.notfromhere.gate.RangeLookup;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The gate's window on the world: iNaturalist's public API, no key. Every response is cached on disk keyed by a
 * hash of the URL, and the cache is read BEFORE the network, so a demo recorded once keeps working with the
 * Wi-Fi off. Endpoints verified live on 2026-09-19:
 *   GET /v1/observations?taxon_id=&lat=&lng=&radius=&quality_grade=research&d1=&per_page=&order_by=observed_on
 *   GET /v1/observations/histogram?interval=month_of_year&taxon_id=&place_id=6883   (6883 = Ontario)
 */
@Component
public class INatClient implements RangeLookup {

    static final String BASE = "https://api.inaturalist.org/v1";
    static final int ONTARIO_PLACE_ID = 6883;
    static final int NEAREST_TO_KEEP = 5;

    private final RestClient http;
    private final JsonMapper json = JsonMapper.builder().build();
    private final Path cacheDir;

    public INatClient(@Value("${nfh.cache.dir:./cache}") String cacheDir) {
        this.http = RestClient.builder()
                .baseUrl(BASE)
                .defaultHeader("User-Agent", "not-from-here (student hackathon project; Peterborough, ON)")
                .build();
        this.cacheDir = Path.of(cacheDir);
    }

    @Override
    public RangeResult range(long taxonId, double lat, double lng) {
        // d1 is rounded to the first of the month so the cache key is stable for the whole month
        String since = LocalDate.now().minusYears(3).withDayOfMonth(1).toString();
        JsonNode near = get(String.format(
                "/observations?taxon_id=%d&lat=%.4f&lng=%.4f&radius=50&quality_grade=research&d1=%s&per_page=50&order_by=observed_on",
                taxonId, lat, lng, since));
        JsonNode wide = get(String.format(
                "/observations?taxon_id=%d&lat=%.4f&lng=%.4f&radius=200&quality_grade=research&d1=%s&per_page=1",
                taxonId, lat, lng, since));

        int within50 = near.path("total_results").asInt(0);
        int within200 = wide.path("total_results").asInt(0);

        List<Observation> nearest = new ArrayList<>();
        for (JsonNode o : near.path("results")) {
            String loc = o.path("location").asText(""); // "lat,lng"
            double distance = Double.NaN;
            if (loc.contains(",")) {
                String[] parts = loc.split(",");
                distance = haversineKm(lat, lng, Double.parseDouble(parts[0]), Double.parseDouble(parts[1]));
            }
            nearest.add(new Observation(o.path("id").asLong(), o.path("observed_on").asText(""),
                    Math.round(distance * 10) / 10.0, o.path("uri").asText("")));
        }
        nearest.sort((a, b) -> Double.compare(a.distanceKm(), b.distanceKm()));
        if (nearest.size() > NEAREST_TO_KEEP) nearest = nearest.subList(0, NEAREST_TO_KEEP);

        return new RangeResult(within50, within200, List.copyOf(nearest));
    }

    @Override
    public Map<Integer, Integer> monthHistogram(long taxonId) {
        JsonNode node = get(String.format(
                "/observations/histogram?interval=month_of_year&taxon_id=%d&place_id=%d", taxonId, ONTARIO_PLACE_ID));
        Map<Integer, Integer> histogram = new LinkedHashMap<>();
        JsonNode months = node.path("results").path("month_of_year");
        for (int m = 1; m <= 12; m++) {
            histogram.put(m, months.path(String.valueOf(m)).asInt(0));
        }
        return histogram;
    }

    /** Cache first, network second, and on a network failure an empty object so the gate can still decide. */
    JsonNode get(String pathAndQuery) {
        Path cached = cacheDir.resolve(sha256(BASE + pathAndQuery) + ".json");
        try {
            if (Files.exists(cached)) {
                return json.readTree(Files.readString(cached, StandardCharsets.UTF_8));
            }
            String body = http.get().uri(pathAndQuery).retrieve().body(String.class);
            if (body == null) body = "{}";
            Files.createDirectories(cacheDir);
            Files.writeString(cached, body, StandardCharsets.UTF_8);
            return json.readTree(body);
        } catch (IOException | RuntimeException e) {
            return json.readTree("{}");
        }
    }

    static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double r = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * r * Math.asin(Math.sqrt(a));
    }

    static String sha256(String s) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
