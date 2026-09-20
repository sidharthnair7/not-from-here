package ca.notfromhere.sightings;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface SightingRepository extends JpaRepository<Sighting, Long> {

    List<Sighting> findTop500ByOrderByReportedAtDesc();

    List<Sighting> findByTaxonIdAndReportedAtAfter(long taxonId, Instant since);
}
