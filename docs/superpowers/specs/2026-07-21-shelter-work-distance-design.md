# Shelter-to-work Distance Design

## Goal

Help shelter staff and employers understand whether a job is realistically reachable from the participant's shelter. The MVP displays an approximate geographic distance without requiring a paid mapping service. The design keeps exact shelter details private until the existing approval gate is completed.

## Scope

The first release will:

- store an address and coordinates for each shelter;
- store a workplace address and coordinates for each job;
- offer a browser-based **Use current location** action for capturing coordinates;
- allow coordinates to be entered manually when location permission is unavailable;
- calculate straight-line distance using the Haversine formula;
- display the result as **Approximate distance from shelter** in matching views;
- keep exact shelter address and coordinates hidden from employers until shelter approval;
- isolate distance calculation behind a small service that can later call Google Maps Routes.

The first release will not calculate road distance, public-transit time, fares, or route instructions. It will not automatically reject candidates based on distance.

## Data Model

`shelters` gains nullable `latitude` and `longitude` columns. Its existing `address` remains the human-readable location.

`jobs` gains nullable `latitude` and `longitude` columns. Its existing `location` becomes the human-readable workplace address.

Coordinates use double precision and are validated to latitude `-90..90` and longitude `-180..180`. Existing records remain valid with null coordinates and display an unavailable state.

TypeScript models expose optional `latitude` and `longitude` values on `Shelter` and `Job`.

## User Experience

### Shelter profile

The profile form adds a **Shelter location** section containing:

- full address;
- latitude and longitude fields;
- **Use current location** button;
- location-permission, unavailable, and validation messages.

Capturing the browser location fills the coordinate fields but does not save until the user submits the form.

### Job creation

The job form changes **Work location** into a section containing:

- workplace address;
- latitude and longitude;
- **Use current location** button;
- the same validation and permission states as the shelter form.

### Matching cards

When both coordinate pairs exist, cards show a compact label such as:

> Approximate distance from shelter: 8.4 km

When coordinates are missing, shelter users see a setup prompt. Employers see a neutral **Distance unavailable** message without receiving the shelter's exact address or coordinates.

The distance is informational in the MVP and does not alter the skill-match percentage.

## Architecture

A pure `distance` module owns:

- coordinate validation;
- Haversine distance in kilometres;
- user-facing distance formatting;
- a `DistanceProvider` interface reserved for a future routing provider.

UI components consume only this module. Replacing the approximate calculator with Google Maps Routes will therefore not require database or card-layout changes.

A reusable location-field component owns browser geolocation, loading state, permission errors, and coordinate inputs. It does not save data itself.

## Privacy and Safety

- Before approval, employers receive only the derived distance—not the shelter address or raw coordinates in the rendered interface.
- After approval, the existing profile popup may show the shelter address and telephone details.
- Browser location capture requires an explicit button press.
- Coordinates are never captured automatically on page load.
- Distance is labelled approximate so it is not mistaken for travel time or road distance.

## Error Handling

- Invalid coordinates prevent form submission and identify the affected field.
- Denied browser permission leaves existing values unchanged and shows instructions for manual entry.
- Missing coordinates never break ranking or matching; the distance label falls back gracefully.
- Distance calculation rejects non-finite and out-of-range values.

## Testing

Vitest will be introduced as the project test runner. Tests will be written before implementation for:

- known Haversine distances;
- zero distance;
- invalid coordinate ranges;
- unavailable distance when either location is missing;
- stable Thai distance formatting;
- location-field validation behavior.

The final verification includes the new test suite, TypeScript validation, and the Next.js production build.

## Future Upgrade

The future Google Maps Routes adapter will accept the same origin and destination coordinate objects and return road distance, estimated duration, and travel mode. The UI can then add transit time without changing stored records or privacy gates.
