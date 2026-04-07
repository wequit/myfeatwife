import LZString from "lz-string";

const VERSION = "v1";
const RESULTS_VERSION = "v2r";

export function encodeAnswers(answers) {
  const json = JSON.stringify(answers);
  const compressed = LZString.compressToEncodedURIComponent(json);
  return `${VERSION}_${compressed}`;
}

export function decodeAnswers(hash) {
  try {
    const cleaned = hash.startsWith("#") ? hash.slice(1) : hash;
    if (!cleaned.startsWith(`${VERSION}_`)) return null;
    const encoded = cleaned.slice(VERSION.length + 1);
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function encodeResults(adilAnswers, dianaAnswers) {
  const json = JSON.stringify({ adilAnswers, dianaAnswers });
  const compressed = LZString.compressToEncodedURIComponent(json);
  return `${RESULTS_VERSION}_${compressed}`;
}

export function decodeResults(hash) {
  try {
    const cleaned = hash.startsWith("#") ? hash.slice(1) : hash;
    if (!cleaned.startsWith(`${RESULTS_VERSION}_`)) return null;
    const encoded = cleaned.slice(RESULTS_VERSION.length + 1);
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (!parsed?.adilAnswers || !parsed?.dianaAnswers) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isPartnerLink() {
  const hash = window.location.hash;
  if (!hash || hash.length < 5) return false;
  const cleaned = hash.startsWith("#") ? hash.slice(1) : hash;
  return cleaned.startsWith(`${VERSION}_`);
}

export function isResultsLink() {
  const hash = window.location.hash;
  if (!hash || hash.length < 5) return false;
  const cleaned = hash.startsWith("#") ? hash.slice(1) : hash;
  return cleaned.startsWith(`${RESULTS_VERSION}_`);
}

export function buildShareUrl(answers) {
  const encoded = encodeAnswers(answers);
  const base = window.location.href.split("#")[0];
  return `${base}#${encoded}`;
}

export function buildResultsUrl(adilAnswers, dianaAnswers) {
  const encoded = encodeResults(adilAnswers, dianaAnswers);
  const base = window.location.href.split("#")[0];
  return `${base}#${encoded}`;
}
