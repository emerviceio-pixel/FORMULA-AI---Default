// client/src/pages/Profile/ProfileSetup.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { apiFetch } from '../../services/api';
import ReactCountryFlag from "react-country-flag";
import Select from "react-select";
import { getData } from 'country-list';

import {
  User,
  Calendar,
  Globe,
  Ruler,
  Weight,
  Target,
  Activity,
  Lock,
  Shield,
  Eye,
  EyeOff,
  Plus,
  X,
  Key,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Dumbbell,
  Check,
  Heart,
  ChevronRight,
  Info,
  Loader
} from 'lucide-react';

import { 
  FiHeart,           
  FiTrendingDown,    
  FiTrendingUp,      
  FiMinimize2       
} from 'react-icons/fi';

// Custom Dropdown Component
const CustomDropdown = ({ 
  isOpen, 
  onToggle, 
  selected, 
  items, 
  onSelect, 
  placeholder,
  icon: Icon,
  type 
}) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onToggle(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onToggle]);

  const selectedItem = items.find(item => item.id === selected);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => onToggle(!isOpen)}
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-900/50 border-0 sm:border sm:border-gray-800 rounded-none sm:rounded-lg hover:border-gray-700 focus:border-primary-500/30 focus:outline-none transition-all text-left flex items-center justify-between group"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />}
          <div>
            {selectedItem ? (
              <>
                <span className="text-white text-xs sm:text-sm block">{selectedItem.label}</span>
                {type === 'activity' && (
                  <span className="text-[10px] sm:text-xs text-gray-500">{selectedItem.description}</span>
                )}
              </>
            ) : (
              <span className="text-gray-500 text-xs sm:text-sm">{placeholder}</span>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 group-hover:text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-gray-900 border-0 sm:border sm:border-gray-800 rounded-none sm:rounded-lg shadow-xl overflow-hidden"
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item.id);
                  onToggle(false);
                }}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-800 transition-colors text-left flex items-center gap-2 sm:gap-3 border-b border-gray-800 last:border-0 group"
              >
                {item.icon && (
                  <div className="flex-shrink-0">
                    {item.icon}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs sm:text-sm font-medium">{item.label}</span>
                    {selected === item.id && (
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary-400" />
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{item.description}</p>
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// BMI Indicator Component
const BMIIndicator = ({ bmi }) => {
  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-400', bgColor: 'bg-blue-400', range: '0-18.4' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-400', bgColor: 'bg-green-400', range: '18.5-24.9' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-400', bgColor: 'bg-yellow-400', range: '25-29.9' };
    if (bmi < 35) return { category: 'Obese Class I', color: 'text-orange-400', bgColor: 'bg-orange-400', range: '30-34.9' };
    if (bmi < 40) return { category: 'Obese Class II', color: 'text-red-400', bgColor: 'bg-red-400', range: '35-39.9' };
    return { category: 'Obese Class III', color: 'text-red-600', bgColor: 'bg-red-600', range: '40+' };
  };

  const calculateRotation = (bmi) => {
    // Map BMI range (10-50) to rotation (-90deg to 90deg)
    const clampedBMI = Math.min(Math.max(bmi, 10), 50);
    return ((clampedBMI - 10) / 40) * 180 - 90;
  };

  if (!bmi) return null;

  const category = getBMICategory(bmi);
  const rotation = calculateRotation(bmi);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-32 h-32 mx-auto mb-4"
    >
      {/* Circular background */}
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#1f2937"
          strokeWidth="10"
        />
        
        {/* Colored segments */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="10"
          strokeDasharray="70.7 282.8"
          strokeDashoffset="-17.7"
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="opacity-30"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#4ade80"
          strokeWidth="10"
          strokeDasharray="70.7 282.8"
          strokeDashoffset="53"
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="opacity-30"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="10"
          strokeDasharray="70.7 282.8"
          strokeDashoffset="123.7"
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="opacity-30"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#f97316"
          strokeWidth="10"
          strokeDasharray="70.7 282.8"
          strokeDashoffset="194.4"
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="opacity-30"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#ef4444"
          strokeWidth="10"
          strokeDasharray="70.7 282.8"
          strokeDashoffset="265.1"
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="opacity-30"
        />
      </svg>

      {/* BMI Value and Category */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          key={bmi}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-xl font-bold text-white "
        >
          {bmi.toFixed(1)}
        </motion.span>
        <span className={`text-xs font-medium ${category.color}`}>
          {category.category}
        </span>
      </div>

      {/* Range indicators */}
      <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] text-gray-600">
        <span>18.5</span>
        <span>25</span>
        <span>30</span>
        <span>35</span>
        <span>40</span>
      </div>
    </motion.div>
  );
};

const ProfileSetup = ({ editMode = false }) => {
  const navigate = useNavigate();
  const { updateProfile, profile, isLoading } = useAuth();
  const { showSuccess, showError } = useToast();
  const countryOptions = getData().map(country => ({
    value: country.code,
    label: country.name
  }));

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // States
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [healthKey, setHealthKey] = useState('');
  const [showHealthKey, setShowHealthKey] = useState(false);
  const [confirmHealthKey, setConfirmHealthKey] = useState('');
  const [showConfirmHealthKey, setShowConfirmHealthKey] = useState(false);
  const [hasHealthKey, setHasHealthKey] = useState(false);
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedConditions, setDecryptedConditions] = useState([]);
  const [decryptedAllergies, setDecryptedAllergies] = useState([]);
  
  // Dropdown states
  const [showDietaryGoal, setShowDietaryGoal] = useState(false);
  const [showActivityLevel, setShowActivityLevel] = useState(false);

  // BMI state
  const [bmi, setBmi] = useState(null);

    // Form state
  const [formData, setFormData] = useState({
    nickname: '',
    dateOfBirth: '',
    country: '',
    height: { value: '', unit: 'cm' },
    weight: { value: '', unit: 'kg' },
    dietaryGoal: 'healthy',
    activityLevel: 'moderate',
    healthConditions: [],
    allergies: []
  });

  useEffect(() => {
    if (!formData.country) {
      fetch("https://ipapi.co/json/")
        .then(res => res.json())
        .then(data => {
          if (data?.country_code) {
            handleInputChange("country", data.country_code);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Calculate BMI when height or weight changes
  useEffect(() => {
    const height = parseFloat(formData.height.value);
    const weight = parseFloat(formData.weight.value);
    
    if (height && weight && height > 0 && weight > 0) {
      // Height is in cm, convert to meters
      const heightInMeters = height / 100;
      // Weight is in kg
      
      // Ensure we have valid numbers before calculating
      if (!isNaN(heightInMeters) && !isNaN(weight) && heightInMeters > 0 && weight > 0) {
        const bmiValue = weight / (heightInMeters * heightInMeters);
        // Check if BMI is reasonable (between 10 and 60)
        if (bmiValue > 10 && bmiValue < 60) {
          setBmi(parseFloat(bmiValue.toFixed(1)));
        } else {
          setBmi(null);
        }
      } else {
        setBmi(null);
      }
    } else {
      setBmi(null);
    }
  }, [formData.height.value, formData.weight.value]); 

  const formatOptionLabel = ({ value, label }) => (
    <div className="flex items-center gap-2">
      <ReactCountryFlag
        svg
        countryCode={value}
        style={{ width: "1.25em", height: "1.25em" }}
      />
      <span>{label}</span>
    </div>
  );

  const activityLevels = [
    { id: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
    { id: 'light', label: 'Light', description: 'Light exercise 1-3 days/week'},
    { id: 'moderate', label: 'Moderate', description: 'Moderate exercise 3-5 days/week'},
    { id: 'active', label: 'Active', description: 'Hard exercise 6-7 days/week'},
    { id: 'very_active', label: 'Very Active', description: 'Very hard exercise & physical job'}
  ];

  const dietaryGoals = [
    { 
      id: 'healthy', 
      label: 'Healthy Lifestyle', 
      description: 'Focus on overall wellness and balanced nutrition',
      icon: <FiHeart className="w-5 h-5 text-primary-400" /> 
    },
    { 
      id: 'lose', 
      label: 'Lose Weight', 
      description: 'Calorie-controlled plan for weight loss',
      icon: <FiTrendingDown className="w-5 h-5 text-primary-400" /> 
    },
    { 
      id: 'gain', 
      label: 'Gain Weight', 
      description: 'Nutrient-dense foods for healthy weight gain',
      icon: <FiTrendingUp className="w-5 h-5 text-primary-400" /> 
    },
    { 
      id: 'muscle', 
      label: 'Build Muscle', 
      description: 'Protein-rich meals for muscle growth',
      icon: <Dumbbell className="w-5 h-5 text-primary-400" /> 
    },
    { 
      id: 'maintain', 
      label: 'Maintain Weight', 
      description: 'Balanced meals to maintain current weight',
      icon: <FiMinimize2 className="w-5 h-5 text-primary-400" /> 
    }
  ];

  const predefinedConditions = [
    'Diabetes', 'Hypertension', 'Heart Disease', 'Cholesterol', 'Typhoid Fever',
    'Cholera', 'Stomach Ulcer', 'Liver Disease', 'Dysentary Disorders', 'Gastrointestinal Issues', 'Kidney Disease', 'Thyroid Disorders'
  ];

  const predefinedAllergies = [
    'Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Sugar', 'Shellfish'
  ];

  // Check if user already has health key
  useEffect(() => {
    if (editMode && profile) {
      setFormData({
        nickname: profile.nickname || '',
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
        country: profile.country || '',
        height: { 
          value: profile.height?.value || '', 
          unit: 'cm' // Force to cm
        },
        weight: { 
          value: profile.weight?.value || '', 
          unit: 'kg' // Force to kg
        },
        dietaryGoal: profile.dietaryGoal || 'healthy',
        activityLevel: profile.activityLevel || 'moderate',
        healthConditions: Array.isArray(profile.healthConditions) ? profile.healthConditions : [],
        allergies: Array.isArray(profile.allergies) ? profile.allergies : []
      });
    }
    if (profile?.hasHealthKey) {
      setHasHealthKey(true);
    }
  }, [editMode, profile]);

  // Create health key (for new users)
  const handleCreateHealthKey = async () => {
    if (healthKey.length < 8) {
      showError('Health key must be at least 8 characters');
      return;
    }
    if (healthKey !== confirmHealthKey) {
      showError('Health keys do not match');
      return;
    }
    try {
      const result = await updateProfile({
        ...formData,
        healthDataKey: healthKey,
        hasHealthKey: true
      });
      if (result.success) {
        setHasHealthKey(true);
        setShowKeyModal(false);
        setHealthKey('');
        setConfirmHealthKey('');
        showSuccess('Health key created successfully');
      }
    } catch (error) {
      showError('Failed to create health key');
    }
  };

  // Decrypt health data (for existing users)
  const handleDecryptHealthData = async () => {
    if (!healthKey.trim()) {
      showError('Please enter your health key');
      return;
    }
    setIsDecrypting(true);
    try {
      const [conditionsRes, allergiesRes] = await Promise.all([
        apiFetch(`/profile/health-conditions?key=${encodeURIComponent(healthKey)}`),
        apiFetch(`/profile/allergies?key=${encodeURIComponent(healthKey)}`)
      ]);
      const conditionsData = conditionsRes;
      const allergiesData = allergiesRes;
      
      if (conditionsData.success) {
        setDecryptedConditions(Array.isArray(conditionsData.conditions) ? conditionsData.conditions : []);
        setFormData(prev => ({ 
          ...prev, 
          healthConditions: Array.isArray(conditionsData.conditions) ? conditionsData.conditions : [] 
        }));
      }
      if (allergiesData.success) {
        setDecryptedAllergies(Array.isArray(allergiesData.allergies) ? allergiesData.allergies : []);
        setFormData(prev => ({ 
          ...prev, 
          allergies: Array.isArray(allergiesData.allergies) ? allergiesData.allergies : [] 
        }));
      }
      if (conditionsData.success || allergiesData.success) {
        setIsDecrypted(true);
        showSuccess('Health data decrypted!');
      } else {
        showError('Invalid health key');
      }
    } catch (error) {
      showError('Failed to decrypt health data');
    } finally {
      setIsDecrypting(false);
    }
  };

  // Handle health condition actions
  const handleHealthCondition = (action, condition) => {
    if (!isDecrypted && !hasHealthKey) {
      showError('Please create or enter health key first');
      return;
    }
    setFormData(prev => {
      const conditions = Array.isArray(prev.healthConditions) ? [...prev.healthConditions] : [];
      if (action === 'add' && !conditions.includes(condition)) {
        conditions.push(condition);
      } else if (action === 'remove') {
        const index = conditions.indexOf(condition);
        if (index > -1) conditions.splice(index, 1);
      }
      return { ...prev, healthConditions: conditions };
    });
    if (isDecrypted) {
      if (action === 'add' && !decryptedConditions.includes(condition)) {
        setDecryptedConditions(prev => [...prev, condition]);
      } else if (action === 'remove') {
        setDecryptedConditions(prev => prev.filter(c => c !== condition));
      }
    }
  };

  // Handle allergy actions
  const handleAllergy = (action, allergy) => {
    if (!isDecrypted && !hasHealthKey) {
      showError('Please create or enter health key first');
      return;
    }
    setFormData(prev => {
      const allergies = Array.isArray(prev.allergies) ? [...prev.allergies] : [];
      if (action === 'add' && !allergies.includes(allergy)) {
        allergies.push(allergy);
      } else if (action === 'remove') {
        const index = allergies.indexOf(allergy);
        if (index > -1) allergies.splice(index, 1);
      }
      return { ...prev, allergies };
    });
    if (isDecrypted) {
      if (action === 'add' && !decryptedAllergies.includes(allergy)) {
        setDecryptedAllergies(prev => [...prev, allergy]);
      } else if (action === 'remove') {
        setDecryptedAllergies(prev => prev.filter(a => a !== allergy));
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateAge = (dateString) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateHeight = (value) => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return 'Please enter a valid height';
    if (numValue < 50 || numValue > 300) {
      return 'Height must be between 50cm and 300cm';
    }
    return '';
  };

  const validateWeight = (value) => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return 'Please enter a valid weight';
    if (numValue < 20 || numValue > 300) {
      return 'Weight must be between 20kg and 300kg';
    }
    return '';
  };

  // Add state for validation errors
  const [validationErrors, setValidationErrors] = useState({
    height: '',
    weight: ''
  });

  // Add validation useEffect
  useEffect(() => {
    const heightError = validateHeight(formData.height.value);
    const weightError = validateWeight(formData.weight.value);
    
    setValidationErrors({
      height: heightError,
      weight: weightError
    });
  }, [formData.height.value, formData.weight.value]);

  const validateStep1 = () => {
    if (!formData.nickname.trim()) {
      showError('Please enter your nickname');
      return false;
    }
    if (!formData.dateOfBirth) {
      showError('Please enter your date of birth');
      return false;
    }
    const age = calculateAge(formData.dateOfBirth);
    if (age < 13) {
      showError('You must be at least 13 years old to use this service');
      return false;
    }
    if (age > 120) {
      showError('Please enter a valid date of birth');
      return false;
    }
    if (!formData.country) {
      showError('Please select your country');
      return false;
    }
    if (!formData.height.value || formData.height.value <= 0) {
      showError('Please enter a valid height');
      return false;
    }
    if (!formData.weight.value || formData.weight.value <= 0) {
      showError('Please enter a valid weight');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.dietaryGoal) {
      showError('Please select your dietary goal');
      return false;
    }
    if (!formData.activityLevel) {
      showError('Please select your activity level');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
  };

 const handleSubmit = async (e) => {
    // e may be a MouseEvent (onClick) or FormEvent — guard either way
    if (e?.preventDefault) e.preventDefault();

    if (!validateStep2()) return;

    try {
      const submissionData = {
        ...formData,
        healthConditions: Array.isArray(formData.healthConditions) ? formData.healthConditions : [],
        allergies: Array.isArray(formData.allergies) ? formData.allergies : [],
        healthDataKey: healthKey || undefined,
        hasHealthKey: hasHealthKey || !!healthKey
      };

      await updateProfile(submissionData);
      showSuccess(editMode ? 'Profile updated!' : 'Profile setup complete!');
      navigate('/');
    } catch (error) {
      showError('Failed to save profile');
    }
  };

  const getSafeConditions = () => {
    const conditions = isDecrypted ? decryptedConditions : formData.healthConditions;
    return Array.isArray(conditions) ? conditions : [];
  };

  const getSafeAllergies = () => {
    const allergies = isDecrypted ? decryptedAllergies : formData.allergies;
    return Array.isArray(allergies) ? allergies : [];
  };

  // Step indicators
  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Health & Lifestyle', icon: Heart }
  ];

  return (
    <div className="min-h-screen  bg-gray-900/95 from-gray-950 via-gray-900 to-gray-950">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, gray 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-10"
        >
          <h1 className="text-2xl pt-10 sm:text-3xl font-light text-white mb-2 tracking-tight">
            {editMode ? 'Update Your Profile' : 'Complete Your Profile'}
          </h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            {currentStep === 1
              ? 'Tell us about yourself for personalized recommendations'
              : 'Help us understand your health needs better'
            }
          </p>
        </motion.div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex items-center">
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ 
                      scale: currentStep === step.number ? 1 : 0.9,
                      backgroundColor: currentStep === step.number ? 'rgba(34, 197, 94, 0.1)' : 'rgba(31, 41, 55, 0.5)'
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      currentStep === step.number
                        ? 'border-primary-400 bg-primary-500/10'
                        : currentStep > step.number
                        ? 'border-green-400 bg-green-500/10'
                        : 'border-gray-700'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <step.icon className={`w-5 h-5 ${
                        currentStep === step.number ? 'text-primary-400' : 'text-gray-600'
                      }`} />
                    )}
                  </motion.div>
                  <span className={`ml-2 text-sm hidden sm:block ${
                    currentStep === step.number ? 'text-white' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className={`w-5 h-5 ${
                    currentStep > index + 1 ? 'text-green-400' : 'text-gray-700'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900/30 rounded-none sm:rounded-xl p-4 sm:p-8"
        >
          <form id="profile-form" onSubmit={currentStep === 2 ? handleSubmit : (e) => e.preventDefault()} className="space-y-8">
            {/* Step 1: Personal Information */}
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-5">
                      <Sparkles className="w-4 h-4 text-primary-400" />
                      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Basic Information
                      </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Nickname */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">
                          <User className="w-3.5 h-3.5 inline mr-1" />
                          Nickname
                        </label>
                        <input
                          type="text"
                          value={formData.nickname}
                          onChange={(e) => handleInputChange('nickname', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-lg focus:border-primary-500/30 focus:outline-none text-white text-sm transition-colors"
                          placeholder="How should we call you?"
                          maxLength={30}
                        />
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">
                          <Calendar className="w-3.5 h-3.5 inline mr-1" />
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-lg focus:border-primary-500/30 focus:outline-none text-white text-sm transition-colors"
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>

                      {/* Country */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">
                          <Globe className="w-3.5 h-3.5 inline mr-1" />
                          Country
                        </label>
                        <Select
                          options={countryOptions}
                          value={countryOptions.find(
                            (c) => c.value === formData.country
                          )}
                          onChange={(selected) =>
                            handleInputChange("country", selected.value)
                          }
                          formatOptionLabel={formatOptionLabel}
                          placeholder="Select your country"
                          isSearchable
                          className="text-sm"
                          styles={{
                            control: (base) => ({
                              ...base,
                              backgroundColor: "rgba(17,24,39,0.5)",
                              borderColor: "#1f2937",
                              color: "white",
                            }),
                            singleValue: (base) => ({ ...base, color: "white" }),
                            menu: (base) => ({
                              ...base,
                              backgroundColor: "#111827",
                            }),
                            option: (base, state) => ({
                              ...base,
                              backgroundColor: state.isFocused
                                ? "#1f2937"
                                : "#111827",
                              color: "white",
                            }),
                          }}
                        />
                      </div>

                      {/* Height (cm only) */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">
                          <Ruler className="w-3.5 h-3.5 inline mr-1" />
                          Height (cm)
                        </label>
                        <input
                          type="number"
                          value={formData.height.value}
                          onChange={(e) => handleInputChange('height', {
                            ...formData.height,
                            value: e.target.value,
                            unit: 'cm' // Ensure unit stays cm
                          })}
                          className={`w-full px-4 py-3 bg-gray-900/50 border rounded-lg focus:outline-none text-white text-sm transition-colors ${
                            validationErrors.height ? 'border-red-500/50 focus:border-red-500/30' : 'border-gray-800 focus:border-primary-500/30'
                          }`}
                          placeholder="Enter height in cm"
                          step="0.1"
                          min="50"
                          max="300"
                        />
                        {validationErrors.height && (
                          <p className="text-xs text-red-400 mt-1">{validationErrors.height}</p>
                        )}
                      </div>

                      {/* Weight (kg only) */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">
                          <Weight className="w-3.5 h-3.5 inline mr-1" />
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          value={formData.weight.value}
                          onChange={(e) => handleInputChange('weight', {
                            ...formData.weight,
                            value: e.target.value,
                            unit: 'kg' // Ensure unit stays kg
                          })}
                          className={`w-full px-4 py-3 bg-gray-900/50 border rounded-lg focus:outline-none text-white text-sm transition-colors ${
                            validationErrors.weight ? 'border-red-500/50 focus:border-red-500/30' : 'border-gray-800 focus:border-primary-500/30'
                          }`}
                          placeholder="Enter weight in kg"
                          step="0.1"
                          min="20"
                          max="300"
                        />
                        {validationErrors.weight && (
                          <p className="text-xs text-red-400 mt-1">{validationErrors.weight}</p>
                        )}
                      </div>
                    </div>

                    {/* BMI Indicator */}
                    {bmi && (
                      <div className="mt-6 pt-6 border-t border-gray-800">
                        <div className="flex items-center gap-2 mb-4">
                          <Info className="w-4 h-4 text-primary-400" />
                          <h3 className="text-sm font-medium text-white">Your BMI (WHO Classification)</h3>
                        </div>
                        <BMIIndicator bmi={bmi} />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Health & Lifestyle Information */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Dietary Goal with Custom Dropdown */}
                  <div className="mb-6 sm:mb-8">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-400" />
                      <h2 className="text-[10px] sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Dietary Goal
                      </h2>
                    </div>
                    
                    <CustomDropdown
                      isOpen={showDietaryGoal}
                      onToggle={setShowDietaryGoal}
                      selected={formData.dietaryGoal}
                      items={dietaryGoals}
                      onSelect={(id) => handleInputChange('dietaryGoal', id)}
                      placeholder="Select your dietary goal"
                      icon={Target}
                    />
                  </div>

                  {/* Activity Level with Custom Dropdown */}
                  <div className="mb-6 sm:mb-8">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-400" />
                      <h2 className="text-[10px] sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Activity Level
                      </h2>
                    </div>
                    
                    <CustomDropdown
                      isOpen={showActivityLevel}
                      onToggle={setShowActivityLevel}
                      selected={formData.activityLevel}
                      items={activityLevels}
                      onSelect={(id) => handleInputChange('activityLevel', id)}
                      placeholder="Select your activity level"
                      icon={Activity}
                      type="activity"
                    />
                  </div>

                  {/* Health Information */}
                  <div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-5">
                      <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-400" />
                      <h2 className="text-[10px] sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Health Information
                      </h2>
                    </div>

                    {/* Health Key Status */}
                    <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            hasHealthKey ? 'bg-green-500/10' : 'bg-yellow-500/10'
                          }`}>
                            <Lock className={`w-5 h-5 ${hasHealthKey ? 'text-green-400' : 'text-yellow-400'}`} />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-white mb-1">
                              {hasHealthKey ? 'Health Key Created' : 'Health Key Required'}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {hasHealthKey
                                ? 'Your health data is securely encrypted'
                                : 'Create a key to securely store your health information'
                              }
                            </p>
                          </div>
                        </div>
                        
                        {!hasHealthKey ? (
                          <button
                            type="button"
                            onClick={() => setShowKeyModal(true)}
                            className="px-4 py-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg transition-colors border border-primary-500/20 text-sm"
                          >
                            <Key className="w-4 h-4 inline mr-2" />
                            Create Key
                          </button>
                        ) : isDecrypting ? (
                          <div className="flex items-center gap-2 text-primary-400 text-sm">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Loader className="w-4 h-4" />
                            </motion.div>
                            Decrypting...
                          </div>
                        ) : !isDecrypted ? (
                          <button
                            type="button"
                            onClick={() => setShowKeyModal(true)}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700 text-sm"
                          >
                            Enter Key
                          </button>
                        ) : (
                          <div className="text-green-400 text-sm">
                            Decrypted
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Health Conditions */}
                    <div className="mb-8">
                      <h3 className="text-sm font-medium text-white mb-3">Health Conditions</h3>
                      
                      {/* Selected Conditions */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {isDecrypted ? (
                          decryptedConditions.map((condition, index) => (
                            <div key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/10 text-primary-400 rounded-lg border border-primary-500/20">
                              <span className="text-xs">{condition}</span>
                              <button 
                                type="button" 
                                onClick={() => handleHealthCondition('remove', condition)}
                                className="hover:text-primary-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-600 italic">Enter health key to view conditions</p>
                        )}
                      </div>

                      {/* Common Conditions Grid */}
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">Common conditions:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {predefinedConditions.map((condition) => (
                            <button
                              key={condition}
                              type="button"
                              onClick={() => handleHealthCondition(
                                getSafeConditions().includes(condition) ? 'remove' : 'add',
                                condition
                              )}
                              disabled={!isDecrypted} // Only disable when not decrypted
                              className={`
                                px-3 py-2 rounded-lg text-xs transition-colors text-left
                                ${getSafeConditions().includes(condition)
                                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                                  : 'bg-gray-900/50 text-gray-400 border border-gray-800 hover:border-gray-700'
                                }
                                ${(!isDecrypted) ? 'opacity-30 cursor-not-allowed' : ''}
                              `}
                            >
                              <span className="truncate block">{condition}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Condition Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add custom condition..."
                          disabled={!isDecrypted} // Only disable when not decrypted
                          className={`flex-1 px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-lg focus:border-primary-500/30 focus:outline-none text-white text-sm ${
                            (!isDecrypted) ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim() && isDecrypted) {
                              handleHealthCondition('add', e.target.value.trim());
                              e.target.value = '';
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.querySelector('input[placeholder="Add custom condition..."]');
                            if (input && input.value.trim() && isDecrypted) {
                              handleHealthCondition('add', input.value.trim());
                              input.value = '';
                            }
                          }}
                          disabled={!isDecrypted}
                          className={`px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors ${
                            (!isDecrypted) ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                    {/* Allergies */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-white mb-3">Allergies</h3>
                      
                      {/* Selected Allergies */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {isDecrypted ? (
                          decryptedAllergies.map((allergy, index) => (
                            <div key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
                              <span className="text-xs">{allergy}</span>
                              <button 
                                type="button" 
                                onClick={() => handleAllergy('remove', allergy)}
                                className="hover:text-purple-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-600 italic">Enter health key to view allergies</p>
                        )}
                      </div>

                      {/* Common Allergies Grid */}
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">Common allergies:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {predefinedAllergies.map((allergy) => (
                            <button
                              key={allergy}
                              type="button"
                              onClick={() => handleAllergy(
                                getSafeAllergies().includes(allergy) ? 'remove' : 'add',
                                allergy
                              )}
                              disabled={!isDecrypted} // Only disable when not decrypted
                              className={`
                                px-3 py-2 rounded-lg text-xs transition-colors text-left
                                ${getSafeAllergies().includes(allergy)
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  : 'bg-gray-900/50 text-gray-400 border border-gray-800 hover:border-gray-700'
                                }
                                ${(!isDecrypted) ? 'opacity-30 cursor-not-allowed' : ''}
                              `}
                            >
                              <span className="truncate block">{allergy}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Allergy Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add custom allergy..."
                          disabled={!isDecrypted} // Only disable when not decrypted
                          className={`flex-1 px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-lg focus:border-primary-500/30 focus:outline-none text-white text-sm ${
                            (!isDecrypted) ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim() && isDecrypted) {
                              handleAllergy('add', e.target.value.trim());
                              e.target.value = '';
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.querySelector('input[placeholder="Add custom allergy..."]');
                            if (input && input.value.trim() && isDecrypted) {
                              handleAllergy('add', input.value.trim());
                              input.value = '';
                            }
                          }}
                          disabled={!isDecrypted}
                          className={`px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors ${
                            (!isDecrypted) ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Security Notice */}
                    <div className="p-3 sm:p-4 bg-gray-900/30 rounded-none sm:rounded-lg border-0 sm:border border-gray-800">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-white mb-1">Security Notice</h4>
                          <p className="text-xs text-gray-500">
                            Your health data is encrypted with your personal key. The key is never stored and cannot be recovered if forgotten.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Form Actions */}
          <div className="flex flex-row justify-end gap-3 pt-6 border-t border-gray-800">
            {currentStep === 2 ? (
              <>
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="flex-1 px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 px-6 py-2.5 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg transition-colors border border-primary-500/20 text-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                      {editMode ? 'Updating...' : 'Setting up...'}
                    </span>
                  ) : (
                    editMode ? 'Update Profile' : 'Complete Setup'
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate(editMode ? '/' : '/onboarding')}
                  className="flex-1 px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 px-6 py-2.5 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg transition-colors border border-primary-500/20 text-sm"
                >
                  Next Step
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Health Key Modal */}
      <AnimatePresence>
        {showKeyModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setShowKeyModal(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none"
            >
              <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-white">
                        {hasHealthKey ? 'Enter Health Key' : 'Create Health Key'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {hasHealthKey
                          ? 'Enter your key to view and edit health data'
                          : 'Create a secure key to encrypt your health information'
                        }
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowKeyModal(false);
                        setHealthKey('');
                        setConfirmHealthKey('');
                      }}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {!hasHealthKey ? (
                    // Create Key Form
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">
                          Create Health Key
                        </label>
                        <div className="relative">
                          <input
                            type={showHealthKey ? "text" : "password"}
                            value={healthKey}
                            onChange={(e) => setHealthKey(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-lg focus:border-primary-500/30 focus:outline-none text-white text-sm pr-12"
                            placeholder="Minimum 8 characters"
                            minLength={8}
                          />
                          <button
                            type="button"
                            onClick={() => setShowHealthKey(!showHealthKey)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400"
                          >
                            {showHealthKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">
                          Confirm Key
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmHealthKey ? "text" : "password"}
                            value={confirmHealthKey}
                            onChange={(e) => setConfirmHealthKey(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-lg focus:border-primary-500/30 focus:outline-none text-white text-sm pr-12"
                            placeholder="Re-enter your key"
                            minLength={8}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmHealthKey(!showConfirmHealthKey)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400"
                          >
                            {showConfirmHealthKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-yellow-500/5 rounded-lg border border-yellow-500/20">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm font-medium text-white mb-1">Important</h4>
                            <p className="text-xs text-gray-500">
                              This key cannot be recovered. Store it securely. You'll need it to edit health data.
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleCreateHealthKey}
                        disabled={healthKey.length < 8 || healthKey !== confirmHealthKey}
                        className="w-full py-3 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg transition-colors border border-primary-500/20 text-sm disabled:opacity-50"
                      >
                        Create Key
                      </button>
                    </div>
                  ) : (
                    // Enter Key Form
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">
                          Enter Your Health Key
                        </label>
                        <div className="relative">
                          <input
                            type={showHealthKey ? "text" : "password"}
                            value={healthKey}
                            onChange={(e) => setHealthKey(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-lg focus:border-primary-500/30 focus:outline-none text-white text-sm pr-12"
                            placeholder="Enter your health key"
                          />
                          <button
                            type="button"
                            onClick={() => setShowHealthKey(!showHealthKey)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400"
                          >
                            {showHealthKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          handleDecryptHealthData();
                          setShowKeyModal(false);
                        }}
                        disabled={!healthKey.trim() || isDecrypting}
                        className="w-full py-3 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg transition-colors border border-primary-500/20 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isDecrypting ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Loader className="w-4 h-4" />
                            </motion.div>
                            Decrypting...
                          </>
                        ) : (
                          'Decrypt Data'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileSetup;