package ca.notfromhere.api;

import ca.notfromhere.gate.PhotoMeta;
import ca.notfromhere.species.Species;
import ca.notfromhere.species.SpeciesList;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

/**
 * POST /api/check  multipart: photo (required), lat, lng (optional; default Peterborough), taken_at (optional ISO date)
 * GET  /api/health
 */
@RestController
public class CheckController {

    private final CheckService checkService;
    private final SpeciesList speciesList;
    private final double defaultLat;
    private final double defaultLng;
    private final String provider;

    public CheckController(CheckService checkService, SpeciesList speciesList,
                           @Value("${nfh.default.lat:44.30}") double defaultLat,
                           @Value("${nfh.default.lng:-78.32}") double defaultLng,
                           @Value("${nfh.llm.provider:ollama}") String provider) {
        this.checkService = checkService;
        this.speciesList = speciesList;
        this.defaultLat = defaultLat;
        this.defaultLng = defaultLng;
        this.provider = provider;
    }

    @GetMapping("/api/health")
    public Map<String, Object> health() {
        return Map.of("status", "ok", "provider", provider, "proposers", checkService.proposerNames());
    }

    @PostMapping(value = "/api/check", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CheckResponse check(@RequestParam("photo") MultipartFile photo,
                               @RequestParam(value = "lat", required = false) Double lat,
                               @RequestParam(value = "lng", required = false) Double lng,
                               @RequestParam(value = "taken_at", required = false) String takenAt) throws IOException {
        LocalDate date;
        try {
            date = takenAt == null || takenAt.isBlank() ? LocalDate.now() : LocalDate.parse(takenAt.substring(0, Math.min(10, takenAt.length())));
        } catch (DateTimeParseException e) {
            date = LocalDate.now();
        }
        PhotoMeta meta = new PhotoMeta(lat == null ? defaultLat : lat, lng == null ? defaultLng : lng, date);
        String mime = photo.getContentType() == null ? "image/jpeg" : photo.getContentType();
        return checkService.check(photo.getBytes(), mime, meta);
    }

    @GetMapping("/api/species")
    public List<Species> species() {
        return speciesList.all();
    }
}
