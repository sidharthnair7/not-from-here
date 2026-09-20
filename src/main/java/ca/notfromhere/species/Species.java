package ca.notfromhere.species;

import java.util.List;

/** One entry of ontario_invasives.json. taxonId is the iNaturalist id, looked up live, never typed from memory. */
public record Species(String commonName, String scientificName, long taxonId, String kind, String lookalike, Guide guide) {

    /** How to tell this species from its lookalikes, paraphrased from one cited official page. Null when no page was cited. */
    public record Guide(String compares, List<String> tell, String source) {
    }
}
