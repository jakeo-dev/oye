export type CurriculumPart = {
  id: string;
  title: string;
};

export type CurriculumSection = {
  id: string;
  partId: string;
  partTitle: string;
  order: number;
  title: string;
  focus: string;
  concepts: string[];
  promptGuidance: string[];
};

export const CURRICULUM_PARTS: CurriculumPart[] = [
  { id: "core-grammar-foundations", title: "Part I - Core Grammar Foundations" },
  { id: "essential-sentence-structure", title: "Part II - Essential Sentence Structure" },
  { id: "expanding-grammar", title: "Part III - Expanding Grammar" },
  { id: "verb-tenses", title: "Part IV - Verb Tenses" },
  { id: "intermediate-structures", title: "Part V - Intermediate Structures" },
];

const partTitleById = Object.fromEntries(
  CURRICULUM_PARTS.map((part) => [part.id, part.title]),
);

function section(
  partId: string,
  order: number,
  id: string,
  title: string,
  focus: string,
  concepts: string[],
  promptGuidance: string[],
): CurriculumSection {
  return {
    id,
    partId,
    partTitle: partTitleById[partId] ?? "Curriculum",
    order,
    title,
    focus,
    concepts,
    promptGuidance,
  };
}

export const CURRICULUM_SECTIONS: CurriculumSection[] = [
  section(
    "core-grammar-foundations",
    1,
    "alphabet-pronunciation",
    "The Spanish Alphabet and Pronunciation",
    "Letters, sounds, accent marks, syllables, and stress.",
    ["letters and sounds", "accent marks", "syllables", "stress"],
    [
      "Teach pronunciation through practical words from the selected scenario.",
      "Include accent marks only where they change stress or meaning.",
      "Keep speaking practice focused on clear syllables and stress.",
    ],
  ),
  section(
    "core-grammar-foundations",
    2,
    "nouns-gender",
    "Nouns and Gender",
    "Masculine and feminine nouns, common patterns, exceptions, and plurals.",
    [
      "masculine nouns",
      "feminine nouns",
      "common gender patterns",
      "exceptions",
      "singular and plural nouns",
    ],
    [
      "Use concrete nouns from the selected scenario.",
      "Teach common -o/-a patterns without pretending they are universal.",
      "Include at least one useful exception.",
    ],
  ),
  section(
    "core-grammar-foundations",
    3,
    "articles",
    "Articles",
    "Definite and indefinite articles with agreement.",
    ["definite articles", "indefinite articles", "article agreement"],
    [
      "Use el, la, los, las, un, una, unos, and unas in scenario examples.",
      "Connect articles back to noun gender and number.",
      "Keep examples beginner-friendly and immediately useful.",
    ],
  ),
  section(
    "core-grammar-foundations",
    4,
    "adjectives",
    "Adjectives",
    "Agreement, placement, descriptive adjectives, and comparisons.",
    [
      "adjective agreement",
      "adjective placement",
      "descriptive adjectives",
      "comparative adjectives",
    ],
    [
      "Teach adjective endings through scenario nouns.",
      "Show normal adjective placement after nouns and common exceptions before nouns.",
      "Include one simple comparison with mas ... que.",
    ],
  ),
  section(
    "core-grammar-foundations",
    5,
    "subject-pronouns",
    "Subject Pronouns",
    "Personal pronouns and formal vs. informal speech.",
    ["personal pronouns", "formal speech", "informal speech"],
    [
      "Focus on yo, tu, usted, nosotros/nosotras, ellos/ellas, and ustedes.",
      "Explain when tourists should use usted.",
      "Mention that Spanish often drops subject pronouns when verb endings are clear.",
    ],
  ),
  section(
    "essential-sentence-structure",
    6,
    "present-tense-verbs",
    "Present Tense Verbs",
    "Infinitives and regular -ar, -er, and -ir present tense verbs.",
    ["infinitives", "-ar verbs", "-er verbs", "-ir verbs"],
    [
      "Use common scenario verbs and show infinitive to conjugated forms.",
      "Keep conjugation tables compact.",
      "Include a spoken phrase the user can reuse.",
    ],
  ),
  section(
    "essential-sentence-structure",
    7,
    "irregular-present-tense-verbs",
    "Irregular Present Tense Verbs",
    "Stem-changing verbs and common irregular present-tense verbs.",
    ["stem-changing verbs", "common irregular verbs"],
    [
      "Introduce only high-frequency irregulars relevant to the scenario.",
      "Contrast regular and irregular forms briefly.",
      "Use simple present-tense tourist needs.",
    ],
  ),
  section(
    "essential-sentence-structure",
    8,
    "ser-estar",
    "The Verbs Ser and Estar",
    "Permanent vs. temporary states, identity, condition, and location.",
    ["permanent vs. temporary states", "identity", "condition", "location"],
    [
      "Teach ser for identity/category and estar for condition/location.",
      "Use scenario locations and temporary conditions.",
      "Avoid overexplaining philosophical permanence; keep rules practical.",
    ],
  ),
  section(
    "essential-sentence-structure",
    9,
    "negation-questions",
    "Negation and Questions",
    "Negative sentences, yes/no questions, and question words.",
    ["negative sentences", "yes/no questions", "question words"],
    [
      "Teach no before the verb for negation.",
      "Include question words like que, donde, cuanto, cuando, and como.",
      "Use polite question forms for the selected scenario.",
    ],
  ),
  section(
    "essential-sentence-structure",
    10,
    "basic-sentence-expansion",
    "Basic Sentence Expansion",
    "Conjunctions, word order, and simple transitions.",
    ["conjunctions", "word order", "simple transitions"],
    [
      "Help the learner combine short sentences naturally.",
      "Use y, pero, porque, entonces, and tambien where useful.",
      "Keep word order guidance practical for beginner production.",
    ],
  ),
  section(
    "expanding-grammar",
    11,
    "possessives",
    "Possessives",
    "Possessive adjectives and possessive pronouns.",
    ["possessive adjectives", "possessive pronouns"],
    [
      "Teach mi, tu, su, nuestro/nuestra through scenario items.",
      "Connect agreement to the possessed noun.",
      "Keep possessive pronouns optional and simple.",
    ],
  ),
  section(
    "expanding-grammar",
    12,
    "prepositions",
    "Prepositions",
    "Common prepositions, contractions, direction, and relation.",
    ["common prepositions", "contractions", "direction", "relation"],
    [
      "Use location and movement in the selected scenario.",
      "Include a + el = al and de + el = del.",
      "Prioritize common prepositions like a, de, en, con, para, and por.",
    ],
  ),
  section(
    "expanding-grammar",
    13,
    "object-pronouns",
    "Object Pronouns",
    "Direct objects, indirect objects, and pronoun placement.",
    ["direct objects", "indirect objects", "pronoun placement"],
    [
      "Teach lo/la/los/las and le/les with practical requests.",
      "Explain pronoun placement before conjugated verbs.",
      "Avoid advanced doubling unless needed for clarity.",
    ],
  ),
  section(
    "expanding-grammar",
    14,
    "reflexive-verbs",
    "Reflexive Verbs",
    "Reflexive pronouns and reflexive constructions.",
    ["reflexive pronouns", "reflexive constructions"],
    [
      "Use daily actions or tourist needs that fit the scenario.",
      "Teach me, te, se, nos, and se.",
      "Show the reflexive pronoun before a conjugated verb.",
    ],
  ),
  section(
    "expanding-grammar",
    15,
    "commands",
    "Commands",
    "Informal, formal, and negative commands.",
    ["informal commands", "formal commands", "negative commands"],
    [
      "Prioritize polite/formal commands useful for tourist interactions.",
      "Include negative commands in simple safety or preference examples.",
      "Keep forms limited to common verbs.",
    ],
  ),
  section(
    "verb-tenses",
    16,
    "near-future",
    "The Near Future",
    "ir + a + infinitive.",
    ["ir + a + infinitive"],
    [
      "Teach voy/va/vamos + a + infinitive through plans in the scenario.",
      "Keep future plans concrete and immediate.",
      "Include one question about what the learner is going to do.",
    ],
  ),
  section(
    "verb-tenses",
    17,
    "preterite",
    "The Preterite Tense",
    "Regular preterite forms and common irregulars.",
    ["regular preterite forms", "common irregulars"],
    [
      "Use completed actions from a travel situation.",
      "Include regular -ar and -er/-ir endings in a compact way.",
      "Introduce only a few common irregulars if useful.",
    ],
  ),
  section(
    "verb-tenses",
    18,
    "imperfect",
    "The Imperfect Tense",
    "Habitual actions and descriptions in the past.",
    ["habitual actions", "descriptions in the past"],
    [
      "Contrast ongoing/habitual past with completed actions lightly.",
      "Use scenario memories or descriptions.",
      "Keep production prompts simple.",
    ],
  ),
  section(
    "verb-tenses",
    19,
    "future",
    "The Future Tense",
    "Regular future forms and irregular future stems.",
    ["regular future forms", "irregular future stems"],
    [
      "Use future plans beyond the immediate near future.",
      "Show regular future endings without overwhelming tables.",
      "Mention a few high-frequency irregular stems.",
    ],
  ),
  section(
    "verb-tenses",
    20,
    "conditional",
    "The Conditional Tense",
    "Hypothetical situations and polite expressions.",
    ["hypothetical situations", "polite expressions"],
    [
      "Teach polite requests with me gustaria, podria, and quisiera.",
      "Use hypothetical scenario needs.",
      "Keep conditional forms practical and service-oriented.",
    ],
  ),
  section(
    "intermediate-structures",
    21,
    "progressive-tenses",
    "Progressive Tenses",
    "Present progressive and past progressive.",
    ["present progressive", "past progressive"],
    [
      "Teach estar + gerund through actions happening now.",
      "Use past progressive only after present progressive is clear.",
      "Keep examples tied to visible scenario actions.",
    ],
  ),
  section(
    "intermediate-structures",
    22,
    "perfect-tenses",
    "Perfect Tenses",
    "Present perfect and past perfect.",
    ["present perfect", "past perfect"],
    [
      "Teach haber + past participle through travel experiences.",
      "Emphasize he/ha/hemos forms first.",
      "Use past perfect briefly as an extension.",
    ],
  ),
  section(
    "intermediate-structures",
    23,
    "subjunctive",
    "The Subjunctive Mood",
    "Present subjunctive, common triggers, doubt, and emotion.",
    ["present subjunctive", "common triggers", "doubt", "emotion"],
    [
      "Introduce the subjunctive as expressing uncertainty, desire, or emotion.",
      "Use common triggers like quiero que, espero que, and es posible que.",
      "Keep examples short and avoid advanced exceptions.",
    ],
  ),
  section(
    "intermediate-structures",
    24,
    "relative-pronouns",
    "Relative Pronouns",
    "que, quien, lo que, and relative clauses.",
    ["que", "quien", "lo que", "relative clauses"],
    [
      "Use relative clauses to identify people, places, and things in the scenario.",
      "Prioritize que before quien and lo que.",
      "Keep clauses short and useful.",
    ],
  ),
  section(
    "intermediate-structures",
    25,
    "advanced-sentence-structure",
    "Advanced Sentence Structure",
    "Complex sentences, transitions, and connectors.",
    ["complex sentences", "transitions", "connectors"],
    [
      "Help the learner combine clauses using natural connectors.",
      "Use aunque, sin embargo, por eso, ademas, and mientras where appropriate.",
      "Keep production focused on clear, useful travel speech.",
    ],
  ),
];

export function getCurriculumSection(id: string | null | undefined) {
  return CURRICULUM_SECTIONS.find((sectionItem) => sectionItem.id === id) ?? null;
}

export function getFirstCurriculumSection() {
  return CURRICULUM_SECTIONS[0];
}

export function getNextCurriculumSection(completedIds: Set<string>) {
  return (
    CURRICULUM_SECTIONS.find((sectionItem) => !completedIds.has(sectionItem.id)) ??
    CURRICULUM_SECTIONS[CURRICULUM_SECTIONS.length - 1]
  );
}

export function getCurriculumIndex(id: string | null | undefined) {
  const index = CURRICULUM_SECTIONS.findIndex((sectionItem) => sectionItem.id === id);
  return index < 0 ? 0 : index;
}
