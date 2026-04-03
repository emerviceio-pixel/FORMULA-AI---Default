import React from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Clock, Users, Lock } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/30 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-5 sm:p-8"
        >
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-4">Terms of Service</h1>
            <p className="text-sm sm:text-base text-gray-400">Last updated: February 19, 2026</p>
          </div>

          <div className="space-y-6 sm:space-y-8 text-gray-300">
            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary-500 flex-shrink-0" />
                <span>1. Acceptance of Terms</span>
              </h2>
              <p className="text-sm sm:text-base leading-relaxed">
                By accessing or using Fomula by Lamamda ("the App"), you agree to be bound by these Terms of Service. 
                If you disagree with any part of these terms, you may not access the App.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary-500 flex-shrink-0" />
                <span>2. User Responsibilities</span>
              </h2>
              <p className="text-sm sm:text-base leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials and 
                for all activities that occur under your account. You must provide accurate and complete 
                information when creating your account.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary-500 flex-shrink-0" />
                <span>3. Health Data and Privacy</span>
              </h2>
              <p className="text-sm sm:text-base leading-relaxed">
                You understand that Fomula processes sensitive health information including allergies, 
                medical conditions, and dietary restrictions. By using the App, you consent to the 
                collection, processing, and storage of this information as described in our Privacy Policy.
              </p>
              <p className="text-sm sm:text-base leading-relaxed">
                You are solely responsible for the accuracy of the health information you provide. 
                Fomula is not a substitute for professional medical advice, diagnosis, or treatment.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary-500 flex-shrink-0" />
                <span>4. Payments</span>
              </h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Premium features require a subscription. All payments are processed through Paystack, 
                and you authorize us to charge your selected payment method for the subscription fees.
              </p>
              <p className="text-sm sm:text-base leading-relaxed">
                Subscriptions automatically renew unless auto-renewal is disabled at least 24 hours 
                before the end of the current period. You can manage your subscription through your 
                device's account settings or by contacting us.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">5. Intellectual Property</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                The App and its original content, features, and functionality are owned by Fomula(Lamamda) 
                and are protected by international copyright, trademark, patent, trade secret, and 
                other intellectual property laws.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-white">6. Limitation of Liability</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Fomula provides recommendations based on AI analysis and available data. While we 
                strive for accuracy, we cannot guarantee the completeness or reliability of our 
                recommendations. Using the App means you accept this possibility.
              </p>
              <p className="text-sm sm:text-base leading-relaxed">
                Lamamda(Fomula) shall not be liable for any indirect, incidental, special, consequential, 
                or punitive damages arising from your use of the App.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">7. Changes to Terms</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We reserve the right to modify these Terms at any time. Changes will be effective 
                immediately upon posting. Your continued use of the App after changes constitutes 
                acceptance of the modified Terms.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">8. Contact Us</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                If you have any questions about these Terms, please contact us through our support 
                chat on the FAQ page or email us at{' '}
                <a href="mailto:support@fomula.app" className="text-primary-500 hover:text-primary-400 transition-colors">
                  support@fomula.app
                </a>.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfService;