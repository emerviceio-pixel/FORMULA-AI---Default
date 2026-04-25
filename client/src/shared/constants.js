// client/src/constants.js
export const VALID_HEALTH_CONDITIONS = new Set([
  // --- Metabolic & Endocrine Disorders (Strongly linked to diet) ---
  'Type 2 Diabetes',
  'Diabetes',
  'Prediabetes',
  'Gestational Diabetes',
  'Metabolic Syndrome',
  'Obesity',
  'Overweight',
  'Gout',
  'Non-Alcoholic Fatty Liver Disease',
  'NAFLD',
  'Insulin Resistance',
  'High Cholesterol',
  'Hyperlipidemia',
  'Hypothyroidism',
  'PCOS',
  'Polycystic Ovary Syndrome',

  // --- Cardiovascular Diseases (Strongly linked to diet) ---
  'High Blood Pressure',
  'Hypertension',
  'Coronary Artery Disease',
  'Heart Disease',
  'Atherosclerosis',
  'Heart Failure',
  'Angina',
  'History of Heart Attack',
  'History of Stroke',
  'Peripheral Artery Disease',
  'Atrial Fibrillation',
  'Arrhythmia',

  // --- Gastrointestinal & Liver Diseases (Diet-related) ---
  'GERD',
  'Acid Reflux',
  'Heartburn',
  'Peptic Ulcer Disease',
  'Stomach Ulcer',
  'Irritable Bowel Syndrome',
  'IBS',
  'Diverticulitis',
  'Gallstones',
  'Chronic Pancreatitis',
  'Crohn\'s Disease',
  'Ulcerative Colitis',
  'Celiac Disease',
  'Cirrhosis',

  // --- Kidney Diseases (Diet-related) ---
  'Chronic Kidney Disease',
  'CKD',
  'Kidney Stones',
  'Nephritis',

  // --- Bone & Joint Diseases (Linked to diet/inflammation) ---
  'Osteoporosis',
  'Osteopenia',
  'Osteoarthritis',
  'Rheumatoid Arthritis',
  'Gouty Arthritis',
  'Psoriatic Arthritis',

  // --- Respiratory (Linked to obesity from poor diet) ---
  'Sleep Apnea',
  'Asthma',
  'COPD',

  // --- Neurological & Cognitive (Linked to diet/inflammation) ---
  'Migraine',
  'Chronic Headaches',
  'Alzheimer\'s Disease',
  'Dementia',
  'Cognitive Decline',
  'Parkinson\'s Disease',
  'Peripheral Neuropathy',
  'Neuropathy',

  // --- Mental Health (Linked to diet/gut health) ---
  'Depression',
  'Anxiety Disorder',
  'Panic Disorder',
  'Bipolar Disorder',
  'Eating Disorder',
  'Insomnia',

  // --- Cancers (Diet-related) ---
  'Colorectal Cancer',
  'Colon Cancer',
  'Breast Cancer',
  'Liver Cancer',
  'Pancreatic Cancer',
  'Stomach Cancer',

  // --- Other Diet-Related Chronic Conditions ---
  'Chronic Inflammation',
  'Systemic Inflammation',
  'Chronic Fatigue Syndrome',
  'Iron Deficiency Anemia',
  'Anemia',
  'Benign Prostatic Hyperplasia',
]);


export const VALID_ALLERGIES = new Set([
  // --- Major Global Allergens (Most Common) ---
  'Peanuts (Groundnuts)',
  'Tree Nuts',
  'Walnuts',
  'Almonds',
  'Cashews',
  'Pecans',
  'Pistachios',
  'Hazelnuts',
  'Milk',
  'Dairy',
  'Lactose Intolerance',
  'Eggs',
  'Fish',
  'Shellfish',
  'Shrimp',
  'Crab',
  'Lobster',
  'Soy',
  'Soybeans',
  'Wheat',
  'Gluten',
  'Sesame Seeds',

  // --- Grains & Cereals ---
  'Corn',
  'Maize',
  'Rice',
  'Oats',
  'Barley',
  'Rye',
  'Quinoa',
  'Sorghum',
  'Millet',

  // --- Legumes & Beans ---
  'Cowpeas',
  'Black-Eyed Peas',
  'Brown Beans',
  'Lentils',
  'Chickpeas',
  'Soybeans',
  'Green Peas',
  'Bambara Groundnuts',
  'Locust Beans',
  'Dawadawa',
  'Iru',

  // --- Vegetables ---
  'Tomatoes',
  'Onions',
  'Garlic',
  'Ginger',
  'Peppers',
  'Chili Peppers',
  'Bell Peppers',
  'Okra',
  'Eggplant',
  'Garden Eggs',
  'Spinach',
  'Celery',
  'Carrots',
  'Potatoes',
  'Sweet Potatoes',
  'Mushrooms',
  'Avocado',

  // --- Fruits ---
  'Mangoes',
  'Pineapple',
  'Bananas',
  'Citrus Fruits',
  'Oranges',
  'Lemons',
  'Limes',
  'Grapefruit',
  'Papaya',
  'Pawpaw',
  'Watermelon',
  'Strawberries',
  'Apples',
  'Pears',
  'Peaches',
  'Plums',
  'Kiwis',
  'Coconut',
  'Grapes',
  'Raisins',
  'Dates',

  // --- Tropical & Local Fruits ---
  'Tamarind',
  'Baobab',
  'Jackfruit',
  'Durian',
  'Lychee',

  // --- Spices & Condiments ---
  'Mustard',
  'Curry Powder',
  'Thyme',
  'Oregano',
  'Basil',
  'Cilantro',
  'Coriander',
  'Nutmeg',
  'Cloves',
  'Cinnamon',
  'Black Pepper',
  'White Pepper',
  'Paprika',
  'Vanilla',

  // --- Processed Food Additives (Common triggers) ---
  'MSG',
  'Monosodium Glutamate',
  'Food Dyes',
  'Food Coloring',
  'Preservatives',
  'Sulfites',
  'Benzoates',
  'Nitrates',
  'Nitrites',
  'Artificial Sweeteners',
  'Aspartame',
  'Sucralose',
  'Saccharin',
  'Stevia',

  // --- Sauces & Condiments ---
  'Shito',
  'Black Pepper Sauce',
  'Soy Sauce',
  'Worcestershire Sauce',
  'Ketchup',
  'Mayonnaise',
  'Vinegar',
  'Fish Sauce',
  'Oyster Sauce',

  // --- Proteins & Meats ---
  'Red Meat',
  'Beef',
  'Pork',
  'Lamb',
  'Goat Meat',
  'Chicken',
  'Turkey',
  'Duck',
  'Snails',
  'Bushmeat',

  // --- Beverages & Stimulants ---
  'Alcohol',
  'Caffeine',
  'Coffee',
  'Tea',
  'Chocolate',
  'Cocoa',

  // --- Other Common Allergens ---
  'Honey',
  'Yeast',
  'Gelatin',
  'Coconut Oil',
  'Palm Oil',
  'Seed Oils',
  'Latex',

  // --- Intolerances & Sensitivities ---
  'Fructose Intolerance',
  'Histamine Intolerance',
  'Salicylate Sensitivity',
  'Sulfite Sensitivity',
  'Sugar Sensitivity'
]);

// Helper functions for validation
export const isValidHealthCondition = (condition) => {
  if (typeof condition !== 'string') return false;
  const normalized = condition.trim().toLowerCase();
  return Array.from(VALID_HEALTH_CONDITIONS).some(
    valid => valid.toLowerCase() === normalized
  );
};

export const isValidAllergy = (allergy) => {
  if (typeof allergy !== 'string') return false;
  const normalized = allergy.trim().toLowerCase();
  return Array.from(VALID_ALLERGIES).some(
    valid => valid.toLowerCase() === normalized
  );
};

// For autocomplete/suggestions
export const HEALTH_CONDITIONS_LIST = Array.from(VALID_HEALTH_CONDITIONS).sort();
export const ALLERGIES_LIST = Array.from(VALID_ALLERGIES).sort();

// Get suggestions based on user input
export const getHealthConditionSuggestions = (input) => {
  if (!input || input.length < 2) return [];
  const normalizedInput = input.toLowerCase();
  return HEALTH_CONDITIONS_LIST.filter(condition =>
    condition.toLowerCase().includes(normalizedInput)
  ).slice(0, 10);
};

export const getAllergySuggestions = (input) => {
  if (!input || input.length < 2) return [];
  const normalizedInput = input.toLowerCase();
  return ALLERGIES_LIST.filter(allergy =>
    allergy.toLowerCase().includes(normalizedInput)
  ).slice(0, 10);
};