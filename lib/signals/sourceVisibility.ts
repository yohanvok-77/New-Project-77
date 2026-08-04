export const hiddenSignalSourceNames = ["E+M Range"];

export function isVisibleSignalSource(sourceName: string | null | undefined) {
  return !hiddenSignalSourceNames.includes(sourceName?.trim() || "");
}

export function normalizeSignalSourceName(
  sourceName: string | null | undefined,
  pair: string | null | undefined,
  algorithmName?: string | null,
) {
  const normalizedPair = pair?.toUpperCase().replace(/[^A-Z0-9]/g, "") || "";
  const normalizedAlgorithm = algorithmName?.toUpperCase() || "";

  if (
    normalizedPair.startsWith("XAU") ||
    normalizedPair.startsWith("XAG") ||
    normalizedAlgorithm.startsWith("XAU-") ||
    normalizedAlgorithm.startsWith("XAG-")
  ) {
    return "XAU/XAG Range";
  }

  return sourceName?.trim() || "E+R Range";
}
