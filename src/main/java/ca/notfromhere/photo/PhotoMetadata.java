package ca.notfromhere.photo;

import com.drew.imaging.ImageMetadataReader;
import com.drew.lang.GeoLocation;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import com.drew.metadata.exif.GpsDirectory;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;

/**
 * What the camera itself says about the photo. Read server-side so it cannot be edited in the browser.
 * Used as evidence (does the camera's GPS agree with the location the user typed?), never as a refusal:
 * plenty of real field photos come from cameras with no GPS.
 */
public record PhotoMetadata(boolean hasExif, Double gpsLat, Double gpsLng, LocalDate takenAt, String camera) {

    public static final PhotoMetadata NONE = new PhotoMetadata(false, null, null, null, null);

    public boolean hasGps() {
        return gpsLat != null && gpsLng != null;
    }

    public static PhotoMetadata read(byte[] image) {
        if (image == null || image.length == 0) return NONE;
        try {
            Metadata metadata = ImageMetadataReader.readMetadata(new ByteArrayInputStream(image));
            Double lat = null, lng = null;
            GpsDirectory gps = metadata.getFirstDirectoryOfType(GpsDirectory.class);
            if (gps != null) {
                GeoLocation loc = gps.getGeoLocation();
                if (loc != null && !loc.isZero()) {
                    lat = loc.getLatitude();
                    lng = loc.getLongitude();
                }
            }
            LocalDate taken = null;
            ExifSubIFDDirectory exif = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);
            if (exif != null) {
                Date d = exif.getDateOriginal();
                if (d != null) taken = d.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
            }
            String camera = null;
            com.drew.metadata.exif.ExifIFD0Directory ifd0 = metadata.getFirstDirectoryOfType(com.drew.metadata.exif.ExifIFD0Directory.class);
            if (ifd0 != null) {
                String make = ifd0.getString(com.drew.metadata.exif.ExifIFD0Directory.TAG_MAKE);
                String model = ifd0.getString(com.drew.metadata.exif.ExifIFD0Directory.TAG_MODEL);
                if (make != null || model != null) camera = ((make == null ? "" : make) + " " + (model == null ? "" : model)).trim();
            }
            boolean hasExif = exif != null || gps != null || ifd0 != null;
            return new PhotoMetadata(hasExif, lat, lng, taken, camera);
        } catch (Exception e) {
            return NONE;
        }
    }
}
