import React from 'react';
import { Link } from 'react-router-dom';
import { SeoHead } from '../components/common/SeoHead';
import { useTranslation } from '../i18n/context';

export const NotFound: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="wrap" id="main-content" style={{ padding: '120px 0 160px', textAlign: 'center' }}>
      <SeoHead
        title="404 - Not Found"
        description="The requested species or gate record does not exist."
      />
      <div className="card spot" style={{ maxWidth: 540, margin: '0 auto', padding: 40 }}>
        <span className="mono" style={{ color: 'var(--acc)', fontSize: 14 }}>
          ERROR 404
        </span>
        <h1
          style={{
            font: '400 clamp(36px, 5vw, 56px)/1.05 var(--serif)',
            margin: '16px 0 12px'
          }}
        >
          {t('notfound_title')}
        </h1>
        <p className="sub" style={{ fontSize: 16, marginBottom: 28 }}>
          {t('notfound_desc')}
        </p>
        <Link to="/" className="btn sm" style={{ width: 'auto', display: 'inline-block' }}>
          {t('notfound_cta')} ➔
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
