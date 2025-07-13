"use client"

import { motion } from 'framer-motion';
import { Leaf, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Header */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-emerald-100"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3 hover:scale-105 transition-transform">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                BudtenderAI
              </span>
            </Link>
            
            <Link 
              href="/"
              className="flex items-center space-x-2 text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Content */}
      <motion.div 
        className="pt-24 pb-20 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-4xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
              Terms and Conditions
            </h1>
            <p className="text-lg text-gray-600">
              Please read these terms carefully before using BudtenderAI
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-8 md:p-12"
          >
            <div className="prose prose-lg max-w-none">
              
              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-600 leading-relaxed">
                  By accessing and using BudtenderAI (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </motion.section>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Age Restriction</h2>
                <p className="text-gray-600 leading-relaxed">
                  You must be at least 21 years of age to use this service. By using BudtenderAI, you represent and warrant that you are at least 21 years old.
                  This service is not intended for use by minors.
                </p>
              </motion.section>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Service Description</h2>
                <p className="text-gray-600 leading-relaxed">
                  BudtenderAI is an AI-powered cannabis recommendation service that provides personalized product suggestions based on user preferences and goals. 
                  We provide informational guidance only and do not sell, distribute, or provide cannabis products directly.
                </p>
              </motion.section>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">4. No Medical Claims</h2>
                <p className="text-gray-600 leading-relaxed">
                  BudtenderAI does not provide medical advice, diagnosis, or treatment. Our recommendations are for informational purposes only and should not replace professional medical consultation. 
                  Always consult with a healthcare provider before using cannabis for medical purposes.
                </p>
              </motion.section>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Legal Compliance</h2>
                <p className="text-gray-600 leading-relaxed">
                  You are responsible for ensuring that your use of cannabis complies with all applicable local, state, and federal laws. 
                  Cannabis laws vary by jurisdiction, and it is your responsibility to understand and follow the laws in your area.
                </p>
              </motion.section>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Privacy and Data</h2>
                <p className="text-gray-600 leading-relaxed">
                  We are committed to protecting your privacy. All conversations and personal information are kept confidential and secure. 
                  We do not share your personal data with third parties without your explicit consent, except as required by law.
                </p>
              </motion.section>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Use Restrictions</h2>
                <p className="text-gray-600 leading-relaxed">
                  You agree not to use the service for any unlawful purpose or in any way that could damage, disable, or impair the service. 
                  You may not attempt to gain unauthorized access to any part of the service or its related systems.
                </p>
              </motion.section>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Disclaimer of Warranties</h2>
                <p className="text-gray-600 leading-relaxed">
                  The service is provided &quot;as is&quot; without warranty of any kind. We make no representations about the accuracy, reliability, 
                  completeness, or timeliness of the content or recommendations provided by BudtenderAI.
                </p>
              </motion.section>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">9. Limitation of Liability</h2>
                <p className="text-gray-600 leading-relaxed">
                  BudtenderAI shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service. 
                  Our total liability shall not exceed the amount paid by you for the service, if any.
                </p>
              </motion.section>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">10. Changes to Terms</h2>
                <p className="text-gray-600 leading-relaxed">
                  We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website. 
                  Your continued use of the service constitutes acceptance of any changes to these terms.
                </p>
              </motion.section>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">11. Contact Information</h2>
                <p className="text-gray-600 leading-relaxed">
                  If you have any questions about these Terms and Conditions, please contact us at: 
                  <br />
                  <strong>Email:</strong> support@budtenderai.com
                  <br />
                  <strong>Address:</strong> [Company Address - To be updated]
                </p>
              </motion.section>

            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 