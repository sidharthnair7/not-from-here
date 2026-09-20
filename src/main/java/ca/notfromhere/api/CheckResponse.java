package ca.notfromhere.api;

import java.util.List;

/**
 * The wire shape of POST /api/check. The first ten fields mirror the frontend's CheckResult type
 * (frontend/src/lib/mkResult.ts) field for field, snake_case included, so the UI built against fixtures renders
 * live results unchanged. The fields after report_text are additions the UI can adopt when it wants them.
 */
public record CheckResponse(
        String verdict,
        String rule,
        String reason,
        List<ProposalOut> proposals,
        List<String> trace,
        List<NearestOut> nearest,
        List<Integer> hist,
        int histMonth,
        EvidenceOut evidence,
        String report_text,
        // additions
        Long sighting_id,
        boolean already_reported,
        Long duplicate_of,
        List<String> sources,
        List<PhotoIntegrityOut> photo_integrity,
        AgreementOut agreement) {

    public record CandidateOut(String taxonName, String common, double confidence) {
    }

    public record ProposalOut(String source, List<CandidateOut> list) {
    }

    public record NearestOut(String date, double distance_km, String place, String url, double lat, double lng) {
    }

    public record TaxonOut(String name, boolean list_member) {
    }

    public record RangeOut(int radius_km, int window_years, int count_50km, int count_200km, String source,
                           Integer gbif_50km, Integer gbif_200km) {
    }

    public record SeasonOut(int month, List<Integer> histogram) {
    }

    public record EvidenceOut(Integer rule, TaxonOut taxon, RangeOut range, SeasonOut season,
                              List<ProposalOut> proposals, Object raw) {
    }

    /** What the camera said about one uploaded photo, compared with what the user claimed. */
    public record PhotoIntegrityOut(String file, boolean has_exif, boolean has_gps, String exif_date, String camera,
                                    Boolean camera_location_matches, Double camera_distance_km) {
    }

    public record AgreementOut(int views, int agreeing, Integer needed) {
    }
}
