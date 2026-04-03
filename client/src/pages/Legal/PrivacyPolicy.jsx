import React from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Database, Users, Lock, EyeOff } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/30 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-5 sm:p-8"
        >
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <EyeOff className="w-10 h-10 sm:w-12 sm:h-12 text-primary-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-4">Privacy Policy</h1>
            <p className="text-sm sm:text-base text-gray-400">Last updated: February 19, 2026</p>
          </div>

          <div className="space-y-6 sm:space-y-8 text-gray-300">
            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary-500 flex-shrink-0" />
                <span>1. Introduction</span>
              </h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Fomula-Lamamda ("we", "us", or "our") respects your privacy and is committed to protecting 
                your personal information. This Privacy Policy explains how we collect, use, disclose, 
                and safeguard your information when you use our mobile application.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
                <Database className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary-500 flex-shrink-0" />
                <span>2. Information We Collect</span>
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside space-y-1.5 ml-1 sm:ml-2 text-sm sm:text-base">
                    <li>Email address and nickname</li>
                    <li>Country and demographic information</li>
                    <li>Health conditions and allergies (encrypted)</li>
                    <li>Dietary goals and preferences</li>
                    <li>Physical measurements (weight, height, BMI)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Technical Information</h3>
                  <ul className="list-disc list-inside space-y-1.5 ml-1 sm:ml-2 text-sm sm:text-base">
                    <li>Device information and IP address</li>
                    <li>App usage patterns and scan history</li>
                    <li>Subscription and payment information (via Paystack)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary-500 flex-shrink-0" />
                <span>3. Data Usage</span>
              </h2>
              <ul className="list-disc list-inside space-y-1.5 ml-1 sm:ml-2 text-sm sm:text-base">
                <li>To provide personalized food and restaurant recommendations</li>
                <li>To analyze food safety based on your health profile</li>
                <li>To process subscriptions and manage your account</li>
                <li>To improve our AI models and app functionality</li>
                <li>To comply with legal obligations and protect our rights</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-white">4. Data Security</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We implement industry-standard security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside space-y-1.5 ml-1 sm:ml-2 text-sm sm:text-base">
                <li><span className="font-semibold text-white">Encryption</span>: All sensitive health data is encrypted at rest using AES-256-GCM</li>
                <li><span className="font-semibold text-white">Secure Transmission</span>: All data is transmitted over HTTPS</li>
                <li><span className="font-semibold text-white">Access Controls</span>: Strict access controls limit who can view your data</li>
                <li><span className="font-semibold text-white">Regular Audits</span>: Security practices are regularly reviewed and updated</li>
              </ul>
              <p className="text-sm sm:text-base leading-relaxed mt-2">
                Despite our efforts, no security measure is perfect. Using the App means you accept this possibility.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-white">5. Data Sharing and Disclosure</h2>
              <p className="text-sm sm:text-base leading-relaxed">We do not sell or rent your personal information to third parties.</p>
              <p className="text-sm sm:text-base leading-relaxed">We may share your information with:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-1 sm:ml-2 text-sm sm:text-base">
                <li><span className="font-semibold text-white">Payment Processors</span>: Paystack for subscription processing</li>
                <li><span className="font-semibold text-white">Analytics Providers</span>: Anonymous usage data for app improvement</li>
                <li><span className="font-semibold text-white">Legal Compliance</span>: When required by law or to protect our rights</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-white">6. Your Rights and Choices</h2>
              <p className="text-sm sm:text-base leading-relaxed">You have the right to:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-1 sm:ml-2 text-sm sm:text-base">
                <li>Access and correct your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of marketing communications</li>
                <li>Export your data in a portable format</li>
              </ul>
              <p className="text-sm sm:text-base leading-relaxed mt-2">
                To exercise these rights, please contact us through our support channels.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">7. Children's Privacy</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Fomula is not intended for users under 13 years of age. We do not knowingly collect 
                personal information from children under 13.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">8. International Data Transfers</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Your information may be processed and stored in Ghana and other countries where 
                our service providers operate. We ensure appropriate safeguards are in place for 
                international data transfers.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">9. Changes to This Privacy Policy</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We may update this Privacy Policy from time to time. Changes will be posted on 
                this page with an updated effective date. Your continued use of the App after 
                changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">10. Contact Us</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                If you have questions about this Privacy Policy or your personal information, 
                please contact us through our support chat on the FAQ page or email us at{' '}
                <a href="mailto:privacy@fomula.app" className="text-primary-500 hover:text-primary-400 transition-colors">
                  privacy@fomula.app
                </a>.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;