import React from 'react';

export const BrandIcon: React.FC = () => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 25C6 13 13 6 26 6c0 13-7 20-20 19Z" stroke="#a9baff" />
    <path d="M6 25 19 12" stroke="#a9baff" />
    <path d="M4 4l24 24" stroke="#ff7373" strokeWidth="2" />
  </svg>
);

export const CameraIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 8a2 2 0 0 1 2-2h1.5l1.2-1.6A1 1 0 0 1 9.500 4h5a1 1 0 0 1 .8.4L16.500 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
    <circle cx="12" cy="12.500" r="3.500" />
  </svg>
);

export const GoIcon: React.FC = () => (
  <svg
    className="ic"
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="24" cy="24" r="20" />
    <path d="M14 25l7 7 13-15" />
  </svg>
);

export const SplitIcon: React.FC = () => (
  <svg
    className="ic"
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="24" cy="24" r="20" />
    <path d="M24 36V24M24 24 15 14M24 24l9-10M11 14h5M16 9v5M37 14h-5M32 9v5" />
  </svg>
);

export const RangeIcon: React.FC = () => (
  <svg
    className="ic"
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
  >
    <circle cx="24" cy="24" r="4" />
    <circle cx="24" cy="24" r="11" opacity=".7" />
    <circle cx="24" cy="24" r="19" opacity=".4" />
  </svg>
);

export const NoIcon: React.FC = () => (
  <svg
    className="ic"
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
  >
    <circle cx="24" cy="24" r="20" />
    <path d="M10 38 38 10" />
  </svg>
);

export const IdleIcon: React.FC = () => (
  <svg
    className="ic"
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeDasharray="2 6"
  >
    <circle cx="24" cy="24" r="20" />
  </svg>
);

export const IconForVerdict: React.FC<{ verdict: string }> = ({ verdict }) => {
  if (verdict === 'REPORT') return <GoIcon />;
  if (verdict === 'NOT_VERIFIED_SPLIT') return <SplitIcon />;
  if (verdict === 'NEW_RANGE') return <RangeIcon />;
  return <NoIcon />;
};
