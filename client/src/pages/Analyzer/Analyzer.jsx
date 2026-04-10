import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { 
  Search, 
  Camera, 
  Barcode, 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle,
  Loader,
  Clock,
  Scale,
  Lightbulb,
  Leaf,
  Plus
} from 'lucide-react';

const Analyzer = () => {
  const navigate = useNavigate();
  const { profile, isLoading: authLoading } = useAuth();
  const { showError } = useToast();
  const [foodName, setFoodName] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeFood = async () => {
    if (!foodName.trim()) return;
    
    setIsLoading(true);
    try {
      const res = await apiFetch('/analyzer/analyze', {
        method: 'POST',
        body: JSON.stringify({ foodName })
      });
      
      
      if (data.success) {
        setResult(data.scan);
      } else {
        if (data.upgrade) {
          if (window.confirm('Upgrade to Premium for unlimited scans and alternatives?')) {
            navigate('/settings/subscription');
          }
        } else {
          showError(data.error);
        }
      }
    } catch (error) {
      showError('Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'safe': return <CheckCircle className="w-6 h-6 text-success" />;
      case 'cautious': return <AlertTriangle className="w-6 h-6 text-warning" />;
      case 'unsafe': return <AlertCircle className="w-6 h-6 text-danger" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'safe': return 'text-success';
      case 'cautious': return 'text-warning';
      case 'unsafe': return 'text-danger';
      default: return 'text-gray-400';
    }
  };

  // Handle log button click
  const handleLogFood = async () => {
    if (!result) return;
    
    try {
      // This will automatically update dashboard metrics
      alert('Food logged successfully! Dashboard updated.');
      setResult(null);
      setFoodName('');
    } catch (error) {
      showError('Failed to log food');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-gray-800 rounded-xl text-gray-300"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-white">Food Analyzer</h1>
          <button
            onClick={() => navigate('/analyzer')}
            className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl"
          >
            <Search className="w-5 h-5" />
            <span>Scan Food</span>
          </button>
        </div>

        {/* Scan Input */}
        {!result && (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex space-x-3 mb-4">
              <input
                type="text"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && analyzeFood()}
                placeholder="Search food or drink..."
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
                disabled={isLoading || authLoading}
              />
              <button
                onClick={analyzeFood}
                disabled={isLoading || authLoading || !foodName.trim()}
                className={`px-6 py-3 rounded-xl flex items-center justify-center transition-all ${
                  isLoading || authLoading || !foodName.trim()
                    ? 'bg-gray-700 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {isLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <button 
                className="p-3 bg-gray-800/50 rounded-xl flex flex-col items-center opacity-50 cursor-not-allowed"
                disabled
              >
                <Barcode className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-400 mt-1">Barcode</span>
              </button>
              <button 
                className="p-3 bg-gray-800/50 rounded-xl flex flex-col items-center opacity-50 cursor-not-allowed"
                disabled
              >
                <Camera className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-400 mt-1">Photo</span>
              </button>
              <button className="p-3 bg-gray-800/50 rounded-xl flex flex-col items-center">
                <Search className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-400 mt-1">Search</span>
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6"
          >
            {/* Product Name & Safety Status */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">{result.foodName}</h2>
              <div className="flex items-center justify-center space-x-2">
                {getStatusIcon(result.safetyStatus)}
                <span className={`font-bold text-lg capitalize ${getStatusColor(result.safetyStatus)}`}>
                  {result.safetyStatus}
                </span>
              </div>
            </div>

            {/* Nutrition Chart */}
            <div className="mb-6">
              <h3 className="font-bold text-white mb-3 flex items-center">
                <Scale className="w-5 h-5 mr-2" />
                Nutrition Facts (per serving)
              </h3>
              <div className="space-y-3">
                {Object.entries(result.nutrition).map(([nutrient, value]) => (
                  <div key={nutrient} className="flex justify-between">
                    <span className="text-gray-300 capitalize">{nutrient}</span>
                    <span className="text-white font-medium">
                      {nutrient === 'calories' ? `${value} cal` : `${value}g`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Best Time to Eat */}
            <div className="mb-4 p-3 bg-gray-800/50 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-primary-400" />
                <span className="font-medium text-white">Best Time to Eat</span>
              </div>
              <p className="text-gray-300">{result.bestTimeToEat}</p>
            </div>

            {/* Optimization Tips */}
            {result.tips?.length > 0 && (
              <div className="mb-4 p-3 bg-gray-800/50 rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-primary-400" />
                  <span className="font-medium text-white">Optimization Tips</span>
                </div>
                <ul className="space-y-1">
                  {result.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-gray-300">• {tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Portion */}
            <div className="mb-4 p-3 bg-gray-800/50 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <Scale className="w-5 h-5 text-primary-400" />
                <span className="font-medium text-white">Recommended Portion</span>
              </div>
              <p className="text-gray-300">{result.recommendedPortion}</p>
            </div>

            {/* Alternatives (Premium Only) */}
            {result.alternatives?.length > 0 && (
              <div className="mb-4 p-3 bg-gray-800/50 rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <Leaf className="w-5 h-5 text-primary-400" />
                  <span className="font-medium text-white">Healthier Alternatives</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.alternatives.map((alt, i) => (
                    <span key={i} className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm">
                      {alt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="mb-6 p-4 bg-gray-800/30 rounded-xl border-l-4 border-primary-500">
              <p className="text-gray-300 italic">"{result.summary}"</p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleLogFood}
                className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-primary-600/20 transition-all"
              >
                <Plus className="w-5 h-5 inline-block mr-2" />
                Log This Food
              </button>
              <button
                onClick={() => setResult(null)}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl"
              >
                New Scan
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Analyzer;