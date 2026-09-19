import React from 'react';
import { useStore } from '../state/store';

export const Toast: React.FC = () => {
  const { toastMsg, toastVisible } = useStore();

  return (
    <div
      className={`toast ${toastVisible ? 'on' : ''}`}
      id="toast"
      role="status"
    >
      {toastMsg}
    </div>
  );
};
