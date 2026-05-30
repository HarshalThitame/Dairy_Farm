export const FEED_SECTION_CATTLE_FEED = "कॅटल फीड";

const sectionDisplayNames = {
  [FEED_SECTION_CATTLE_FEED]: "खाद्य",
  "Cattle Feed": "खाद्य",
  "Cattle Feed Cost": "खाद्य",
  "कॅटल फीड खर्च": "खाद्य खर्च",
  "इतर": "इतर खर्च"
};

export function displayFeedSectionName(section) {
  return sectionDisplayNames[section] || section || "इतर";
}

export function displayFeedExpenseText(value) {
  return String(value || "")
    .replaceAll("कॅटल फीड", "खाद्य")
    .replaceAll("Cattle Feed", "खाद्य");
}
