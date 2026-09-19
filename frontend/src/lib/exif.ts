import exifr from 'exifr';

export interface ExifData {
  hasGps: boolean;
  lat?: number;
  lng?: number;
  date?: string; // YYYY-MM-DD
}

export async function readExifData(file: File | Blob): Promise<ExifData> {
  try {
    const [gps, tags] = await Promise.all([
      exifr.gps(file).catch(() => null),
      exifr.parse(file, ['DateTimeOriginal', 'CreateDate', 'ModifyDate']).catch(() => null)
    ]);

    let lat: number | undefined;
    let lng: number | undefined;
    let hasGps = false;

    if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
      lat = +gps.latitude.toFixed(3);
      lng = +gps.longitude.toFixed(3);
      hasGps = true;
    }

    let dateStr: string | undefined;
    const dateObj = tags?.DateTimeOriginal || tags?.CreateDate || tags?.ModifyDate;
    if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
      dateStr = dateObj.toISOString().slice(0, 10);
    } else if (typeof dateObj === 'string') {
      // Exif dates often format as "YYYY:MM:DD HH:MM:SS"
      const m = dateObj.match(/^(\d{4})[:\-](\d{2})[:\-](\d{2})/);
      if (m) {
        dateStr = `${m[1]}-${m[2]}-${m[3]}`;
      }
    }

    return {
      hasGps,
      lat,
      lng,
      date: dateStr
    };
  } catch (err) {
    return {
      hasGps: false
    };
  }
}
