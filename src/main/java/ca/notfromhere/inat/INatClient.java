package ca.notfromhere.inat;

import ca.notfromhere.gate.RangeLookup;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * The gate's window on the world: iNaturalist's public API, no key. Endpoints verified live on 2026-09-19:
 *   GET /v1/observations?taxon_id=&lat=&lng=&radius=&quality_grade=research&d1=&per_page=&order_by=observed_on
 *   GET /v1/observations/histogram?interval=month_of_year&taxon_id=&place_id=6883   (6883 = Ontario)
 * Every result carries the URLs it came from, so a hotline operator can open the same query and see the same count.
 */
@Component
public class INatClient implements RangeLookup {

    static final String BASE = "https://api.inaturalist.org/v1";
    static final int ONTARIO_PLACE_ID = 6883;
    static final int NEAREST_TO_KEEP = 5;

    private final CachedHttp http;

    public INatClient(@Value("${nfh.cache.dir:./cache}") String cacheDir) {
        this.http = new CachedHttp(BASE, Path.of(cacheDir), "not-from-here (student hackathon project; Peterborough, ON)");
    }

    @Override
    public RangeResult range(long taxonId, double lat, double lng) {
        // d1 is rounded to the first of the month so the cache key is stable for the whole month
        String since = LocalDate.now().minusYears(3).withDayOfMonth(1).toString();
        String nearQuery = String.format(
                "/observations?taxon_id=%d&lat=%.4f&lng=%.4f&radius=50&quality_grade=research&d1=%s&per_page=50&order_by=observed_on",
                taxonId, lat, lng, since);
        String wideQuery = String.format(
                "/observations?taxon_id=%d&lat=%.4f&lng=%.4f&radius=200&quality_grade=research&d1=%s&per_page=1",
                taxonId, lat, lng, since);
        List<String> sources = List.of(http.url(nearQuery), http.url(wideQuery));

        Optional<JsonNode> near = http.get(nearQuery);
        Optional<JsonNode> wide = http.get(wideQuery);
        if (near.isEmpty() || wide.isEmpty()) {
            return RangeResult.unavailable(sources);
        }

        int within50 = near.get().path("total_results").asInt(0);
        int within200 = wide.get().path("total_results").asInt(0);

        List<Observation> nearest = new ArrayList<>();
        for (JsonNode o : near.get().path("results")) {
            String loc = o.path("location").asText(""); // "lat,lng"
            double oLat = Double.NaN, oLng = Double.NaN, distance = Double.NaN;
            if (loc.contains(",")) {
                String[] parts = loc.split(",");
                oLat = Double.parseDouble(parts[0]);
                oLng = Double.parseDouble(parts[1]);
                distance = CachedHttp.haversineKm(lat, lng, oLat, oLng);
            }
            nearest.add(new Observation(o.path("id").asLong(), o.path("observed_on").asText(""),
                    Math.round(distance * 10) / 10.0, oLat, oLng, o.path("place_guess").asText(""), o.path("uri").asText("")));
        }
        nearest.sort((a, b) -> Double.compare(a.distanceKm(), b.distanceKm()));
        if (nearest.size() > NEAREST_TO_KEEP) nearest = nearest.subList(0, NEAREST_TO_KEEP);

        return new RangeResult(true, within50, within200, List.copyOf(nearest), sources);
    }

    @Override
    public Histogram monthHistogram(long taxonId) {
        String query = String.format(
                "/observations/histogram?interval=month_of_year&taxon_id=%d&place_id=%d", taxonId, ONTARIO_PLACE_ID);
        Optional<JsonNode> node = http.get(query);
        if (node.isEmpty()) return Histogram.unavailable(http.url(query));
        Map<Integer, Integer> counts = new LinkedHashMap<>();
        JsonNode months = node.get().path("results").path("month_of_year");
        for (int m = 1; m <= 12; m++) {
            counts.put(m, months.path(String.valueOf(m)).asInt(0));
        }
        return new Histogram(true, counts, http.url(query));
    }
}
