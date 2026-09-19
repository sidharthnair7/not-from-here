import React from 'react';
import { useTranslation } from '../../i18n/context';

export const SkipLink: React.FC = () => {
  const { t } = useTranslation();

  return (
    <a href="#main-content" className="skip-link">
      {t('skip_to_content')}
    </a>
  );
};
