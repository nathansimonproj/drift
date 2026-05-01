const TYPES = {
  caffeine: {
    label: "Caffeine",
    unit: "mg",
    defaultAmount: 95,
    amountKind: "number",
    quickLabel: "Coffee",
    quickMeta: "95 mg",
  },
  alcohol: {
    label: "Alcohol",
    unit: "drinks",
    defaultAmount: 1,
    amountKind: "number",
    quickLabel: "Drink",
    quickMeta: "1 std",
  },
  workout: {
    label: "Workout",
    unit: "intensity",
    defaultAmount: "medium",
    amountKind: "intensity",
    quickLabel: "Workout",
    quickMeta: "medium",
  },
  meal: {
    label: "Meal",
    unit: "size",
    defaultAmount: "medium",
    amountKind: "size",
    quickLabel: "Meal",
    quickMeta: "medium",
  },
  nicotine: {
    label: "Nicotine",
    unit: "mg",
    defaultAmount: 6,
    amountKind: "number",
    quickLabel: "Nicotine",
    quickMeta: "6 mg",
  },
  stress: {
    label: "Stressor",
    unit: "level",
    defaultAmount: "medium",
    amountKind: "intensity",
    quickLabel: "Stress",
    quickMeta: "medium",
  },
  brightlight: {
    label: "Bright light",
    unit: "min",
    defaultAmount: 30,
    amountKind: "number",
    quickLabel: "Bright light",
    quickMeta: "30 min",
  },
  screen: {
    label: "Screen time",
    unit: "min",
    defaultAmount: 60,
    amountKind: "number",
    quickLabel: "Screen",
    quickMeta: "60 min",
  },
};

const INTENSITY_OPTS = ["low", "medium", "high"];
const SIZE_OPTS = ["light", "medium", "heavy"];
