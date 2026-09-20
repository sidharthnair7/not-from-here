package ca.notfromhere.api;

import java.util.List;

/**
 * The wire shape of POST /api/check. It mirrors the frontend's CheckResult type (frontend/src/lib/mkResult.ts)
 * field for field, snake_case included, so the UI that was built against fixtures renders live results unchanged.
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
        String report_text) {

    public record CandidateOut(String taxonName, String common, double confidence) {
    }

    public record ProposalOut(String source, List<CandidateOut> list) {
    }

    public record NearestOut(String date, double distance_km, String place, String url) {
    }

    public record TaxonOut(String name, boolean list_member) {
    }

    public record RangeOut(int radius_km, int window_years, int count_50km, int count_200km) {
    }

    public record SeasonOut(int month, List<Integer> histogram) {
    }

    public record EvidenceOut(Integer rule, TaxonOut taxon, RangeOut range, SeasonOut season,
                              List<ProposalOut> proposals, Object raw) {
    }
}
