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
              Effective Date: 07/14/2025
            </p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-8 md:p-12"
          >
            <div className="prose prose-lg max-w-none">
              
              <motion.div variants={itemVariants} className="mb-8 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg">
                <p className="text-gray-700 leading-relaxed">
                  Welcome to Budtender AI, a service provided by AetherLogic LLC (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). These Terms and Conditions (&quot;Terms&quot;) govern your use of our website and services, including our AI-powered virtual budtender chatbot designed for cannabis product guidance and education.
                  <br /><br />
                  By accessing or using our site or services, you agree to these Terms. If you do not agree, please do not use our website or services.
                </p>
              </motion.div>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Eligibility</h2>
                <p className="text-gray-600 leading-relaxed">
                  You must be at least 21 years old or of legal age to consume cannabis in your jurisdiction. By using this website, you confirm you meet these requirements.
                </p>
              </motion.section>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Services Provided</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Budtender AI offers:
                </p>
                <ul className="text-gray-600 leading-relaxed list-disc list-inside space-y-2">
                  <li>Strain and product recommendations based on user input</li>
                  <li>Educational content on cannabis effects, types, and usage</li>
                  <li>Website and chatbot integration services for dispensaries</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4">
                  Budtender AI does not sell or distribute cannabis products.
                </p>
              </motion.section>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">3. No Medical Advice</h2>
                <p className="text-gray-600 leading-relaxed">
                  The information provided by Budtender AI is for educational and informational purposes only. It is not intended to diagnose, treat, cure, or prevent any disease. Always consult a licensed medical professional before using cannabis for medical purposes.
                </p>
              </motion.section>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">4. User Data and Privacy</h2>
                <p className="text-gray-600 leading-relaxed">
                  We may collect anonymized interaction data to improve service quality. We do not collect, store, or sell personal health information without consent. Please review our Privacy Policy for details.
                </p>
              </motion.section>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Disclaimers</h2>
                <ul className="text-gray-600 leading-relaxed list-disc list-inside space-y-2">
                  <li>Cannabis laws vary by state/country. You are responsible for complying with all local laws.</li>
                  <li>We do not guarantee that the recommendations will lead to any specific experience or result.</li>
                  <li>Our chatbot is powered by AI and may generate responses that require human discretion.</li>
                </ul>
              </motion.section>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Intellectual Property</h2>
                <p className="text-gray-600 leading-relaxed">
                  All content on this site, including the Budtender AI system, branding, logos, software, and copy, is the intellectual property of AetherLogic LLC and protected under copyright and trademark law.
                </p>
              </motion.section>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Limitation of Liability</h2>
                <p className="text-gray-600 leading-relaxed">
                  To the fullest extent permitted by law, AetherLogic LLC and its affiliates shall not be liable for any direct, indirect, incidental, or consequential damages resulting from your use of the Budtender AI service.
                </p>
              </motion.section>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Service Availability</h2>
                <p className="text-gray-600 leading-relaxed">
                  We reserve the right to modify or discontinue the service at any time without notice. We are not liable for any downtime, data loss, or interruptions in service.
                </p>
              </motion.section>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">9. Modifications</h2>
                <p className="text-gray-600 leading-relaxed">
                  We may update these Terms at any time. Changes will be posted on this page with an updated effective date. Continued use after changes constitutes acceptance.
                </p>
              </motion.section>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">10. Governing Law</h2>
                <p className="text-gray-600 leading-relaxed">
                  These Terms are governed by the laws of the State of Ohio, without regard to conflict of law principles. Any disputes shall be resolved in the courts of Cuyahoga County, Ohio.
                </p>
              </motion.section>

              <motion.section variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">11. Contact</h2>
                <p className="text-gray-600 leading-relaxed">
                  For questions about these Terms or our services, contact us at:
                  <br />
                  📧 <strong>budtenderai@gmail.com</strong>
                </p>
              </motion.section>

            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 