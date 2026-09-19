package ca.notfromhere.gate;

import java.util.List;
import java.util.Map;

/**
 * What the gate needs from the outside world, and nothing more. The real implementation calls iNaturalist
 * (with a disk cache); tests hand the gate a fake. Keeping this interface tiny is what makes the gate unit-testable.
 */
public interface RangeLookup {

    /** One research-grade observation near the photo, in the form the UI shows as evidence. */
    record Observation(long id, String observedOn, double distanceKm, String url) {
    }

    /** Research-grade observations of the taxon around (lat, lng) in the last three years. */
    record RangeResult(int countWithin50Km, int countWithin200Km, List<Observation> nearest) {
    }

    RangeResult range(long taxonId, double lat, double lng);

    /** Month (1 to 12) to observation count for the taxon in Ontario. */
    Map<Integer, Integer> monthHistogram(long taxonId);
}
