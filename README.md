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

## What it does beyond one photo, one verdict

- **Multi-view identification.** Send up to three photos of the same subject (`photos` field). Each view is an independent proposal and rule 1 needs at least two thirds of them, never fewer than two, to name the same species. A single Phragmites photo splits 0.90 vs 0.60 against cattail; three views of the same plant agree 3 of 3 and pass.
- **Independent corroboration.** The range rule is decided by iNaturalist research-grade records and corroborated by GBIF, reached by scientific name. If iNaturalist is unreachable, GBIF decides and the evidence says so. If neither can be reached, nothing is reported.
- **Provenance.** Every response carries the exact query URLs (iNaturalist, GBIF, the month histogram) it was decided from, so a hotline operator can open them and see the same counts.
- **A shared ledger.** Every REPORT is stored with its evidence snapshot: `GET /api/sightings`, `GET /api/sightings/{id}`, `GET /api/sightings.geojson`, `GET /api/sightings.csv`.
- **Duplicate detection.** The same species within 100 m in the last 30 days is answered with the existing record (`already_reported`, `duplicate_of`) instead of a second report.
- **Photo integrity.** Camera EXIF is read server-side: GPS present, date present, camera, and whether the camera's GPS agrees with the location the user claimed (within 5 km). Evidence, never a refusal.
- **Batch checks.** `POST /api/check/batch` takes a survey's worth of photos, each its own subject with its own EXIF location and date, and returns every verdict plus a count by verdict.
- **When to look.** `GET /api/species/{taxonId}/season` returns the Ontario month histogram for a species.
- **How to tell them apart.** When a refusal is about identity (a split between a listed species and its lookalike, or a native that is often mistaken for a listed one), the response carries `how_to_tell`: the distinguishing features paraphrased from the cited Ontario government or Invading Species Awareness Program page, with the source URL. Seven species have a guide; species without a cited page have none rather than an invented one.

## API

| Call | Purpose |
|------|---------|
| `POST /api/check` multipart `photo` or `photos` (up to 3), optional `lat`, `lng`, `taken_at` | One subject, one verdict, full evidence |
| `POST /api/check/batch` multipart `photos` (up to 50), optional `lat`, `lng` | Many subjects, one table |
| `GET /api/sightings`, `/api/sightings/{id}`, `/api/sightings.geojson`, `/api/sightings.csv` | The verified ledger and exports |
| `GET /api/species`, `GET /api/species/{taxonId}/season` | The Ontario list and per-species seasonality |
| `GET /api/health` | Provider and proposers in use |

Real captured responses are in `fixtures/`: `check_report.json`, `check_report_multiview.json`, `check_already_reported.json`, `check_split.json`, `check_split_lookalike_guide.json`, `check_insufficient.json`, `check_newrange.json`, `sightings.json`, `sightings.geojson`.

## The kill check (why the proposer picks from a catalogue)

Before writing the proposer we tested the local model on ten research-grade iNaturalist photos, one per species (`src/test/resources/photos/`, licences in `expected.json`).

| Prompt | Top-1 correct | Also clears the 2x confidence rule |
|--------|---------------|-------------------------------------|
| Open-ended "name the species" | 2 / 10 | |
| Closed catalogue: 16 invasives + 9 native lookalikes + Other | 6 / 10 | 5 / 10 |

Deterministic (temperature 0, fixed seed); every photo gives the same answer on every run. The four misses are the point of the app: wild parsnip was called golden alexanders, giant hogweed was called cow parsnip (both are the native lookalikes on our list), and dog-strangling vine and zebra mussel came back as "Other". In every one of those cases the gate refuses instead of reporting. Re-run it yourself: `mvn test -Dgroups=live -DexcludedGroups=` (needs Ollama).

## Stack

- Backend: Java 25, Spring Boot 4.1, Maven, H2 file database. iNaturalist public API (no key) with a disk cache in `cache/` so the demo works offline.
- Proposer: a local vision model through Ollama (`qwen3.5:9b`, JSON mode, catalogue prompt) by default; `LLM_PROVIDER` selects the implementation.
- Frontend: React + Vite, in `frontend/`.

## Run

Backend (needs Ollama running with `qwen3.5:9b`):

```bash
mvn spring-boot:run
```

Frontend, in a second terminal (Vite proxies `/api` to port 8080):

```bash
cd frontend && npm install && npm run dev
```

Every response carries the gate's raw evidence and the query URLs it was decided from.

Tests (no network, no model):

```bash
mvn test
```

## Layout

```
src/main/java/ca/notfromhere/
  api/       CheckController, CheckService (views, EXIF, ledger, response mapping), CheckResponse
  gate/      Gate.java (the four rules), Verdict, Proposal, PhotoMeta, GateResult, RangeLookup, OccurrenceLookup
  proposer/  Proposer, Catalogue, OllamaProposer
  species/   Species, SpeciesList (loads ontario_invasives.json)
  inat/      INatClient, GbifClient, CachedHttp (disk cache keyed by URL)
  photo/     PhotoMetadata (EXIF read server-side)
  sightings/ Sighting (JPA), SightingRepository, SightingService (duplicates, exports), SightingController
src/main/resources/ontario_invasives.json
src/test/java/ca/notfromhere/gate/GateTest.java            17 unit tests, no network
src/test/java/ca/notfromhere/proposer/ProposerLiveTest.java the kill check, tagged live
src/test/resources/photos/                                  10 test photos + extra views + expected.json
fixtures/   real responses captured from /api/check (report, split, insufficient, new range)
frontend/   Vite app
```

## Data sources

- iNaturalist API: taxon ids, research-grade observations, Ontario month histograms.
- Invading Species Hotline 1-800-563-7711 (Ontario's Invading Species Awareness Program).

## Prior work disclosure

The record-browsing sphere in the frontend reuses the InfiniteMenu component from our earlier project Remembrance. Everything else was written during the hackathon window.

## License

MIT
