package ca.notfromhere.inat;

import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Optional;

/**
 * GET with a disk cache keyed by the SHA-256 of the full URL. The cache is read BEFORE the network, so a demo
 * recorded once keeps working with the Wi-Fi off, and a public API is never hit twice for the same question.
 * Returns empty when the source cannot be reached; callers decide what "unavailable" means for them.
 */
class CachedHttp {

    private final RestClient http;
    private final String base;
    private final Path cacheDir;
    private final JsonMapper json = JsonMapper.builder().build();

    CachedHttp(String base, Path cacheDir, String userAgent) {
        this.base = base;
        this.cacheDir = cacheDir;
        this.http = RestClient.builder().baseUrl(base).defaultHeader("User-Agent", userAgent).build();
    }

    String url(String pathAndQuery) {
        return base + pathAndQuery;
    }

    Optional<JsonNode> get(String pathAndQuery) {
        Path cached = cacheDir.resolve(sha256(url(pathAndQuery)) + ".json");
        try {
            if (Files.exists(cached)) {
                return Optional.of(json.readTree(Files.readString(cached, StandardCharsets.UTF_8)));
            }
            String body = http.get().uri(pathAndQuery).retrieve().body(String.class);
            if (body == null || body.isBlank()) return Optional.empty();
            Files.createDirectories(cacheDir);
            Files.writeString(cached, body, StandardCharsets.UTF_8);
            return Optional.of(json.readTree(body));
        } catch (IOException | RuntimeException e) {
            return Optional.empty();
        }
    }

    static String sha256(String s) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
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
}
