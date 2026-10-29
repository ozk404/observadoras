// Only new submissions accept the current notice. Historical records retain their version.
export const AI_CONSENT_VERSION = "2026-10-29-reports-v2";
// Both notices authorize the same private description/capture analysis with OpenAI.
// This list never grants publication permission or accepts new terms retroactively.
export const AI_ANALYSIS_CONSENT_VERSIONS = ["2026-10-26-reports-v1", AI_CONSENT_VERSION];
export function permitsInitialAnalysis(version: string | null) {
  return version !== null && AI_ANALYSIS_CONSENT_VERSIONS.includes(version);
}
