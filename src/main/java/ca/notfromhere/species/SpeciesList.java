package ca.notfromhere.species;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** Loads the Ontario invasive list once from the classpath and answers "is this taxon on it?". */
@Component
public class SpeciesList {

    private final List<Species> species;
    private final String hotline;

    public SpeciesList() {
        this(new ClassPathResource("ontario_invasives.json"));
    }

    SpeciesList(ClassPathResource resource) {
        try (InputStream in = resource.getInputStream()) {
            JsonNode root = JsonMapper.builder().build().readTree(in);
            this.hotline = root.path("hotline").asText();
            List<Species> loaded = new ArrayList<>();
            for (JsonNode n : root.path("species")) {
                loaded.add(new Species(
                        n.path("commonName").asText(),
                        n.path("scientificName").asText(),
                        n.path("taxonId").asLong(),
                        n.path("kind").asText(),
                        n.path("lookalike").isNull() ? null : n.path("lookalike").asText()));
            }
            this.species = List.copyOf(loaded);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot read ontario_invasives.json", e);
        }
    }

    public List<Species> all() {
        return species;
    }

    public String hotline() {
        return hotline;
    }

    public Optional<Species> byTaxonId(long taxonId) {
        return species.stream().filter(s -> s.taxonId() == taxonId).findFirst();
    }

    public Optional<Species> byScientificName(String name) {
        if (name == null) return Optional.empty();
        String wanted = name.trim().toLowerCase();
        return species.stream().filter(s -> s.scientificName().toLowerCase().equals(wanted)).findFirst();
    }
}
