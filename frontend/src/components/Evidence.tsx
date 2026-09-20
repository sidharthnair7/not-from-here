import React from 'react';
import { CheckResult } from '../lib/mkResult';
import { HistSVG } from './HistSVG';

interface EvidenceProps {
  result: CheckResult;
}

export const Evidence: React.FC<EvidenceProps> = ({ result }) => {
  const proposals = result.proposals || [];
  const nearest = result.nearest || [];

  return (
    <>
      <section>
        <h4>What the models proposed</h4>
        {proposals.length > 0 ? (
          proposals.map((p, idx) => (
            <div className="prop" key={idx}>
              <div className="prop-h">{p.source}</div>
              {p.list.map((c, cIdx) => (
                <div className="cand" key={cIdx}>
                  <span className="cn">
                    <i>{c.taxonName}</i>
                    {c.common && <> <em>{c.common}</em></>}
                  </span>
                  <span className="bar">
                    <b style={{ width: `${Math.round(c.confidence * 100)}%` }}></b>
                  </span>
                  <span className="num">{c.confidence.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className="sub">No proposals.</p>
        )}
      </section>

      <section>
        <h4>Nearest real sightings</h4>
        {nearest.length > 0 ? (
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="m">Distance</th>
                  <th>Where</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {nearest.map((n, i) => (
                  <tr key={i}>
                    <td className="m">{n.date}</td>
                    <td className="m">{n.distance_km} km</td>
                    <td>{n.place || ''}</td>
                    <td>
                      {n.url ? (
                        <a href={n.url} target="_blank" rel="noopener noreferrer">
                          iNaturalist
                        </a>
                      ) : (
                        <span className="tag">sample data</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="sub" style={{ margin: 0 }}>
            No research-grade records within 200 km of this spot.
          </p>
        )}
      </section>

      {result.hist && (
        <section>
          <h4>
            Ontario records by month <span className="tag">photo month highlighted</span>
          </h4>
          <HistSVG hist={result.hist} month={result.histMonth} />
        </section>
      )}

      {result.sources && result.sources.length > 0 && (
        <section data-testid="sources">
          <h4>
            Queries this verdict was decided from <span className="tag">open one, you see the same counts</span>
          </h4>
          <ol className="sources">
            {result.sources.map((u, i) => {
              let label = u;
              try {
                const url = new URL(u);
                const host = url.hostname.replace('api.', '');
                const what = url.pathname.includes('histogram')
                  ? 'month histogram'
                  : url.pathname.includes('species/match')
                  ? 'species match'
                  : url.searchParams.get('radius')
                  ? `records within ${url.searchParams.get('radius')} km`
                  : (url.searchParams.get('geoDistance') || '').split(',')[2]
                  ? `occurrences within ${(url.searchParams.get('geoDistance') || '').split(',')[2]}`
                  : url.pathname;
                label = `${host}: ${what}`;
              } catch {
                // keep the raw URL as the label
              }
              return (
                <li key={i}>
                  <a href={u} target="_blank" rel="noopener noreferrer">
                    {label}
                  </a>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section>
        <h4>Raw evidence</h4>
        <pre className="json">{JSON.stringify(result.evidence || {}, null, 2)}</pre>
      </section>
    </>
  );
};
