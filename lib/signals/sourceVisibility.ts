export const hiddenSignalSourceNames = ["E+M Range"];

export function isVisibleSignalSource(sourceName: string | null | undefined) {
  return !hiddenSignalSourceNames.includes(sourceName?.trim() || "");
}
