const RESTRICTED_TERMS = [
  "fuck",
  "fucking",
  "fucker",
  "fucked",
  "sh*t",
  "shit",
  "shitting",
  "shitty",
  "bitch",
  "bitching",
  "bitchy",
  "wtf",
  "w.t.f",
  "asshole",
  "dick",
  "bastard",
];

const substitutionMap = {
  "$": "s",
  "*": "i",
  "1": "i",
  "!": "i",
  "0": "o",
  "@": "a",
};

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .split("")
    .map((ch) => substitutionMap[ch] || ch)
    .join("")
    .replace(/[^a-z]/g, "");
}

const normalizedRestricted = RESTRICTED_TERMS.map((term) => normalize(term));

export function containsRestrictedLanguage(text = "") {
  const raw = String(text || "");
  const normalized = normalize(raw);

  for (const term of normalizedRestricted) {
    if (term && normalized.includes(term)) return true;
  }

  // Secondary guard for spaced/punctuated variants like w.t.f or s h i t.
  const compact = raw.toLowerCase().replace(/[\s._-]+/g, "");
  return /wtf|shit|fuck|bitch|asshole|bastard|dick/i.test(compact);
}

export { RESTRICTED_TERMS };
