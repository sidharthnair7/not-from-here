package ca.notfromhere.inat;

import ca.notfromhere.gate.OccurrenceLookup;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * GBIF, the second opinion for the range rule. Independent of iNaturalist (it aggregates museum, survey and
 * citizen-science records) and reached by scientific name, not by iNaturalist id. Endpoints verified live 2026-09-19:
 *   GET /v1/species/match?name=<scientific name>           -> usageKey
 *   GET /v1/occurrence/search?taxonKey=&geoDistance=lat,lng,50km&year=2023,2026&limit=1  -> count
 */
@Component
public class GbifClient implements OccurrenceLookup {

    static final String BASE = "https://api.gbif.org/v1";

    private final CachedHttp http;

    public GbifClient(@Value("${nfh.cache.dir:./cache}") String cacheDir) {
        this.http = new CachedHttp(BASE, Path.of(cacheDir), "not-from-here (student hackathon project; Peterborough, ON)");
    }

    @Override
    public Optional<Corroboration> corroborate(String scientificName, double lat, double lng) {
        if (scientificName == null || scientificName.isBlank()) return Optional.empty();
        String matchQuery = "/species/match?name=" + scientificName.trim().replace(" ", "%20");
        Optional<JsonNode> match = http.get(matchQuery);
        if (match.isEmpty()) return Optional.empty();
        long key = match.get().path("usageKey").asLong(0);
        String matchType = match.get().path("matchType").asText("NONE");
        if (key == 0 || "NONE".equals(matchType)) return Optional.empty();

        int thisYear = LocalDate.now().getYear();
        String years = (thisYear - 3) + "," + thisYear;
        String near = String.format("/occurrence/search?taxonKey=%d&geoDistance=%.4f,%.4f,50km&year=%s&limit=1", key, lat, lng, years);
        String wide = String.format("/occurrence/search?taxonKey=%d&geoDistance=%.4f,%.4f,200km&year=%s&limit=1", key, lat, lng, years);
        Optional<JsonNode> n = http.get(near);
        Optional<JsonNode> w = http.get(wide);
        if (n.isEmpty() || w.isEmpty()) return Optional.empty();

        return Optional.of(new Corroboration("gbif", key,
                n.get().path("count").asInt(0), w.get().path("count").asInt(0),
                List.of(http.url(matchQuery), http.url(near), http.url(wide))));
    }
}
