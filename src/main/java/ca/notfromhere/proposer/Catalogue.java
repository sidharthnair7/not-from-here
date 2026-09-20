package ca.notfromhere.proposer;

import ca.notfromhere.species.Species;
import ca.notfromhere.species.SpeciesList;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The closed set a proposer chooses from: every listed invasive, every native lookalike named on the list, and
 * "Other". Open-ended naming was tested on 2026-09-19 against qwen3.5:9b and scored 2 of 10; the same model choosing
 * from this catalogue scored 6 of 10. The lookalikes are in the catalogue on purpose: a model that says "cow parsnip"
 * gets refused by rule 2 with the listed lookalike (giant hogweed) shown as evidence, which is the honest answer.
 */
@Component
public class Catalogue {

    static final String OTHER = "Other";
    private static final Pattern IN_PARENS = Pattern.compile("\\(([^)]+)\\)");

    private final List<String> lines = new ArrayList<>();

    public Catalogue(SpeciesList speciesList) {
        for (Species s : speciesList.all()) {
            lines.add(s.scientificName() + " (" + s.commonName() + ")");
        }
        for (Species s : speciesList.all()) {
            // lookalike entries look like "Cow parsnip (Heracleum maximum)"; keep the ones with a scientific name
            if (s.lookalike() == null) continue;
            Matcher m = IN_PARENS.matcher(s.lookalike());
            if (m.find()) {
                String sci = m.group(1).trim();
                String common = s.lookalike().substring(0, s.lookalike().indexOf('(')).trim();
                lines.add(sci + " (" + common + ", native lookalike)");
            }
        }
        lines.add(OTHER + " (not in this catalogue)");
    }

    public List<String> lines() {
        return List.copyOf(lines);
    }

    public String prompt() {
        StringBuilder sb = new StringBuilder();
        sb.append("You are identifying a plant, insect, mollusc or fish photographed in Ontario, Canada. ");
        sb.append("Choose ONLY from this catalogue:\n");
        for (String line : lines) sb.append("- ").append(line).append('\n');
        sb.append("\nReturn ONLY a JSON object: {\"candidates\": [{\"scientificName\": \"Genus species\" or \"Other\", \"confidence\": 0.0-1.0}]} ");
        sb.append("with up to 3 candidates, most likely first, confidences summing to at most 1. ");
        sb.append("Use the exact scientific names from the catalogue. No other text.");
        return sb.toString();
    }
}
