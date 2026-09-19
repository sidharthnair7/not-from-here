package ca.notfromhere.gate;

import java.time.LocalDate;

/** Where and when the photo was taken. lat/lng come from EXIF GPS or the user; takenAt from EXIF or today. */
public record PhotoMeta(double lat, double lng, LocalDate takenAt) {
}
