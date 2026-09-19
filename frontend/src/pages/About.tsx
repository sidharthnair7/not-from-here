import React from 'react';
import { SeoHead } from '../components/common/SeoHead';
import { useTranslation } from '../i18n/context';

export const About: React.FC = () => {
  const { lang } = useTranslation();

  return (
    <>
      <SeoHead
        title="About the Gate"
        description="Learn what the Not From Here four-rule decision gate does and what it refuses to do."
      />

      <div className="wrap" id="main-content">
        <div className="about">
          <div>
            <h1>
              {lang === 'fr'
                ? 'Ce que fait le filtre, et ce qu’il ne fait pas'
                : 'What the gate does, and what it does not'}
            </h1>
            <p>
              {lang === 'fr'
                ? 'Not From Here aide les personnes en Ontario à déterminer si une plante ou un insecte photographié justifie un signalement d’espèce envahissante. Un modèle de vision suggère ce dont il pourrait s’agir. Il ne décide jamais. Quatre règles fixes tranchent, et chaque refus expose ses preuves.'
                : 'Not From Here helps people in Ontario decide whether a plant or insect they photographed is worth reporting as invasive. A vision model suggests what it might be. It never gets to decide. Four fixed rules do, and every refusal shows the evidence behind it.'}
            </p>

            <div className="two" style={{ marginTop: 26 }}>
              <div className="card">
                <h2>{lang === 'fr' ? 'Ce qu’il fait' : 'It does'}</h2>
                <ul>
                  {lang === 'fr' ? (
                    <>
                      <li>Comparer les propositions de deux modèles indépendants</li>
                      <li>Vérifier la liste officielle des espèces envahissantes de l’Ontario</li>
                      <li>Rechercher des signalements certifiés récents à proximité</li>
                      <li>Vérifier la cohérence avec le mois de l’observation</li>
                      <li>Rédiger un projet de rapport uniquement à partir de ces preuves</li>
                    </>
                  ) : (
                    <>
                      <li>Compare the proposals from two models</li>
                      <li>Check Ontario's invasive list</li>
                      <li>Look for real, recent sightings nearby</li>
                      <li>Check the month makes sense</li>
                      <li>Draft a report from that evidence only</li>
                    </>
                  )}
                </ul>
              </div>
              <div className="card">
                <h2>{lang === 'fr' ? 'Ce qu’il ne fait pas' : 'It does not'}</h2>
                <ul>
                  {lang === 'fr' ? (
                    <>
                      <li>Deviner lorsque les modèles sont en désaccord</li>
                      <li>Signaler une espèce sans observations préalables à proximité</li>
                      <li>Remplacer un biologiste ou la ligne d’assistance téléphonique</li>
                      <li>Transmettre votre photo au rédacteur de rapport</li>
                    </>
                  ) : (
                    <>
                      <li>Guess when the models disagree</li>
                      <li>Report a species with no nearby records</li>
                      <li>Replace an expert or the hotline</li>
                      <li>Send your photo to the report writer</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <h2>{lang === 'fr' ? 'S’il indique une nouvelle zone' : 'If it says new range'}</h2>
            <p>
              {lang === 'fr' ? (
                <>
                  Cela signifie que l’espèce est inscrite sur la liste mais que personne ne l’a signalée dans un rayon de 200 km. Ces cas constituent précisément les observations nécessitant une validation humaine immédiate ; nous vous invitons donc à contacter la ligne d’assistance des espèces envahissantes. Obtenez le numéro sur le site du{' '}
                  <a
                    href="https://www.invasivespeciescentre.ca"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Centre des espèces envahissantes
                  </a>.
                </>
              ) : (
                <>
                  That means the species is on the list but nobody has recorded it within 200 km. Those
                  are exactly the sightings a person should confirm, so we send you to the Invading
                  Species Hotline. Get the number from the{' '}
                  <a
                    href="https://www.invasivespeciescentre.ca"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Invasive Species Centre
                  </a>{' '}
                  site.
                </>
              )}
            </p>
          </div>

          <div>
            <div className="card">
              <h2>{lang === 'fr' ? 'Sources de données' : 'Data sources'}</h2>
              <p className="sub">
                {lang === 'fr'
                  ? 'Observations iNaturalist (niveau recherche), données d’occurrence GBIF et profils d’espèces maintenus par le Centre des espèces envahissantes.'
                  : 'iNaturalist observations (research grade), GBIF occurrences, and species profiles from the Invasive Species Centre.'}
              </p>
              <h2 style={{ marginTop: 22 }}>{lang === 'fr' ? 'Travaux antérieurs' : 'Prior work'}</h2>
              <p className="sub">
                {lang === 'fr'
                  ? 'La sphère tournante de la page Registre a été initialement créée avant le hackathon pour un autre projet et est mentionnée sur la page du projet. La version présentée ici a été redessinée de zéro pour cette démonstration.'
                  : 'The rotating sphere on the Record page was first built before the hackathon for another project and is disclosed on the project page. The version here is drawn from scratch for this demo.'}
              </p>
              <h2 style={{ marginTop: 22 }}>{lang === 'fr' ? 'Quel modèle a fonctionné' : 'Which model ran'}</h2>
              <p className="sub">
                {lang === 'fr'
                  ? 'Défini par la variable d’environnement LLM_PROVIDER du backend. Le fichier README précise le fournisseur utilisé pour la démonstration.'
                  : 'Set by the backend\'s LLM_PROVIDER. The README names the provider used for the demo.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
