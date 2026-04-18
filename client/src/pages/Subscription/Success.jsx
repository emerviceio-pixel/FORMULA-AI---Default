import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get('reference');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
        }
        return prev - 1;
      });
    }, 1000);

    // Verify payment with your backend
    if (reference) {
      fetch(`${import.meta.env.VITE_API_URL}/subscription/verify?reference=${reference}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
          }
        });
    }

    return () => clearInterval(timer);
  }, [reference, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">
          Payment Successful! 🎉
        </h1>
        <p className="text-gray-400 mb-4">
          Your premium subscription has been activated.
        </p>
        <p className="text-sm text-gray-500">
          Redirecting to dashboard in {countdown} seconds...
        </p>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;