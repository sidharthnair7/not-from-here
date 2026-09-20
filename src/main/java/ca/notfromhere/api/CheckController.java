package ca.notfromhere.api;

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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * POST /api/check        multipart: photo (one) or photos (up to 3 views of ONE subject); lat, lng, taken_at optional
 * POST /api/check/batch  multipart: photos (many, each a separate subject); lat, lng optional defaults for photos without GPS
 * GET  /api/health
 * GET  /api/species
 */
@RestController
public class CheckController {

    static final int MAX_VIEWS = 3;
    static final int MAX_BATCH = 50;

    private final CheckService checkService;
    private final SpeciesList speciesList;
    private final String provider;

    public CheckController(CheckService checkService, SpeciesList speciesList,
                           @Value("${nfh.llm.provider:ollama}") String provider) {
        this.checkService = checkService;
        this.speciesList = speciesList;
        this.provider = provider;
    }

    @GetMapping("/api/health")
    public Map<String, Object> health() {
        return Map.of("status", "ok", "provider", provider, "proposers", checkService.proposerNames());
    }

    @PostMapping(value = "/api/check", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CheckResponse check(@RequestParam(value = "photo", required = false) MultipartFile photo,
                               @RequestParam(value = "photos", required = false) List<MultipartFile> photos,
                               @RequestParam(value = "lat", required = false) Double lat,
                               @RequestParam(value = "lng", required = false) Double lng,
                               @RequestParam(value = "taken_at", required = false) String takenAt) throws IOException {
        List<MultipartFile> files = new ArrayList<>();
        if (photo != null && !photo.isEmpty()) files.add(photo);
        if (photos != null) photos.stream().filter(f -> f != null && !f.isEmpty()).forEach(files::add);
        if (files.isEmpty()) throw new IllegalArgumentException("Send at least one photo (field 'photo' or 'photos').");
        if (files.size() > MAX_VIEWS) files = files.subList(0, MAX_VIEWS);
        return checkService.check(inputs(files), new CheckService.Claim(lat, lng, parseDate(takenAt)));
    }

    /** Each photo is a separate subject with its own check, its own EXIF location and date, and its own ledger entry. */
    @PostMapping(value = "/api/check/batch", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> batch(@RequestParam("photos") List<MultipartFile> photos,
                                     @RequestParam(value = "lat", required = false) Double lat,
                                     @RequestParam(value = "lng", required = false) Double lng) throws IOException {
        List<MultipartFile> files = photos.stream().filter(f -> f != null && !f.isEmpty()).toList();
        if (files.size() > MAX_BATCH) files = files.subList(0, MAX_BATCH);
        List<Map<String, Object>> results = new ArrayList<>();
        Map<String, Integer> byVerdict = new LinkedHashMap<>();
        for (MultipartFile f : files) {
            CheckResponse r = checkService.check(inputs(List.of(f)), new CheckService.Claim(lat, lng, null));
            byVerdict.merge(r.verdict(), 1, Integer::sum);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("file", f.getOriginalFilename());
            row.put("result", r);
            results.add(row);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("count", results.size());
        out.put("by_verdict", byVerdict);
        out.put("results", results);
        return out;
    }

    @GetMapping("/api/species")
    public List<Species> species() {
        return speciesList.all();
    }

    private static List<CheckService.PhotoInput> inputs(List<MultipartFile> files) throws IOException {
        List<CheckService.PhotoInput> in = new ArrayList<>();
        for (MultipartFile f : files) {
            in.add(new CheckService.PhotoInput(f.getOriginalFilename(), f.getBytes(),
                    f.getContentType() == null ? "image/jpeg" : f.getContentType()));
        }
        return in;
    }

    private static LocalDate parseDate(String takenAt) {
        if (takenAt == null || takenAt.isBlank()) return null;
        try {
            return LocalDate.parse(takenAt.substring(0, Math.min(10, takenAt.length())));
        } catch (DateTimeParseException e) {
            return null;
        }
    }
}
