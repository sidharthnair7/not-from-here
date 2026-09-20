package ca.notfromhere.gate;

import java.util.List;
import java.util.Map;

/**
 * What the gate needs from the outside world, and nothing more. The real implementation calls iNaturalist
 * (with a disk cache); tests hand the gate a fake. Keeping this interface tiny is what makes the gate unit-testable.
 * Every result carries the exact URLs it was derived from, so a person receiving a report can re-run the query.
 */
public interface RangeLookup {

    /** One research-grade observation near the photo, in the form the UI shows as evidence. */
    record Observation(long id, String observedOn, double distanceKm, double lat, double lng, String place, String url) {
    }

    /**
     * Research-grade observations of the taxon around (lat, lng) in the last three years.
     * available is false when the source could not be reached; the counts are then meaningless and the gate
     * must not treat them as zero.
     */
    record RangeResult(boolean available, int countWithin50Km, int countWithin200Km, List<Observation> nearest,
                       List<String> sourceUrls) {
        public static RangeResult unavailable(List<String> sourceUrls) {
            return new RangeResult(false, 0, 0, List.of(), sourceUrls);
        }
    }

    /** Month (1 to 12) to observation count for the taxon in Ontario, with the query that produced it. */
    record Histogram(boolean available, Map<Integer, Integer> counts, String sourceUrl) {
        public static Histogram unavailable(String sourceUrl) {
            return new Histogram(false, Map.of(), sourceUrl);
        }
    }

    RangeResult range(long taxonId, double lat, double lng);

    Histogram monthHistogram(long taxonId);
}
