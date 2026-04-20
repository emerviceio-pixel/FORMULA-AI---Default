const VALID_HEALTH_CONDITIONS = new Set([
  // --- Metabolic & Endocrine Disorders ---
  'Diabetes Type 1',
  'Diabetes Type 2',
  'Prediabetes',
  'Gestational Diabetes',
  'Hypothyroidism',
  'Hyperthyroidism',
  'Hashimoto\'s Disease',
  'Graves\' Disease',
  'Cushing\'s Syndrome',
  'Addison\'s Disease',
  'Polycystic Ovary Syndrome (PCOS)',
  'Metabolic Syndrome',
  'Obesity',
  'Gout',

  // --- Bone & Joint Health ---
  'Osteoporosis',
  'Osteopenia',
  'Rheumatoid Arthritis',
  'Osteoarthritis',
  'Ankylosing Spondylitis',
  'Lupus (SLE)',
  'Psoriasis',
  'Psoriatic Arthritis',
  'Fibromyalgia',
  'Sjögren\'s Syndrome',

  // --- Cardiovascular Conditions ---
  'Hypertension (High Blood Pressure)',
  'High Cholesterol',
  'Hyperlipidemia',
  'Coronary Artery Disease',
  'Heart Failure',
  'Atrial Fibrillation',
  'Arrhythmia',
  'Peripheral Artery Disease',
  'Atherosclerosis',
  'Angina',
  'History of Heart Attack',
  'History of Stroke',
  'TIA (Transient Ischemic Attack)',

  // --- Respiratory Conditions (Chronic) ---
  'Asthma',
  'COPD (Chronic Obstructive Pulmonary Disease)',
  'Chronic Bronchitis',
  'Emphysema',
  'Pulmonary Fibrosis',
  'Sleep Apnea',
  'Cystic Fibrosis', // Genetic/Chronic

  // --- Gastrointestinal & Liver (Chronic/Functional) ---
  'GERD (Gastroesophageal Reflux Disease)',
  'Peptic Ulcer Disease',
  'Crohn\'s Disease',
  'Ulcerative Colitis',
  'Irritable Bowel Syndrome (IBS)',
  'Celiac Disease',
  'Diverticulitis',
  'Non-Alcoholic Fatty Liver Disease (NAFLD)',
  'Cirrhosis',
  'Chronic Pancreatitis',
  'Gallstones',
  'Helicobacter Pylori Infection', // Often chronic if untreated, linked to ulcers/cancer risk

  // --- Neurological Conditions ---
  'Migraine',
  'Chronic Headaches',
  'Epilepsy',
  'Multiple Sclerosis',
  'Parkinson\'s Disease',
  'Alzheimer\'s Disease',
  'Dementia',
  'Neuropathy (Peripheral)',
  'Trigeminal Neuralgia',
  'Restless Leg Syndrome',

  // --- Mental Health Conditions ---
  'Depression',
  'Anxiety Disorder',
  'Panic Disorder',
  'Bipolar Disorder',
  'PTSD (Post-Traumatic Stress Disorder)',
  'OCD (Obsessive-Compulsive Disorder)',
  'ADHD (Attention Deficit Hyperactivity Disorder)',
  'Eating Disorder',
  'Insomnia',
  'Substance Use Disorder',

  // --- Musculoskeletal & Pain Management ---
  'Chronic Back Pain',
  'Herniated Disc',
  'Sciatica',
  'Carpal Tunnel Syndrome',
  'Tendonitis',
  'Bursitis',
  'Scoliosis',
  'Chronic Fatigue Syndrome',

  // --- Kidney & Urinary Health ---
  'Chronic Kidney Disease (CKD)',
  'Kidney Stones',
  'Nephritis',

  // --- Reproductive Health (Chronic/Structural) ---
  'Endometriosis',
  'Uterine Fibroids',
  'Erectile Dysfunction',
  'Chronic Prostatitis',
  'Benign Prostatic Hyperplasia (Enlarged Prostate)',

  // --- Blood & Immune Disorders ---
  'Anemia',
  'Iron Deficiency Anemia',
  'Sickle Cell Disease', // Genetic/Chronic
  'Hemophilia', // Genetic
  'Thalassemia', // Genetic
  'Reynaud\'s Phenomenon',
  'Sarcoidosis',

  // --- Sensory & Other Chronic Conditions ---
  'Tinnitus',
  'Vertigo',
  'Meniere\'s Disease',
  'Autism Spectrum Disorder',
  'Down Syndrome'
]);

const VALID_ALLERGIES = new Set([
  // --- Major Global Allergens (The "Big 9") ---
  'Peanuts (Groundnuts)',
  'Tree Nuts',
  'Walnuts',
  'Almonds',
  'Cashews',
  'Pecans',
  'Pistachios',
  'Hazelnuts',
  'Milk',
  'Dairy (Lactose Intolerance)',
  'Eggs',
  'Fish',
  'Shellfish',
  'Soy',
  'Wheat',
  'Gluten',
  'Sesame Seeds',

  // --- Common African Staples & Grains ---
  'Corn (Maize)',
  'Cassava',
  'Yam',
  'Plantain',
  'Rice',
  'Sorghum',
  'Millet',
  'Guinea Corn',
  'Oats',
  'Barley',
  'Rye',

  // --- Legumes & Beans (Common in West Africa) ---
  'Cowpeas (Black-Eyed Peas)',
  'Brown Beans',
  'Lentils',
  'Chickpeas',
  'Soya Beans',
  'Bambara Groundnuts',
  'Locust Beans (Dawadawa/Iru)',

  // --- Vegetables & Leafy Greens ---
  'Tomatoes',
  'Onions',
  'Garlic',
  'Ginger',
  'Peppers (Chili/Bell Pepper)',
  'Okra',
  'Garden Eggs (African Eggplant)',
  'Spinach',
  'Kontomire (Cocoyam Leaves)',
  'Celery',
  'Carrots',
  'Potatoes (Sweet & Irish)',
  'Mushrooms',

  // --- Fruits (Tropical & Local) ---
  'Mangoes',
  'Pineapple',
  'Bananas',
  'Avocado',
  'Citrus Fruits',
  'Oranges',
  'Lemons',
  'Limes',
  'Grapefruit',
  'Papaya (Pawpaw)',
  'Watermelon',
  'Strawberries',
  'Apples',
  'Peaches',
  'Kiwis',
  'Coconut',
  'Tamarind',
  'Baobab',

  // --- Spices, Herbs & Condiments ---
  'Shito (Black Pepper Sauce)',
  'Curry Powder',
  'Thyme',
  'Nutmeg',
  'Cloves',
  'Cinnamon',
  'Mustard',
  'Vinegar',
  'MSG (Monosodium Glutamate)',
  'Food Dyes',
  'Preservatives',
  'Sulfites',
  'Artificial Sweeteners',

  // --- Other Sensitivities & Intolerances ---
  'Sugar',
  'Salt',
  'Alcohol',
  'Caffeine',
  'Chocolate',
  'Red Meat',
  'Pork',
  'Chicken',
  'Beef',
  'Goat Meat',
  'Snails',
  'Bushmeat',
  'Latex (Cross-reactivity with some fruits)',
  'Histamine'
]);

// Convert Sets to arrays for API responses
const HEALTH_CONDITIONS_ARRAY = Array.from(VALID_HEALTH_CONDITIONS).sort();
const ALLERGIES_ARRAY = Array.from(VALID_ALLERGIES).sort();

// Validation function
function validateHealthData(conditions = [], allergies = []) {
  const invalidConditions = [];
  const invalidAllergies = [];
  
  // Ensure inputs are arrays
  const conditionsArray = Array.isArray(conditions) ? conditions : [];
  const allergiesArray = Array.isArray(allergies) ? allergies : [];
  
  // Validate each condition (case-insensitive)
  for (const condition of conditionsArray) {
    if (typeof condition !== 'string') {
      invalidConditions.push(condition);
      continue;
    }
    
    // Find matching condition (case-insensitive)
    const normalizedCondition = condition.trim();
    const isValid = Array.from(VALID_HEALTH_CONDITIONS).some(
      valid => valid.toLowerCase() === normalizedCondition.toLowerCase()
    );
    
    if (!isValid) {
      invalidConditions.push(condition);
    }
  }
  
  // Validate each allergy (case-insensitive)
  for (const allergy of allergiesArray) {
    if (typeof allergy !== 'string') {
      invalidAllergies.push(allergy);
      continue;
    }
    
    const normalizedAllergy = allergy.trim();
    const isValid = Array.from(VALID_ALLERGIES).some(
      valid => valid.toLowerCase() === normalizedAllergy.toLowerCase()
    );
    
    if (!isValid) {
      invalidAllergies.push(allergy);
    }
  }
  
  return {
    isValid: invalidConditions.length === 0 && invalidAllergies.length === 0,
    invalidConditions,
    invalidAllergies
  };
}

module.exports = {
  VALID_HEALTH_CONDITIONS,
  VALID_ALLERGIES,
  HEALTH_CONDITIONS_ARRAY,
  ALLERGIES_ARRAY,
  validateHealthData
};