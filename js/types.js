const TYPES = {
  coffee: {
    label: "Coffee",
    unit: "mg",
    defaultAmount: 135,
    amountKind: "number",
    quickLabel: "Coffee (12oz)",
    quickMeta: "135 mg",
  },
  energy_drink: {
    label: "Energy Drink",
    unit: "mg",
    defaultAmount: "celsius",
    amountKind: "variant",
    options: [
      { value: "red_bull", label: "Red Bull", mg: 80 },
      { value: "celsius", label: "Celsius", mg: 200 },
      { value: "monster", label: "Monster Energy", mg: 160 },
      { value: "alani_nu", label: "Alani Nu", mg: 200 },
      { value: "rockstar", label: "Rockstar Energy", mg: 160 },
      { value: "bang", label: "Bang Energy", mg: 300 },
      { value: "reign", label: "Reign Total Body Fuel", mg: 300 },
      { value: "ghost", label: "Ghost Energy", mg: 200 },
      { value: "nos", label: "NOS", mg: 160 },
      { value: "bloom", label: "Bloom Nutrition", mg: 150 },
      { value: "bum", label: "Bum Energy", mg: 112}
    ],
    quickLabel: "Energy Drink",
    quickMeta: "Varies",
  },
  soda: {
    label: "Soda",
    unit: "mg",
    defaultAmount: "regular",
    amountKind: "variant",
    options: [
      { value: "diet", label: "Diet Coke", mg: 46 },
      { value: "regular", label: "Coca-Cola", mg: 34 },
      { value: "zero", label: "Coke Zero Sugar", mg: 34 },
    ],
    quickLabel: "Soda",
    quickMeta: "Varies",
  },
  marijuana: {
    label: "Marijuana",
    unit: "mg",
    defaultAmount: 10,
    amountKind: "number",
    quickLabel: "Marijuana",
    quickMeta: "10 mg",
  },
  // stimulant: {
  //   label: "Adderall / Vyvanse",
  //   unit: "dose",
  //   defaultAmount: "medium",
  //   amountKind: "intensity",
  //   quickLabel: "Adderall",
  //   quickMeta: "medium dose",
  // },
  alcohol: {
    label: "Alcohol",
    unit: "drinks",
    defaultAmount: "beer",
    amountKind: "variant",
    // NIAAA's standard-drink definition: a 12oz beer (~5% ABV), 5oz wine
    // (~12% ABV), and 1.5oz shot of spirits (~40% ABV) all contain ~14g
    // ethanol — the same amount, just packaged differently. Same curve for
    // all three (see decay.js); this only changes what gets logged.
    options: [
      { value: "beer", label: "Beer (12oz)", amountLabel: "1 standard drink" },
      { value: "wine", label: "Glass of Wine (5oz)", amountLabel: "1 standard drink" },
      { value: "shot", label: "Shot (1.5oz)", amountLabel: "1 standard drink" },
    ],
    quickLabel: "Alcohol",
    quickMeta: "Varies",
  },
  // nap: {
  //   label: "Nap",
  //   unit: "min",
  //   defaultAmount: 30,
  //   amountKind: "number",
  //   quickLabel: "Nap",
  //   quickMeta: "30 min",
  // },
  nicotine: {
    label: "Nicotine",
    unit: "mg",
    defaultAmount: "pouch_6",
    amountKind: "variant",
    amountLabel: "Product", // these are delivery methods, not brands
    // mg = absorbed dose, not labeled/total content. Cigarette and vape are
    // both fast-onset, low-per-use doses; pouches deliver more but more
    // gradually via oral mucosa. Sourced from nicotine PK literature — see
    // decay.js for citations.
    options: [
      { value: "cigarette", label: "Cigarette", mg: 1.2 },
      { value: "vape", label: "Vape (session)", mg: 1.3 },
      { value: "pouch_3", label: "Nicotine Pouch (3mg)", mg: 3 },
      { value: "pouch_6", label: "Nicotine Pouch (6mg)", mg: 6 },
    ],
    quickLabel: "Nicotine",
    quickMeta: "Varies",
  },
  // caffeine: {
  //   label: "Caffeine",
  //   unit: "mg",
  //   defaultAmount: 100,
  //   amountKind: "number",
  //   quickLabel: "Caffeine",
  //   quickMeta: "100 mg",
  // },
  // workout: {
  //   label: "Workout",
  //   unit: "intensity",
  //   defaultAmount: "medium",
  //   amountKind: "intensity",
  //   quickLabel: "Workout",
  //   quickMeta: "medium",
  // },
  // meal: {
  //   label: "Meal",
  //   unit: "size",
  //   defaultAmount: "medium",
  //   amountKind: "size",
  //   quickLabel: "Meal",
  //   quickMeta: "medium",
  // },
  // stress: {
  //   label: "Stressor",
  //   unit: "level",
  //   defaultAmount: "medium",
  //   amountKind: "intensity",
  //   quickLabel: "Stress",
  //   quickMeta: "medium",
  // },
  // brightlight: {
  //   label: "Bright light",
  //   unit: "min",
  //   defaultAmount: 30,
  //   amountKind: "number",
  //   quickLabel: "Bright light",
  //   quickMeta: "30 min",
  // },
  // screen: {
  //   label: "Screen time",
  //   unit: "min",
  //   defaultAmount: 60,
  //   amountKind: "number",
  //   quickLabel: "Screen",
  //   quickMeta: "60 min",
  // },
};

const INTENSITY_OPTS = ["low", "medium", "high"];
const SIZE_OPTS = ["light", "medium", "heavy"];

// Browser usage (plain <script> globals) is untouched — `module` is only
// defined under Node/CommonJS, i.e. when required from the test suite.
if (typeof module !== "undefined") {
  module.exports = { TYPES, INTENSITY_OPTS, SIZE_OPTS };
}
