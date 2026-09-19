package ca.notfromhere.species;

/** One entry of ontario_invasives.json. taxonId is the iNaturalist id, looked up live, never typed from memory. */
public record Species(String commonName, String scientificName, long taxonId, String kind, String lookalike) {
}
