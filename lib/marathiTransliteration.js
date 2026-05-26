const vowelSigns = {
  a: "",
  aa: "ा",
  i: "ि",
  ee: "ी",
  ii: "ी",
  u: "ु",
  oo: "ू",
  uu: "ू",
  e: "े",
  ai: "ै",
  o: "ो",
  au: "ौ"
};

const independentVowels = {
  a: "अ",
  aa: "आ",
  i: "इ",
  ee: "ई",
  ii: "ई",
  u: "उ",
  oo: "ऊ",
  uu: "ऊ",
  e: "ए",
  ai: "ऐ",
  o: "ओ",
  au: "औ"
};

const consonants = {
  ksh: "क्ष",
  dny: "ज्ञ",
  gy: "ज्ञ",
  shr: "श्र",
  chh: "छ",
  kh: "ख",
  gh: "घ",
  ch: "च",
  jh: "झ",
  th: "थ",
  dh: "ध",
  ph: "फ",
  bh: "भ",
  sh: "श",
  gn: "ज्ञ",
  tr: "त्र",
  k: "क",
  q: "क",
  g: "ग",
  c: "क",
  j: "ज",
  z: "झ",
  t: "त",
  d: "द",
  n: "न",
  p: "प",
  f: "फ",
  b: "ब",
  m: "म",
  y: "य",
  r: "र",
  l: "ल",
  v: "व",
  w: "व",
  s: "स",
  h: "ह",
  x: "क्ष"
};

const vowelTokens = Object.keys(vowelSigns).sort((first, second) => second.length - first.length);
const consonantTokens = Object.keys(consonants).sort((first, second) => second.length - first.length);

const dictionaryEntries = [
  { word: "गाय", aliases: ["gay", "gai", "gaay", "cow"] },
  { word: "गायी", aliases: ["gayi", "gaayi", "cows"] },
  { word: "वासरू", aliases: ["vasaru", "wasaru", "calf"] },
  { word: "वासरी", aliases: ["vasari", "wasari"] },
  { word: "बैल", aliases: ["bail", "bull"] },
  { word: "जर्सी", aliases: ["jarsi", "jersey"] },
  { word: "एच एफ", aliases: ["hf", "h f", "ech ef"] },
  { word: "गीर", aliases: ["gir", "geer"] },
  { word: "साहिवाल", aliases: ["sahiwal", "sahival"] },
  { word: "देशी", aliases: ["deshi", "desi"] },
  { word: "काळा", aliases: ["kala", "black"] },
  { word: "पांढरा", aliases: ["pandhra", "pandhara", "white"] },
  { word: "लाल", aliases: ["lal", "red"] },
  { word: "तपकिरी", aliases: ["tapkiri", "brown"] },
  { word: "करडा", aliases: ["karada", "grey", "gray"] },
  { word: "दूध", aliases: ["dudh", "doodh", "milk"] },
  { word: "सकाळ", aliases: ["sakal", "morning"] },
  { word: "संध्याकाळ", aliases: ["sandhyakal", "evening"] },
  { word: "लिटर", aliases: ["liter", "litre", "ltr"] },
  { word: "किलो", aliases: ["kilo", "kg"] },
  { word: "मिली", aliases: ["ml", "mili", "milli"] },
  { word: "चारा", aliases: ["chara", "fodder"] },
  { word: "मुरघास", aliases: ["murghas", "murgas", "murgha", "silage"] },
  { word: "कॅटल फीड", aliases: ["cattle feed", "katl feed", "cattlefeed"] },
  { word: "भुसा", aliases: ["bhusa", "bhoosa"] },
  { word: "कडबा", aliases: ["kadba", "kadaba"] },
  { word: "हिरवा चारा", aliases: ["hirva chara", "green fodder"] },
  { word: "गवत", aliases: ["gavat", "grass"] },
  { word: "सुग्रास", aliases: ["sugras", "sugrass"] },
  { word: "मका", aliases: ["maka", "makka", "corn"] },
  { word: "मका पीठ", aliases: ["maka pith", "makka pith", "maka peeth", "makka peeth"] },
  { word: "मिनरल मिक्स", aliases: ["mineral mix", "mineral"] },
  { word: "बॅग", aliases: ["bag", "bags"] },
  { word: "इनर", aliases: ["inner", "inar"] },
  { word: "प्लास्टिक", aliases: ["plastic"] },
  { word: "मजुरी", aliases: ["majuri", "labor", "labour"] },
  { word: "वाहतूक", aliases: ["vahatuk", "vahtuk", "transport"] },
  { word: "पुरवठादार", aliases: ["puravthadar", "supplier"] },
  { word: "खर्च", aliases: ["kharch", "expense", "cost"] },
  { word: "रुपये", aliases: ["rupaye", "rupees", "rs"] },
  { word: "औषध", aliases: ["aushadh", "medicine"] },
  { word: "औषधाचे नाव", aliases: ["aushadhache nav", "medicine name"] },
  { word: "लस", aliases: ["las", "vaccine"] },
  { word: "लसीकरण", aliases: ["lasikaran", "vaccination"] },
  { word: "जंतनाशक", aliases: ["jantnashak", "deworming"] },
  { word: "तपासणी", aliases: ["tapasni", "checkup"] },
  { word: "उपचार", aliases: ["upchar", "treatment"] },
  { word: "आजारपण", aliases: ["ajar", "ajarpan", "illness"] },
  { word: "ताप", aliases: ["tap", "fever"] },
  { word: "खोकला", aliases: ["khokla", "cough"] },
  { word: "जुलाब", aliases: ["julab", "diarrhea"] },
  { word: "सूज", aliases: ["suj", "swelling"] },
  { word: "जखम", aliases: ["jakham", "wound"] },
  { word: "डॉक्टर", aliases: ["doctor", "dr"] },
  { word: "पाटील", aliases: ["patil"] },
  { word: "रेतन", aliases: ["retan", "ai"] },
  { word: "गर्भ", aliases: ["garbh"] },
  { word: "गाभण", aliases: ["gabhan", "pregnant"] },
  { word: "व्यायण", aliases: ["vyayan", "calving"] },
  { word: "सामान्य", aliases: ["samanya", "normal"] },
  { word: "कठीण", aliases: ["kathin", "difficult"] },
  { word: "गोशाळा", aliases: ["goshala", "goushala"] },
  { word: "गोठा", aliases: ["gotha"] },
  { word: "गाव", aliases: ["gav", "village"] },
  { word: "तालुका", aliases: ["taluka"] },
  { word: "जिल्हा", aliases: ["jilha", "district"] },
  { word: "महाराष्ट्र", aliases: ["maharashtra"] },
  { word: "डेअरी", aliases: ["dairy"] },
  { word: "पशुवैद्यक", aliases: ["pashuvaidyak", "vet"] },
  { word: "खुरपका-तोंडपका", aliases: ["khurpaka tondpaka", "fmd"] },
  { word: "घटसर्प", aliases: ["ghatsarp", "hs"] },
  { word: "ब्रुसेलोसिस", aliases: ["brucellosis"] },
  { word: "थायलेरिया", aliases: ["theileria"] }
];

const aliasToWord = new Map();
const suggestionWords = [];

for (const entry of dictionaryEntries) {
  suggestionWords.push(entry.word);
  aliasToWord.set(normalizeSearch(entry.word), entry.word);

  for (const alias of entry.aliases) {
    aliasToWord.set(normalizeSearch(alias), entry.word);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSearch(value) {
  return String(value || "")
    .toLocaleLowerCase("mr-IN")
    .replace(/[^a-z0-9\u0900-\u097F]+/g, "");
}

function hasRomanLetters(value) {
  return /[A-Za-z]/.test(value);
}

function hasDevanagari(value) {
  return /[\u0900-\u097F]/.test(value);
}

function matchToken(source, index, tokens) {
  return tokens.find((token) => source.startsWith(token, index)) || "";
}

function transliterateRomanWord(word) {
  if (!word || !hasRomanLetters(word) || /\d/.test(word)) {
    return word;
  }

  const exact = aliasToWord.get(normalizeSearch(word));

  if (exact) {
    return exact;
  }

  const source = word.toLocaleLowerCase("en-IN");
  let output = "";
  let index = 0;

  while (index < source.length) {
    const vowel = matchToken(source, index, vowelTokens);

    if (vowel) {
      output += independentVowels[vowel];
      index += vowel.length;
      continue;
    }

    const consonant = matchToken(source, index, consonantTokens);

    if (!consonant) {
      output += word[index] || source[index];
      index += 1;
      continue;
    }

    const nextIndex = index + consonant.length;
    const nextVowel = matchToken(source, nextIndex, vowelTokens);
    const nextConsonant = matchToken(source, nextIndex, consonantTokens);

    output += consonants[consonant];

    if (nextVowel) {
      output += vowelSigns[nextVowel];
      index = nextIndex + nextVowel.length;
      continue;
    }

    if (nextConsonant) {
      output += "्";
    }

    index = nextIndex;
  }

  return output;
}

function applyPhraseAliases(text) {
  let nextText = text;
  const phraseAliases = dictionaryEntries
    .flatMap((entry) => entry.aliases.map((alias) => ({ alias, word: entry.word })))
    .filter((entry) => /[\s-]/.test(entry.alias))
    .sort((first, second) => second.alias.length - first.alias.length);

  for (const { alias, word } of phraseAliases) {
    const pattern = new RegExp(`(^|[^A-Za-z])(${escapeRegExp(alias)})(?=$|[^A-Za-z])`, "gi");
    nextText = nextText.replace(pattern, (_, prefix) => `${prefix}${word}`);
  }

  return nextText;
}

export function transliterateMarathiText(value) {
  const text = applyPhraseAliases(String(value || ""));
  return text.replace(/[A-Za-z]+/g, (word) => transliterateRomanWord(word));
}

function getTrailingRomanCandidates(value) {
  const body = String(value || "").replace(/\s+$/g, "");
  const match = body.match(/[A-Za-z][A-Za-z\s-]{0,50}$/);

  if (!match) {
    return [];
  }

  const words = match[0].match(/[A-Za-z]+/g) || [];
  const candidates = [];

  for (let count = Math.min(3, words.length); count >= 1; count -= 1) {
    candidates.push(words.slice(-count).join(" "));
  }

  return candidates;
}

function getTrailingMarathiWord(value) {
  const body = String(value || "").replace(/\s+$/g, "");
  return body.match(/[\u0900-\u097F]+$/)?.[0] || "";
}

function distance(first, second) {
  const rows = first.length + 1;
  const columns = second.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(columns).fill(0));

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }

  for (let column = 0; column < columns; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const cost = first[row - 1] === second[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost
      );
    }
  }

  return matrix[first.length][second.length];
}

function addUnique(list, word) {
  if (word && !list.includes(word)) {
    list.push(word);
  }
}

export function getMarathiSuggestions(value, limit = 3) {
  const suggestions = [];
  const romanCandidates = getTrailingRomanCandidates(value);

  if (romanCandidates.length > 0) {
    if (normalizeSearch(romanCandidates[romanCandidates.length - 1]).length < 2) {
      return [];
    }

    const scored = [];

    for (const candidate of romanCandidates) {
      const normalizedCandidate = normalizeSearch(candidate);

      for (const entry of dictionaryEntries) {
        const aliases = [entry.word, ...entry.aliases];

        for (const alias of aliases) {
          const normalizedAlias = normalizeSearch(alias);
          let score = null;

          if (normalizedAlias === normalizedCandidate) {
            score = 0;
          } else if (normalizedAlias.startsWith(normalizedCandidate)) {
            score = 1;
          } else if (normalizedCandidate.length >= 3 && normalizedAlias.includes(normalizedCandidate)) {
            score = 2;
          } else if (normalizedCandidate.length >= 4) {
            const editDistance = distance(normalizedCandidate, normalizedAlias);
            if (editDistance <= 2) {
              score = 3 + editDistance;
            }
          }

          if (score !== null) {
            scored.push({ score, word: entry.word });
          }
        }
      }
    }

    scored
      .sort((first, second) => first.score - second.score || first.word.localeCompare(second.word, "mr-IN"))
      .forEach((item) => addUnique(suggestions, item.word));

    addUnique(suggestions, transliterateMarathiText(romanCandidates[romanCandidates.length - 1]));
    return suggestions.slice(0, limit);
  }

  const marathiWord = getTrailingMarathiWord(value);

  if (marathiWord) {
    suggestionWords
      .filter((word) => word.startsWith(marathiWord) && word !== marathiWord)
      .forEach((word) => addUnique(suggestions, word));
  }

  return suggestions.slice(0, limit);
}

export function applyMarathiSuggestion(value, suggestion) {
  const text = String(value || "");
  const trailingSpace = text.match(/\s+$/)?.[0] || "";
  const body = trailingSpace ? text.slice(0, -trailingSpace.length) : text;
  const romanMatch = body.match(/[A-Za-z][A-Za-z\s-]{0,50}$/);

  if (romanMatch) {
    return `${body.slice(0, romanMatch.index)}${suggestion}${trailingSpace}`;
  }

  const marathiMatch = body.match(/[\u0900-\u097F]+$/);

  if (marathiMatch) {
    return `${body.slice(0, marathiMatch.index)}${suggestion}${trailingSpace}`;
  }

  return `${text}${text && !/\s$/.test(text) ? " " : ""}${suggestion}`;
}

export function shouldAutoTransliterate(value) {
  return hasRomanLetters(value) && !hasDevanagari(value);
}
