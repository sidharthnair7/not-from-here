import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useStore } from '../state/store';
import { SCEN } from '../lib/fixtures';
import { SP } from '../lib/species';
import { fmt } from '../lib/format';
import { drawArt } from '../lib/art';
import { CameraIcon } from './Icons';
import { readExifData } from '../lib/exif';
import { useTranslation } from '../i18n/context';

async function downscaleImage(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const MAX_DIM = 1600;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }
      const cv = document.createElement('canvas');
      cv.width = width;
      cv.height = height;
      const ctx = cv.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context error'));
      ctx.drawImage(img, 0, 0, width, height);
      cv.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Blob conversion error'));
          const dataUrl = cv.toDataURL('image/jpeg', 0.85);
          resolve({ blob, dataUrl });
        },
        'image/jpeg',
        0.85
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

export const PhotoFrame: React.FC = () => {
  const { scn, upload, uploadGps, uploadFiles, setUpload, addUploadView, setCoordinates, showToast } =
    useStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isOver, setIsOver] = useState<boolean>(false);
  const { t } = useTranslation();

  const s = scn ? SCEN[scn] : null;

  const processFile = useCallback(
    async (file?: File | null) => {
      if (!file) return;

      // 1. Validate file format & size
      const name = file.name.toLowerCase();
      if (name.endsWith('.heic') || name.endsWith('.heif')) {
        showToast(t('err_heic'));
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        showToast(t('err_oversized'));
        return;
      }
      if (!file.type.startsWith('image/')) {
        showToast('Choose an image file');
        return;
      }

      // 2. Read real EXIF data
      const exif = await readExifData(file);
      if (exif.hasGps && exif.lat !== undefined && exif.lng !== undefined) {
        setCoordinates(exif.lat, exif.lng);
      }

      // 3. Client downscale to max 1600px
      try {
        const { blob, dataUrl } = await downscaleImage(file);
        const downscaledFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
          type: 'image/jpeg'
        });
        setUpload(dataUrl, downscaledFile, exif);
      } catch {
        // Fallback to direct read if canvas downscale fails
        const rd = new FileReader();
        rd.onload = () => {
          if (typeof rd.result === 'string') {
            setUpload(rd.result, file, exif);
          }
        };
        rd.readAsDataURL(file);
      }
    },
    [setUpload, setCoordinates, showToast, t]
  );

  // Clipboard Paste Support (Ctrl/Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.startsWith('image/')) {
            const pastedFile = item.getAsFile();
            if (pastedFile) {
              processFile(pastedFile);
              showToast(t('paste_ready'));
              break;
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processFile, showToast, t]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // dragleave also fires when the cursor moves onto a child of the frame; ignore those or the overlay flickers
    const next = e.relatedTarget as Node | null;
    if (next && e.currentTarget.contains(next)) return;
    setIsOver(false);
  };

  /** First file becomes the photo; the next two become extra views of the same subject. */
  const processFiles = useCallback(
    async (list: FileList | File[]) => {
      const files = Array.from(list).filter((f) => f.type.startsWith('image/')).slice(0, 3);
      if (files.length === 0) return;
      await processFile(files[0]);
      for (const extra of files.slice(1)) {
        try {
          const { blob } = await downscaleImage(extra);
          addUploadView(new File([blob], extra.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
        } catch {
          addUploadView(extra);
        }
      }
      if (files.length > 1) showToast(`${files.length} views of the same subject`);
    },
    [processFile, addUploadView, showToast]
  );

  // A file dropped anywhere on the page must never open in a new tab: catch it at the window and treat it as an upload
  useEffect(() => {
    const swallow = (e: DragEvent) => {
      e.preventDefault();
    };
    const dropAnywhere = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    };
    window.addEventListener('dragover', swallow);
    window.addEventListener('drop', dropAnywhere);
    return () => {
      window.removeEventListener('dragover', swallow);
      window.removeEventListener('drop', dropAnywhere);
    };
  }, [processFiles]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Draw procedural canvas thumbnail for demo scenarios
  useEffect(() => {
    if (s && !upload && canvasRef.current) {
      const cv = canvasRef.current;
      const c = cv.getContext('2d');
      if (c) {
        c.filter = s.blur ? `blur(${s.blur * 1.6}px)` : 'none';
        const sp = SP[s.key] || SP.phragmites;
        drawArt(c, 640, 480, sp.kind, sp.hue, s.seed);
      }
    }
  }, [s, upload]);

  const isFilled = Boolean(s || upload);

  // Truthful chip text: Real EXIF vs No GPS vs Demo scenario
  let chipText = '';
  const viewsNote = uploadFiles.length > 1 ? ` · ${uploadFiles.length} views` : '';
  if (upload) {
    if (uploadGps?.hasGps && uploadGps.lat !== undefined && uploadGps.lng !== undefined) {
      const d = uploadGps.date ? ` · ${fmt(uploadGps.date)}` : '';
      chipText = `${t('gps_found')}${d} · ${uploadGps.lat.toFixed(3)}, ${uploadGps.lng.toFixed(3)}${viewsNote}`;
    } else {
      chipText = `${t('gps_none')}${viewsNote}`;
    }
  } else if (s) {
    chipText = `${t('gps_found')} · ${fmt(s.date)} · ${s.lat.toFixed(3)}, ${s.lng.toFixed(3)}`;
  }

  return (
    <>
      <div
        className={`frame ${isFilled ? 'filled' : ''} ${isOver ? 'over' : ''}`}
        id="frame"
        tabIndex={0}
        role="button"
        aria-label="Choose or drop a photo"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isOver && (
          <div className="drop-overlay" aria-hidden="true">
            <b>{t('drop_hint_bold')}</b>
          </div>
        )}

        {upload ? (
          <img src={upload} alt="Your uploaded observation" />
        ) : s ? (
          <canvas ref={canvasRef} width={640} height={480} id="pv"></canvas>
        ) : (
          <div className="hint">
            <CameraIcon />
            <b>{t('drop_hint_bold')}</b>
            {t('drop_hint_sub')}
          </div>
        )}

        {isFilled && <div className="chip">{chipText}</div>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        id="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
          }
          e.target.value = '';
        }}
      />
    </>
  );
};
