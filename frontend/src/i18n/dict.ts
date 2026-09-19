export type Lang = 'en' | 'fr';

export interface SpeciesCommonNames {
  en: string;
  fr: string;
}

export const SPECIES_COMMON: Record<string, SpeciesCommonNames> = {
  phragmites: { en: 'Common reed', fr: 'Roseau commun' },
  knotweed: { en: 'Japanese knotweed', fr: 'Renouée du Japon' },
  garlic: { en: 'Garlic mustard', fr: 'Alliaire officinale' },
  parsnip: { en: 'Wild parsnip', fr: 'Panais sauvage' },
  dsv: { en: 'Dog-strangling vine', fr: 'Dompte-venin de Russie' },
  eab: { en: 'Emerald ash borer', fr: 'Agrile du frêne' },
  zebra: { en: 'Zebra mussel', fr: 'Moule zébrée' },
  hogweed: { en: 'Giant hogweed', fr: 'Berce du Caucase' },
  loosestrife: { en: 'Purple loosestrife', fr: 'Salicaire commune' },
  slf: { en: 'Spotted lanternfly', fr: 'Fulgore tachetée' },
  cattail: { en: 'Broad-leaved cattail', fr: 'Quenouille à feuilles larges' }
};

export const DICT = {
  en: {
    // Nav & Header
    nav_home: 'Home',
    nav_check: 'Check',
    nav_record: 'Record',
    nav_about: 'About',
    nav_try_it: 'Try it',
    status_live: 'Live',
    status_demo: 'Demo data',
    status_live_tip: 'Connected to the live backend API and real iNaturalist observations.',
    status_demo_tip: 'Running offline with sample scenarios. Uploaded photos stay in your browser.',
    skip_to_content: 'Skip to main content',

    // Hero
    eyebrow: 'Built for Ontario · Open source · Photos stay on your device in demo mode',
    hero_title_1: 'The model',
    hero_title_em: 'proposes.',
    hero_title_2: 'The rules decide.',
    hero_sub: 'Snap a plant or insect. Two vision models guess. Four fixed rules decide whether it’s worth reporting, and every refusal shows its evidence.',
    hero_cta_check: 'Check a sighting',
    hero_cta_record: 'See the record',
    hero_scroll_hint: 'Scroll to explore',
    hero_gate_replay: 'Replay demo',
    hero_gate_pause: 'Pause demo',

    // Ticker
    ticker_caption: 'Trained to recognise the invaders Ontario cares about.',

    // Pinned Story
    story_eyebrow: 'HOW THE GATE WORKS',
    story_title: 'Four rules between the camera and the report',
    story_rule1_num: '01',
    story_rule1_title: 'Proposal agreement',
    story_rule1_desc: 'Two independent vision models inspect the photo. If they disagree on the top candidate, the gate stops immediately. We never guess.',
    story_rule2_num: '02',
    story_rule2_title: 'Ontario invasive list',
    story_rule2_desc: 'The species must be officially regulated or tracked as an invasive threat in Ontario. Native lookalikes are recognized and set aside.',
    story_rule3_num: '03',
    story_rule3_title: 'Range check',
    story_rule3_desc: 'Live records from iNaturalist must show confirmed research-grade sightings within 50 km. If it’s over 200 km away, a human must verify first.',
    story_rule4_num: '04',
    story_rule4_title: 'Season check',
    story_rule4_desc: 'The observation date must align with the species’ active seasonal window in Ontario. Dormant or winter anomalies require human inspection.',

    // Bento
    bento_eyebrow: 'GATE ARCHITECTURE',
    bento_title: 'Built to say no',
    bento_sub: 'Most AI systems try to be helpful by guessing. Not From Here is deliberately constrained: if evidence is incomplete, it refuses and shows you why.',
    bento1_title: 'Refusals are part of the record',
    bento1_desc: 'Every refusal is catalogued with its failing rule, proposer probabilities, and local record counts.',
    bento2_title: 'Two proposers, zero guessing',
    bento2_desc: 'Independent models must achieve consensus. Split verdicts are never decided by coin toss.',
    bento3_title: 'Real sightings only',
    bento3_desc: 'Validated against research-grade iNaturalist occurrences within a 3-year window.',
    bento4_title: 'Season-aware',
    bento4_desc: 'Historical monthly distribution curves catch misidentifications before they trigger false alarms.',
    bento5_title: 'New range? A human decides',
    bento5_desc: 'If a known invader is detected 200+ km from known populations, we route you directly to the Invading Species Hotline.',
    bento6_title: 'Your photo never reaches the report writer',
    bento6_desc: 'The gate isolates models. Only factual attributes (species, coordinates, nearest records) are passed to the draft.',

    // Playground
    play_eyebrow: 'INTERACTIVE PLAYGROUND',
    play_title: 'Try a verdict',
    play_sub: 'Test how the four rules evaluate real specimens. Click any scenario below to run the decision gate.',
    play_open_full: 'Open in full checker',

    // Numbers
    num1_val: '4',
    num1_label: 'Deterministic rules',
    num2_val: '2',
    num2_label: 'Independent vision models',
    num3_val: '50 km',
    num3_label: 'Local range check window',
    num4_val: '0',
    num4_label: 'Photos sent to report writer',

    // Showcase
    showcase_title: 'Every tile passed all four rules.',
    showcase_sub: 'Explore verified sightings in Ontario. Drag to rotate the 3D specimen sphere or switch to the accessible grid view.',
    showcase_explore: 'Explore the full record',
    showcase_toggle_sphere: 'Sphere view',
    showcase_toggle_grid: 'Grid view',

    // FAQ
    faq_eyebrow: 'COMMON QUESTIONS',
    faq_title: 'Frequently asked questions',
    faq1_q: 'Is my photo uploaded to external servers?',
    faq1_a: 'In demo mode, your photos are processed entirely within your browser using client-side Web APIs and never leave your device. When connected to a live deployment, photos are sent securely to the gate backend solely for model inference and are not stored permanently or shared.',
    faq2_q: 'Which vision models run under the hood?',
    faq2_a: 'The gate uses two independent models running concurrently (by default, an open-weight model such as Qwen 2.5 VL via Ollama and a cloud foundation model like Amazon Nova Lite via Bedrock). The gate enforces that both must agree on the top taxon.',
    faq3_q: 'Why did the gate refuse my sighting?',
    faq3_a: 'The gate refuses when any of the four strict rules fails: the models disagreed, the species is native or unlisted, there are too few verified records nearby (under 3 within 50 km), or the month does not match the active season in Ontario. Every refusal shows exact evidence.',
    faq4_q: 'What does "New range" mean?',
    faq4_a: 'A "New range" verdict occurs when the species is on Ontario’s invasive list, but there are zero research-grade sightings within 200 km. Because a first detection in a new region requires immediate expert verification, automated reporting is refused and you are directed to call the Invading Species Hotline.',
    faq5_q: 'Can I trust the drafted report?',
    faq5_a: 'The drafted report is generated solely from validated factual evidence (species name, coordinates, agreed model confidence, and distance to nearest verified records). It contains no hallucinated text. However, we advise users to review the draft before submitting to authorities.',
    faq6_q: 'Where does the baseline data come from?',
    faq6_a: 'Record histories and range distributions are sourced from research-grade iNaturalist observations, GBIF occurrence data, and official invasive species profiles maintained by the Invasive Species Centre in Ontario.',

    // Final CTA & Footer
    final_cta_title: 'Seen something that isn’t from here?',
    final_cta_sub: 'Test your observation against Ontario’s four verification rules right now.',
    final_cta_btn: 'Check a sighting now',
    footer_product: 'Product',
    footer_sources: 'Data Sources',
    footer_project: 'Project',
    footer_sample_notice: 'Sample data shown in demo mode. Live mode queries iNaturalist and the Invasive Species Centre.',
    footer_license: 'Released under the MIT License · Built for biodiversity protection in Ontario',

    // Check page additions
    drop_hint_bold: 'Drop a photo here',
    drop_hint_sub: 'or tap to take or choose one',
    gps_found: 'Photo GPS',
    gps_none: 'No GPS in photo · using default',
    your_photo: 'Your photo',
    loc_lbl: 'Where was it? (from the photo, or Peterborough by default)',
    loc_btn: 'Use my location',
    check_btn: 'Check this sighting',
    checking_btn: 'Checking…',
    press_enter_hint: 'Tip: press Enter to check',
    download_txt: 'Download .txt',
    print_pdf: 'Print / Save PDF',
    share_web: 'Share report',
    radar_title: 'Proximity radar',
    err_oversized: 'Image exceeds 12 MB limit. Please select a smaller photo.',
    err_heic: 'HEIC format is not supported directly. Please convert to JPEG or PNG.',
    paste_ready: 'Pasted image from clipboard',

    // Record page additions
    reset_demo: 'Reset demo data',
    reset_confirm: 'Reset demo sightings and refusals to initial fixtures?',
    empty_record_title: 'No sightings reported yet',
    empty_record_sub: 'Verified invasive sightings will appear here as specimen tiles.',
    empty_record_cta: 'Check a sighting',
    table_date: 'Date',
    table_species: 'Species',
    table_verdict: 'Verdict',
    table_where: 'Where',

    // 404
    notfound_title: 'Page not found',
    notfound_desc: 'The coordinate you followed doesn’t lead to any recorded species.',
    notfound_cta: 'Return to home'
  },
  fr: {
    // Nav & Header
    nav_home: 'Accueil',
    nav_check: 'Vérifier',
    nav_record: 'Registre',
    nav_about: 'À propos',
    nav_try_it: 'Essayer',
    status_live: 'En direct',
    status_demo: 'Mode démo',
    status_live_tip: 'Connecté à l’API backend en direct et aux données réelles d’iNaturalist.',
    status_demo_tip: 'Fonctionnement hors ligne avec scénarios d’exemple. Vos photos restent sur votre appareil.',
    skip_to_content: 'Passer au contenu principal',

    // Hero
    eyebrow: 'Conçu pour l’Ontario · Code source ouvert · Vos photos restent sur votre appareil',
    hero_title_1: 'Le modèle',
    hero_title_em: 'propose.',
    hero_title_2: 'Les règles décident.',
    hero_sub: 'Photographiez une plante ou un insecte. Deux modèles de vision émettent une hypothèse. Quatre règles fixes décident s’il faut le signaler, et chaque refus expose ses preuves.',
    hero_cta_check: 'Vérifier une observation',
    hero_cta_record: 'Consulter le registre',
    hero_scroll_hint: 'Faites défiler pour explorer',
    hero_gate_replay: 'Rejouer la démo',
    hero_gate_pause: 'Mettre en pause',

    // Ticker
    ticker_caption: 'Entraîné pour reconnaître les espèces envahissantes surveillées en Ontario.',

    // Pinned Story
    story_eyebrow: 'FONCTIONNEMENT DU FILTRE',
    story_title: 'Quatre règles entre votre appareil et le rapport',
    story_rule1_num: '01',
    story_rule1_title: 'Concordance des propositions',
    story_rule1_desc: 'Deux modèles de vision indépendants analysent la photo. S’ils divergent sur l’espèce principale, le filtre s’arrête immédiatement. Nous ne devinons jamais.',
    story_rule2_num: '02',
    story_rule2_title: 'Liste des espèces envahissantes de l’Ontario',
    story_rule2_desc: 'L’espèce doit être officiellement inscrite ou surveillée en Ontario. Les espèces indigènes sosies sont identifiées et écartées sans signalement erroné.',
    story_rule3_num: '03',
    story_rule3_title: 'Vérification de l’aire de répartition',
    story_rule3_desc: 'Les données iNaturalist de niveau recherche doivent confirmer sa présence dans un rayon de 50 km. Au-delà de 200 km, un expert humain doit valider en premier.',
    story_rule4_num: '04',
    story_rule4_title: 'Vérification de la saison',
    story_rule4_desc: 'La date de l’observation doit correspondre à la période d’activité biologique en Ontario. Les anomalies hivernales sont soumises à vérification manuelle.',

    // Bento
    bento_eyebrow: 'ARCHITECTURE DU SYSTÈME',
    bento_title: 'Conçu pour savoir dire non',
    bento_sub: 'La plupart des IA cherchent à plaire en devinant. Not From Here impose des garde-fous stricts : si les preuves sont insuffisantes, l’application refuse et motive sa décision.',
    bento1_title: 'Les refus font partie intégrante du registre',
    bento1_desc: 'Chaque refus est archivé avec la règle bloquante, les probabilités des modèles et les observations locales.',
    bento2_title: 'Deux modèles, zéro approximation',
    bento2_desc: 'Les modèles indépendants doivent parvenir à un consensus. Aucun litige n’est tranché au hasard.',
    bento3_title: 'Observations réelles uniquement',
    bento3_desc: 'Vérification systématique auprès des données d’observation certifiées sur une période de 3 ans.',
    bento4_title: 'Conscience de la saisonnalité',
    bento4_desc: 'Les courbes d’activité mensuelles préviennent les faux positifs hors saison.',
    bento5_title: 'Nouvelle zone ? Un humain décide',
    bento5_desc: 'Si une espèce est détectée à plus de 200 km de ses foyers connus, nous vous redirigeons directement vers la ligne d’assistance.',
    bento6_title: 'Votre photo n’est jamais envoyée au rédacteur',
    bento6_desc: 'Le filtre sépare la vision de la rédaction. Seuls les faits vérifiés (nom, lieu, coordonnées) alimentent le brouillon.',

    // Playground
    play_eyebrow: 'ESPACE D’ESSAI',
    play_title: 'Tester une décision',
    play_sub: 'Découvrez comment les quatre règles évaluent des spécimens réels. Cliquez sur un cas pour exécuter le filtre.',
    play_open_full: 'Ouvrir dans le vérificateur complet',

    // Numbers
    num1_val: '4',
    num1_label: 'Règles déterministes',
    num2_val: '2',
    num2_label: 'Modèles de vision indépendants',
    num3_val: '50 km',
    num3_label: 'Rayon de vérification locale',
    num4_val: '0',
    num4_label: 'Photo envoyée au rédacteur',

    // Showcase
    showcase_title: 'Chaque tuile a franchi les quatre règles.',
    showcase_sub: 'Explorez les signalements vérifiés en Ontario. Faites tourner la sphère 3D ou passez en affichage grille accessible.',
    showcase_explore: 'Consulter l’ensemble du registre',
    showcase_toggle_sphere: 'Vue sphère',
    showcase_toggle_grid: 'Vue grille',

    // FAQ
    faq_eyebrow: 'QUESTIONS FRÉQUENTES',
    faq_title: 'Foire aux questions',
    faq1_q: 'Ma photo est-elle envoyée sur des serveurs tiers ?',
    faq1_a: 'En mode démo, vos photos sont analysées exclusivement dans votre navigateur grâce aux API Web clientes et ne quittent jamais votre appareil. En production, les photos transitent de manière sécurisée uniquement pour l’inférence sans archivage non sollicité.',
    faq2_q: 'Quels modèles de vision sont utilisés ?',
    faq2_a: 'Le filtre fait appel à deux modèles indépendants (par défaut, un modèle ouvert de type Qwen 2.5 VL via Ollama et un modèle de fondation infonuagique comme Amazon Nova Lite). Les deux modèles doivent obligatoirement s’accorder sur l’espèce.',
    faq3_q: 'Pourquoi mon observation a-t-elle été refusée ?',
    faq3_a: 'Le filtre oppose un refus dès qu’une règle échoue : désaccord des modèles, espèce indigène non menacée, absence de signalements certifiés à proximité (moins de 3 dans un rayon de 50 km), ou mois inadapté à la saison ontarienne.',
    faq4_q: 'Que signifie « Nouvelle zone » ?',
    faq4_a: 'Cette mention s’applique lorsqu’une espèce figure sur la liste des espèces envahissantes, mais qu’aucune observation n’existe dans un rayon de 200 km. Tout nouveau foyer nécessitant l’intervention d’un spécialiste, le signalement automatisé est suspendu au profit d’un appel téléphonique.',
    faq5_q: 'Puis-je me fier au rapport rédigé ?',
    faq5_a: 'Le projet de rapport s’appuie strictement sur des données factuelles confirmées. Il ne comporte aucune hallucination textuelle. Il convient néanmoins de relire le document avant transmission aux autorités.',
    faq6_q: 'D’où proviennent les données de référence ?',
    faq6_a: 'Les données historiques proviennent des observations de niveau recherche d’iNaturalist, du GBIF et des fiches officielles publiées par le Centre des espèces envahissantes de l’Ontario.',

    // Final CTA & Footer
    final_cta_title: 'Vous avez repéré une espèce suspecte ?',
    final_cta_sub: 'Évaluez votre observation dès maintenant avec les quatre règles ontariennes.',
    final_cta_btn: 'Vérifier une observation',
    footer_product: 'Produit',
    footer_sources: 'Sources de données',
    footer_project: 'Projet',
    footer_sample_notice: 'Données de démonstration affichées en mode test. Le mode direct interroge iNaturalist et le Centre des espèces envahissantes.',
    footer_license: 'Publié sous licence MIT · Conçu pour la protection de la biodiversité en Ontario',

    // Check page additions
    drop_hint_bold: 'Déposez une photo ici',
    drop_hint_sub: 'ou cliquez pour en choisir une',
    gps_found: 'GPS de la photo',
    gps_none: 'Aucun GPS dans la photo · position par défaut',
    your_photo: 'Votre photo',
    loc_lbl: 'Où était-ce ? (d’après la photo, ou Peterborough par défaut)',
    loc_btn: 'Utiliser ma position',
    check_btn: 'Vérifier cette observation',
    checking_btn: 'Vérification en cours…',
    press_enter_hint: 'Astuce : appuyez sur Entrée pour vérifier',
    download_txt: 'Télécharger le rapport (.txt)',
    print_pdf: 'Imprimer / Sauvegarder en PDF',
    share_web: 'Partager le rapport',
    radar_title: 'Radar de proximité',
    err_oversized: 'L’image dépasse la limite de 12 Mo. Veuillez choisir une photo plus légère.',
    err_heic: 'Le format HEIC n’est pas pris en charge directement. Veuillez le convertir en JPEG ou PNG.',
    paste_ready: 'Image collée depuis le presse-papiers',

    // Record page additions
    reset_demo: 'Réinitialiser les données démo',
    reset_confirm: 'Réinitialiser les signalements et refus démo aux données initiales ?',
    empty_record_title: 'Aucun signalement enregistré',
    empty_record_sub: 'Les espèces envahissantes validées s’afficheront ici sous forme de tuiles.',
    empty_record_cta: 'Vérifier une observation',
    table_date: 'Date',
    table_species: 'Espèce',
    table_verdict: 'Décision',
    table_where: 'Lieu',

    // 404
    notfound_title: 'Page introuvable',
    notfound_desc: 'La coordonnée suivie ne mène à aucune observation répertoriée.',
    notfound_cta: 'Retourner à l’accueil'
  }
} as const;

export type TranslationKey = keyof typeof DICT.en;
