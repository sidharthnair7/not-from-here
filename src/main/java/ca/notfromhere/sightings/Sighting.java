package ca.notfromhere.sightings;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;

/**
 * One verified sighting: a check that passed all four rules. Stored with a snapshot of the evidence and the exact
 * query URLs, so the record stands on its own when it leaves the app (CSV, GeoJSON, a hotline operator's inbox).
 */
@Entity
@Table(name = "sightings")
public class Sighting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private long taxonId;

    @Column(nullable = false)
    private String scientificName;

    @Column(nullable = false)
    private String commonName;

    @Column(nullable = false)
    private double lat;

    @Column(nullable = false)
    private double lng;

    @Column(nullable = false)
    private LocalDate observedOn;

    @Column(nullable = false)
    private Instant reportedAt;

    private int viewsAgreeing;
    private int viewsTotal;
    private int recordsWithin50Km;
    private int recordsWithin200Km;
    private Integer gbifWithin50Km;
    private String rangeSource;
    private String photoSha256;
    private Boolean cameraLocationMatches;

    @Lob
    @Column(length = 8000)
    private String reportText;

    @Lob
    @Column(length = 200000)
    private String evidenceJson;

    @Lob
    @Column(length = 8000)
    private String sourcesJson;

    protected Sighting() {
    }

    public Sighting(long taxonId, String scientificName, String commonName, double lat, double lng, LocalDate observedOn,
                    Instant reportedAt, int viewsAgreeing, int viewsTotal, int recordsWithin50Km, int recordsWithin200Km,
                    Integer gbifWithin50Km, String rangeSource, String photoSha256, Boolean cameraLocationMatches,
                    String reportText, String evidenceJson, String sourcesJson) {
        this.taxonId = taxonId;
        this.scientificName = scientificName;
        this.commonName = commonName;
        this.lat = lat;
        this.lng = lng;
        this.observedOn = observedOn;
        this.reportedAt = reportedAt;
        this.viewsAgreeing = viewsAgreeing;
        this.viewsTotal = viewsTotal;
        this.recordsWithin50Km = recordsWithin50Km;
        this.recordsWithin200Km = recordsWithin200Km;
        this.gbifWithin50Km = gbifWithin50Km;
        this.rangeSource = rangeSource;
        this.photoSha256 = photoSha256;
        this.cameraLocationMatches = cameraLocationMatches;
        this.reportText = reportText;
        this.evidenceJson = evidenceJson;
        this.sourcesJson = sourcesJson;
    }

    public Long getId() { return id; }
    public long getTaxonId() { return taxonId; }
    public String getScientificName() { return scientificName; }
    public String getCommonName() { return commonName; }
    public double getLat() { return lat; }
    public double getLng() { return lng; }
    public LocalDate getObservedOn() { return observedOn; }
    public Instant getReportedAt() { return reportedAt; }
    public int getViewsAgreeing() { return viewsAgreeing; }
    public int getViewsTotal() { return viewsTotal; }
    public int getRecordsWithin50Km() { return recordsWithin50Km; }
    public int getRecordsWithin200Km() { return recordsWithin200Km; }
    public Integer getGbifWithin50Km() { return gbifWithin50Km; }
    public String getRangeSource() { return rangeSource; }
    public String getPhotoSha256() { return photoSha256; }
    public Boolean getCameraLocationMatches() { return cameraLocationMatches; }
    public String getReportText() { return reportText; }
    public String getEvidenceJson() { return evidenceJson; }
    public String getSourcesJson() { return sourcesJson; }
}
