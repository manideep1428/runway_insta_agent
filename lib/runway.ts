import RunwayML from '@runwayml/sdk';

if (!process.env.RUNWAYML_API_SECRET) {
  // We'll allow it to be empty for now so the app doesn't crash on startup,
  // but we should handle this in the UI.
  console.warn("RUNWAYML_API_SECRET is not set");
}

export const runway = new RunwayML({
  apiKey: process.env.RUNWAYML_API_SECRET,
});
