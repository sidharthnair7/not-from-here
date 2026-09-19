import React, { useEffect } from 'react';

interface SeoHeadProps {
  title: string;
  description: string;
}

export const SeoHead: React.FC<SeoHeadProps> = ({ title, description }) => {
  useEffect(() => {
    const fullTitle = `${title} · Not From Here`;
    document.title = fullTitle;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:image', '/og-image.svg');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', '/og-image.svg');

    // JSON-LD WebApplication schema
    let jsonLd = document.getElementById('json-ld-app');
    if (!jsonLd) {
      jsonLd = document.createElement('script');
      jsonLd.id = 'json-ld-app';
      jsonLd.setAttribute('type', 'application/ld+json');
      document.head.appendChild(jsonLd);
    }
    jsonLd.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Not From Here',
      url: window.location.origin,
      applicationCategory: 'EnvironmentApplication',
      operatingSystem: 'Any',
      description:
        'A deterministic four-rule decision gate for reporting invasive plant and insect species in Ontario.',
      inLanguage: ['en', 'fr'],
      author: {
        '@type': 'Organization',
        name: 'Not From Here Project'
      }
    });
  }, [title, description]);

  return null;
};
