package ca.notfromhere.gate;

import java.util.List;
import java.util.Optional;

/**
 * A second, independent occurrence database (GBIF) used to corroborate the range rule. It is consulted by
 * scientific name, not by iNaturalist id, so it is not just iNaturalist's data read twice. If iNaturalist cannot be
 * reached, the gate decides rule 3 from this source instead and says so in the evidence.
 */
public interface OccurrenceLookup {

    record Corroboration(String source, long taxonKey, int countWithin50Km, int countWithin200Km, List<String> sourceUrls) {
    }

    Optional<Corroboration> corroborate(String scientificName, double lat, double lng);
}
