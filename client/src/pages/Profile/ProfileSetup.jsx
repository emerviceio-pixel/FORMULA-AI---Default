import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { 
  VALID_HEALTH_CONDITIONS, 
  VALID_ALLERGIES,
  isValidHealthCondition,
  isValidAllergy,
  getHealthConditionSuggestions,
  getAllergySuggestions,
  HEALTH_CONDITIONS_LIST,
  ALLERGIES_LIST
} from '../../shared/constants';
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
  Plus,
  X,
  AlertCircle,
  ChevronDown,
  Sparkles,
  NotebookPen,
  Dumbbell,
  Check,
  Heart,
  ChevronRight,
  Info,
  Loader, 
  AlertTriangle
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

// BMI Indicator Component - Minimal & Creative Design
const BMIIndicator = ({ bmi }) => {
  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { category: 'Underweight', color: '#60A5FA', barColor: 'bg-blue-400' };
    if (bmi < 25) return { category: 'Normal', color: '#4ADE80', barColor: 'bg-green-400' };
    if (bmi < 30) return { category: 'Overweight', color: '#FBBF24', barColor: 'bg-yellow-400' };
    if (bmi < 35) return { category: 'Obese I', color: '#FB923C', barColor: 'bg-orange-400' };
    if (bmi < 40) return { category: 'Obese II', color: '#F87171', barColor: 'bg-red-400' };
    return { category: 'Obese III', color: '#DC2626', barColor: 'bg-red-600' };
  };

  const category = getBMICategory(bmi);
  const percentage = Math.min(((bmi - 10) / 35) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-3xl font-bold text-white">{bmi.toFixed(1)}</span>
        <span className="text-sm" style={{ color: category.color }}>{category.category}</span>
      </div>
      
      <div className="relative h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ backgroundColor: category.color }}
        />
      </div>
      
      <div className="flex justify-between text-[9px] text-gray-600">
        <span>10</span>
        <span>18.5</span>
        <span>25</span>
        <span>30</span>
        <span>35</span>
        <span>45</span>
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
  
  // Edit mode state (replaces health key)
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Dropdown states
  const [showDietaryGoal, setShowDietaryGoal] = useState(false);
  const [showActivityLevel, setShowActivityLevel] = useState(false);

  // BMI state
  const [bmi, setBmi] = useState(null);
  
  // Custom input states
  const [customConditionInput, setCustomConditionInput] = useState('');
  const [customAllergyInput, setCustomAllergyInput] = useState('');
  const [conditionSuggestions, setConditionSuggestions] = useState([]);
  const [allergySuggestions, setAllergySuggestions] = useState([]);
  
  // Invalid data tracking
  const [invalidHealthData, setInvalidHealthData] = useState({
    conditions: [],
    allergies: [],
    hasInvalidData: false
  });

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

  // Load profile data when in editMode
  useEffect(() => {
    if (editMode && profile) {
      setFormData({
        nickname: profile.nickname || '',
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
        country: profile.country || '',
        height: { 
          value: profile.height?.value || '', 
          unit: 'cm'
        },
        weight: { 
          value: profile.weight?.value || '', 
          unit: 'kg'
        },
        dietaryGoal: profile.dietaryGoal || 'healthy',
        activityLevel: profile.activityLevel || 'moderate',
        healthConditions: [],
        allergies: []
      });
    }
  }, [editMode, profile]);

  // Auto-detect country
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
      const heightInMeters = height / 100;
      if (!isNaN(heightInMeters) && !isNaN(weight) && heightInMeters > 0 && weight > 0) {
        const bmiValue = weight / (heightInMeters * heightInMeters);
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

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({
    height: '',
    weight: ''
  });

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

  useEffect(() => {
    const heightError = validateHeight(formData.height.value);
    const weightError = validateWeight(formData.weight.value);
    
    setValidationErrors({
      height: heightError,
      weight: weightError
    });
  }, [formData.height.value, formData.weight.value]);

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

  const predefinedConditions = ['Hypertension', 'Diabetes', 'Migraine', 'Stomach Ulcer'];
  const predefinedAllergies = ['Peanuts (Groundnuts)', 'Milk', 'Egg', 'Dairy'];

  // Handle Edit button click - decrypt health data
  const handleEditClick = async () => {
    // If already in edit mode, lock it and clear data (no API call)
    if (isEditMode) {
      setIsEditMode(false);
      // Clear health data from form
      setFormData(prev => ({
        ...prev,
        healthConditions: [],
        allergies: []
      }));
      // Clear any custom inputs and suggestions
      setCustomConditionInput('');
      setCustomAllergyInput('');
      setConditionSuggestions([]);
      setAllergySuggestions([]);
      setInvalidHealthData({ conditions: [], allergies: [], hasInvalidData: false });
      showSuccess('Health data locked');
      return;
    }
    
    // Otherwise, decrypt and enter edit mode
    setIsDecrypting(true);
    try {
      const [conditionsRes, allergiesRes] = await Promise.all([
        apiFetch('/profile/health-conditions'),
        apiFetch('/profile/allergies')
      ]);
      
      if (conditionsRes.success) {
        setFormData(prev => ({ 
          ...prev, 
          healthConditions: conditionsRes.conditions || [] 
        }));
      }
      
      if (allergiesRes.success) {
        setFormData(prev => ({ 
          ...prev, 
          allergies: allergiesRes.allergies || [] 
        }));
      }
      
      setIsEditMode(true);
      showSuccess('Health data decrypted');
    } catch (error) {
      console.error('Decryption error:', error);
      showError('Failed to decrypt health data');
    } finally {
      setIsDecrypting(false);
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

  // Health condition handlers (modified - use isEditMode)
  const handleHealthCondition = (action, condition) => {
    if (!isEditMode) {
      showError('Click Edit button to modify health data');
      return;
    }
    
    if (action === 'add') {
      if (!isValidHealthCondition(condition)) {
        showError(`Health condition "${condition}" not supported.`);
        return;
      }
    }
    
    setFormData(prev => {
      const conditions = [...prev.healthConditions];
      if (action === 'add' && !conditions.includes(condition)) {
        conditions.push(condition);
      } else if (action === 'remove') {
        const index = conditions.indexOf(condition);
        if (index > -1) conditions.splice(index, 1);
      }
      return { ...prev, healthConditions: conditions };
    });
    
    setTimeout(() => {
      validateHealthDataSelection(formData.healthConditions, formData.allergies);
    }, 0);
  };

  const handleAllergy = (action, allergy) => {
    if (!isEditMode) {
      showError('Click Edit button to modify health data');
      return;
    }
    
    if (action === 'add') {
      if (!isValidAllergy(allergy)) {
        showError(`Allergy "${allergy}" not supported.`);
        return;
      }
    }
    
    setFormData(prev => {
      const allergies = [...prev.allergies];
      if (action === 'add' && !allergies.includes(allergy)) {
        allergies.push(allergy);
      } else if (action === 'remove') {
        const index = allergies.indexOf(allergy);
        if (index > -1) allergies.splice(index, 1);
      }
      return { ...prev, allergies };
    });
    
    setTimeout(() => {
      validateHealthDataSelection(formData.healthConditions, formData.allergies);
    }, 0);
  };

  const handleConditionInputChange = (e) => {
    const value = e.target.value;
    setCustomConditionInput(value);
    const suggestions = getHealthConditionSuggestions(value);
    setConditionSuggestions(suggestions);
  };

  const handleAllergyInputChange = (e) => {
    const value = e.target.value;
    setCustomAllergyInput(value);
    const suggestions = getAllergySuggestions(value);
    setAllergySuggestions(suggestions);
  };

  const handleAddCustomCondition = () => {
    if (customConditionInput.trim() && isEditMode) {
      if (isValidHealthCondition(customConditionInput.trim())) {
        handleHealthCondition('add', customConditionInput.trim());
        setCustomConditionInput('');
        setConditionSuggestions([]);
      } else {
        showError(`Health condition "${customConditionInput}" not supported.`);
      }
    } else if (!isEditMode) {
      showError('Click Edit button to modify health data');
    }
  };

  const handleAddCustomAllergy = () => {
    if (customAllergyInput.trim() && isEditMode) {
      if (isValidAllergy(customAllergyInput.trim())) {
        handleAllergy('add', customAllergyInput.trim());
        setCustomAllergyInput('');
        setAllergySuggestions([]);
      } else {
        showError(`Allergy "${customAllergyInput}" not supported.`);
      }
    } else if (!isEditMode) {
      showError('Click Edit button to modify health data');
    }
  };

  const validateHealthDataSelection = (conditions, allergies) => {
    const invalidConditions = [];
    const invalidAllergies = [];
    
    conditions.forEach(condition => {
      if (!isValidHealthCondition(condition)) {
        invalidConditions.push(condition);
      }
    });
    
    allergies.forEach(allergy => {
      if (!isValidAllergy(allergy)) {
        invalidAllergies.push(allergy);
      }
    });
    
    const hasInvalidData = invalidConditions.length > 0 || invalidAllergies.length > 0;
    
    setInvalidHealthData({
      conditions: invalidConditions,
      allergies: invalidAllergies,
      hasInvalidData
    });
    
    return !hasInvalidData;
  };

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
    if (e?.preventDefault) e.preventDefault();

    if (!validateStep2()) return;
    
    const isValid = validateHealthDataSelection(
      formData.healthConditions,
      formData.allergies
    );
    
    if (!isValid) {
      showError('Please remove or correct invalid health data before saving');
      return;
    }

    try {
      const submissionData = {
        nickname: formData.nickname,
        dateOfBirth: formData.dateOfBirth,
        country: formData.country,
        height: formData.height,
        weight: formData.weight,
        dietaryGoal: formData.dietaryGoal,
        activityLevel: formData.activityLevel,
        healthConditions: formData.healthConditions,
        allergies: formData.allergies
      };

      await updateProfile(submissionData);
      
      // Reset edit mode after save
      setIsEditMode(false);
      showSuccess(editMode ? 'Profile updated!' : 'Profile setup complete!');
      navigate('/');
    } catch (error) {
      if (error.response?.data?.details) {
        const details = error.response.data.details;
        if (details.invalidConditions?.length) {
          showError(`Unsupported conditions: ${details.invalidConditions.join(', ')}`);
        } else if (details.invalidAllergies?.length) {
          showError(`Unsupported allergies: ${details.invalidAllergies.join(', ')}`);
        } else {
          showError(error.response?.data?.error || 'Failed to save profile');
        }
      } else {
        showError('Failed to save profile');
      }
    }
  };

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

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Health & Lifestyle', icon: Heart }
  ];

  return (
    <div className="min-h-screen bg-gray-900/95 from-gray-950 via-gray-900 to-gray-950">
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, gray 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-16">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900/30 rounded-none sm:rounded-xl p-4 sm:p-8"
        >
          <form id="profile-form" onSubmit={currentStep === 2 ? handleSubmit : (e) => e.preventDefault()} className="space-y-8">
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
                      <NotebookPen className="w-4 h-4 text-primary-400" />
                      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Basic Information
                      </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                      <div>
                        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">
                          <Globe className="w-3.5 h-3.5 inline mr-1" />
                          Country
                        </label>
                        <Select
                          options={countryOptions}
                          value={countryOptions.find(c => c.value === formData.country)}
                          onChange={(selected) => handleInputChange("country", selected.value)}
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
                            menu: (base) => ({ ...base, backgroundColor: "#111827" }),
                            option: (base, state) => ({
                              ...base,
                              backgroundColor: state.isFocused ? "#1f2937" : "#111827",
                              color: "white",
                            }),
                          }}
                        />
                      </div>

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
                            unit: 'cm'
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
                            unit: 'kg'
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

                    {bmi && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="mt-6 pt-6 border-t border-gray-800"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-primary-400 to-primary-600" />
                            <h3 className="text-sm font-medium text-white">Body Mass Index</h3>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="text-[10px] text-gray-600 hover:text-primary-400 transition-colors"
                          >
                            WHO Classification
                          </motion.button>
                        </div>
                        
                        <BMIIndicator bmi={bmi} />
                        
                        {/* Dynamic Health Message */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="mt-8 text-center"
                        >
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                            <span className="text-[10px] font-medium text-gray-400">
                              {bmi < 18.5 && "💡 A balanced diet can help reach healthy weight range"}
                              {bmi >= 18.5 && bmi < 25 && "🎯 You're in the optimal range! Keep it up"}
                              {bmi >= 25 && bmi < 30 && "📉 Small lifestyle changes can make a big difference"}
                              {bmi >= 30 && "🌟 Every step toward better nutrition counts"}
                            </span>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
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

                  {/* Health Information Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3 sm:mb-5">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-400" />
                        <h2 className="text-[10px] sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Health Information
                        </h2>
                      </div>
                      
                      {/* Edit Button */}
<button
  type="button"
  onClick={handleEditClick}
  disabled={isDecrypting}
  className={`px-3 sm:px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${
    isEditMode 
      ? 'border-green-500 bg-green-500/10 text-green-400'
      : 'border-gray-600 hover:border-green-500 text-gray-400 hover:text-green-400'
  }`}
>
  {isDecrypting ? (
    <>
      <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
      <span className="hidden sm:inline">Decrypting...</span>
      <span className="inline sm:hidden">...</span>
    </>
  ) : isEditMode ? (
    <>
      <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
      {/* Desktop text */}
      <span className="hidden sm:inline">Decrypted - Editing Mode</span>
      {/* Mobile text - shorter */}
      <span className="inline sm:hidden">Lock</span>
    </>
  ) : (
    <>
      <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
      {/* Desktop text */}
      <span className="hidden sm:inline">Edit Health Data</span>
      {/* Mobile text - shorter */}
      <span className="inline sm:hidden">Edit</span>
    </>
  )}
</button>
                    </div>

                    {/* Health Conditions */}
                    <div className="mb-8">
                      <h3 className="text-sm font-medium text-white mb-3">Health Conditions</h3>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {formData.healthConditions.map((condition, index) => (
                          <div key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/10 text-primary-400 rounded-lg border border-primary-500/20">
                            <span className="text-xs">{condition}</span>
                            {isEditMode && (
                              <button 
                                type="button" 
                                onClick={() => handleHealthCondition('remove', condition)}
                                className="hover:text-primary-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        {!isEditMode && formData.healthConditions.length === 0 && (
                          <p className="text-xs text-gray-500 italic">Click Edit to view and manage health conditions</p>
                        )}
                      </div>

                      {isEditMode && (
                        <>
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2">Common conditions:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {predefinedConditions.map((condition) => (
                                <button
                                  key={condition}
                                  type="button"
                                  onClick={() => handleHealthCondition(
                                    formData.healthConditions.includes(condition) ? 'remove' : 'add',
                                    condition
                                  )}
                                  className={`px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                                    formData.healthConditions.includes(condition)
                                      ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                                      : 'bg-gray-900/50 text-gray-400 border border-gray-800 hover:border-gray-700'
                                  }`}
                                >
                                  <span className="truncate block">{condition}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="relative">
                            <div className="flex gap-2">
                              <div className="flex-1 relative">
                                <input
                                  type="text"
                                  value={customConditionInput}
                                  onChange={handleConditionInputChange}
                                  placeholder="Add custom condition..."
                                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-lg focus:border-primary-500/30 focus:outline-none text-white text-sm"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddCustomCondition();
                                    }
                                  }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={handleAddCustomCondition}
                                className={`px-4 py-2.5 rounded-lg transition-colors ${
                                  customConditionInput.trim()
                                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                    : 'opacity-30 bg-gray-800 text-gray-300'
                                }`}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            {conditionSuggestions.length > 0 && customConditionInput && (
                              <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {conditionSuggestions.map((suggestion, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                                    onClick={() => {
                                      setCustomConditionInput(suggestion);
                                      setConditionSuggestions([]);
                                    }}
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Allergies */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-white mb-3">Allergies</h3>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {formData.allergies.map((allergy, index) => (
                          <div key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
                            <span className="text-xs">{allergy}</span>
                            {isEditMode && (
                              <button 
                                type="button" 
                                onClick={() => handleAllergy('remove', allergy)}
                                className="hover:text-purple-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        {!isEditMode && formData.allergies.length === 0 && (
                          <p className="text-xs text-gray-500 italic">Click Edit to view and manage allergies</p>
                        )}
                      </div>

                      {isEditMode && (
                        <>
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2">Common allergies:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {predefinedAllergies.map((allergy) => (
                                <button
                                  key={allergy}
                                  type="button"
                                  onClick={() => handleAllergy(
                                    formData.allergies.includes(allergy) ? 'remove' : 'add',
                                    allergy
                                  )}
                                  className={`px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                                    formData.allergies.includes(allergy)
                                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                      : 'bg-gray-900/50 text-gray-400 border border-gray-800 hover:border-gray-700'
                                  }`}
                                >
                                  <span className="truncate block">{allergy}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="relative">
                            <div className="flex gap-2">
                              <div className="flex-1 relative">
                                <input
                                  type="text"
                                  value={customAllergyInput}
                                  onChange={handleAllergyInputChange}
                                  placeholder="Add custom allergy..."
                                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-800 rounded-lg focus:border-primary-500/30 focus:outline-none text-white text-sm"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddCustomAllergy();
                                    }
                                  }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={handleAddCustomAllergy}
                                className={`px-4 py-2.5 rounded-lg transition-colors ${
                                  customAllergyInput.trim()
                                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                    : 'opacity-30 bg-gray-800 text-gray-300'
                                }`}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            {allergySuggestions.length > 0 && customAllergyInput && (
                              <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {allergySuggestions.map((suggestion, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                                    onClick={() => {
                                      setCustomAllergyInput(suggestion);
                                      setAllergySuggestions([]);
                                    }}
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Invalid Data Warning */}
                    {invalidHealthData.hasInvalidData && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="text-red-400 font-medium mb-1">Invalid Health Data Detected</p>
                            {invalidHealthData.conditions.length > 0 && (
                              <p className="text-xs text-red-300">
                                Unsupported conditions: {invalidHealthData.conditions.join(', ')}
                              </p>
                            )}
                            {invalidHealthData.allergies.length > 0 && (
                              <p className="text-xs text-red-300 mt-1">
                                Unsupported allergies: {invalidHealthData.allergies.join(', ')}
                              </p>
                            )}
                            <p className="text-xs text-red-400/80 mt-2">
                              Please remove or correct these items before saving.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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
                  disabled={isLoading || invalidHealthData.hasInvalidData}
                  className="flex-1 px-6 py-2.5 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg transition-colors border border-primary-500/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2 justify-center">
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
    </div>
  );
};

export default ProfileSetup;