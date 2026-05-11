import RunwayML from '@runwayml/sdk';

// Lazily initialize to avoid build-time errors when env vars are missing
let runwayInstance: RunwayML | null = null;

export function getRunwayClient() {
  if (!runwayInstance) {
    if (!process.env.RUNWAYML_API_SECRET) {
      console.warn("RUNWAYML_API_SECRET is not set");
    }
    runwayInstance = new RunwayML({
      apiKey: process.env.RUNWAYML_API_SECRET,
    });
  }
  return runwayInstance;
}

// Keep the old export for backward compatibility if possible, but it might still crash
// Better to just change it to the getter.
export const runway = new Proxy({} as RunwayML, {
  get: (target, prop) => {
    return (getRunwayClient() as any)[prop];
  }
});
