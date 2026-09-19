# Not From Here

An Ontario invasive-species sighting gate. You photograph a plant or insect you think is invasive. A vision model proposes what it is. Then four deterministic rules decide whether the sighting can be reported, and if any rule fails the app refuses and shows you the raw evidence instead of a guess.

**The model never produces the verdict.** It proposes candidates and writes prose. The verdict comes from `Gate.java`, which is deterministic and unit-tested.

Built for NextStep Hacks 2026 ("Earth Forward"), September 19 to 20, 2026.

## The four rules (in order; first failure wins)

| # | Rule | Passes when | Refusal |
|---|------|-------------|---------|
| 1 | Agreement | Two proposers name the same top species, or one proposer is at least 2x as confident in its top pick as in its runner-up | `NOT_VERIFIED_SPLIT` |
| 2 | List | The species is in `ontario_invasives.json` (16 species, iNaturalist ids looked up live) | `NOT_ON_LIST` (with the listed lookalike, if any) |
| 3 | Range | At least 3 research-grade iNaturalist records within 50 km in the last 3 years | `INSUFFICIENT_RECORDS`; zero within 200 km is `NEW_RANGE`, routed to the Invading Species Hotline |
| 4 | Season | The photo's month has a non-zero count in the Ontario month histogram | `OUT_OF_SEASON` |

## Stack

- Backend: Java 25, Spring Boot 4.1, Maven, H2 file database. iNaturalist public API (no key) with a disk cache in `cache/` so the demo works offline.
- Proposer: a local vision model through Ollama (`qwen3.5:9b`) by default; `LLM_PROVIDER=bedrock` switches to Amazon Nova 2 Lite.
- Frontend: React + Vite, in `frontend/`.

## Run

```bash
mvn spring-boot:run
```

Tests (no network, no model):

```bash
mvn test
```

## Layout

```
src/main/java/ca/notfromhere/
  gate/      Gate.java (the four rules), Verdict, Proposal, PhotoMeta, GateResult, RangeLookup
  species/   Species, SpeciesList (loads ontario_invasives.json)
  inat/      INatClient (iNaturalist calls + disk cache; implements RangeLookup)
src/main/resources/ontario_invasives.json
src/test/java/ca/notfromhere/gate/GateTest.java
fixtures/   example API responses so the UI can be built before the backend is finished
frontend/   Vite app
```

## Data sources

- iNaturalist API: taxon ids, research-grade observations, Ontario month histograms.
- Invading Species Hotline 1-800-563-7711 (Ontario's Invading Species Awareness Program).

## Prior work disclosure

The record-browsing sphere in the frontend reuses the InfiniteMenu component from our earlier project Remembrance. Everything else was written during the hackathon window.

## License

MIT
