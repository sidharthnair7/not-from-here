import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/context';

export const LiveStatusBadge: React.FC = () => {
  const [isLive, setIsLive] = useState<boolean | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    fetch('/api/health', { signal: controller.signal })
      .then((r) => {
        if (active) setIsLive(r.ok);
      })
      .catch(() => {
        if (active) setIsLive(false);
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  const live = isLive === true;
  const tip = live ? t('status_live_tip') : t('status_demo_tip');
  const label = live ? t('status_live') : t('status_demo');

  return (
    <div
      className="status-pill"
      title={tip}
      tabIndex={0}
      role="status"
      aria-label={`API status: ${label}. ${tip}`}
    >
      <span className={`status-dot ${live ? 'live' : 'demo'}`} />
      <span className="status-text">{label}</span>
    </div>
  );
};
