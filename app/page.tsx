"use client"

import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  MessageCircle, 
  Search, 
  Shield,  
  ChevronRight, 
  Brain,
  Users,
  ArrowRight
} from 'lucide-react';
import { LandingPageChatbot } from '@/components/LandingPageChatbot';
import { Logo } from '@/components/ui/Logo';

export default function HomePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setIsRedirecting(true);
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading only when redirecting authenticated users
  if (isRedirecting) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-green-50">
        <motion.div 
          className="flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4">
            <Logo width={80} height={80} className="animate-pulse" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700">Redirecting to dashboard...</h2>
        </motion.div>
      </div>
    );
  }

  // Show landing page for logged-out users or while auth is loading
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
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

  const floatingVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const features = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "Personalized Suggestions",
      description: "No more scrolling through endless menus. Get instant product ideas that match your needs."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Stress-Free Shopping",
      description: "Whether you&apos;re new or experienced, your Budtender meets you where you are — no pressure, no judgment."
    },
    {
      icon: <Search className="h-8 w-8" />,
      title: "Discover Deals & Bundles",
      description: "Automatically see what's on sale or bundled for your goals (like sleep, focus, or chill)."
    },
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: "Always Available",
      description: "Ask anything, anytime. No waiting in line, no awkward questions."
    }
  ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-emerald-100"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center space-x-1 sm:space-x-1.5"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Logo width={36} height={36} className="sm:w-12 sm:h-12" />
              <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                BudtenderAI
              </span>
            </motion.div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <motion.button
                onClick={() => router.push('/sign-in')}
                className="text-emerald-700 hover:text-emerald-800 font-medium transition-colors text-sm sm:text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign In
              </motion.button>
              <motion.button
                onClick={() => router.push('/sign-up')}
                className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 sm:px-6 sm:py-2 rounded-full font-medium hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg text-sm sm:text-base"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        className="pt-20 sm:pt-24 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-16 sm:top-20 left-4 sm:left-10 w-16 h-16 sm:w-20 sm:h-20 bg-emerald-200/30 rounded-full blur-xl"
            animate={{ 
              y: [0, -20, 0], 
              x: [0, 10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
          <motion.div 
            className="absolute top-32 sm:top-40 right-8 sm:right-20 w-24 h-24 sm:w-32 sm:h-32 bg-green-200/20 rounded-full blur-xl"
            animate={{ 
              y: [0, 20, 0], 
              x: [0, -15, 0],
              scale: [1, 0.9, 1]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 2
            }}
          />
          <motion.div 
            className="absolute bottom-16 sm:bottom-20 left-1/3 w-20 h-20 sm:w-24 sm:h-24 bg-teal-200/25 rounded-full blur-xl"
            animate={{ 
              y: [0, -15, 0], 
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity, 
              ease: "linear"
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div
              className="flex justify-center mb-6 sm:mb-8"
              variants={floatingVariants}
            >
              <div>
                <Logo width={128} height={128} className="sm:w-40 sm:h-40 filter drop-shadow-2xl" />
              </div>
            </motion.div>

            <motion.h1 
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight"
              variants={itemVariants}
            >
              <span className="bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                Find the Right Cannabis
              </span>
              <br />
              <span className="bg-gradient-to-r from-green-700 to-emerald-800 bg-clip-text text-transparent">
                for You — Instantly
              </span>
            </motion.h1>

            <motion.p 
              className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2"
              variants={itemVariants}
            >
              Personalized recommendations. No pressure. No guesswork. Just real help from your own AI Budtender.
            </motion.p>

            <motion.p 
              className="text-xs sm:text-sm text-gray-500 mb-8 sm:mb-10 max-w-2xl mx-auto px-2"
              variants={itemVariants}
            >
              By signing up or logging in, you agree to our{' '}
              <Link 
                href="/terms" 
                className="text-emerald-600 hover:text-emerald-700 underline font-medium"
              >
                Terms and Conditions
              </Link>
              .
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4"
              variants={itemVariants}
            >
              <motion.button
                onClick={() => router.push('/sign-up')}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:from-emerald-600 hover:to-green-700 transition-all shadow-xl flex items-center justify-center space-x-2"
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 15px 35px rgba(16, 185, 129, 0.4)" 
                }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Talk to the Budtender</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </motion.button>
              
              <motion.button
                onClick={() => router.push('/sign-in')}
                className="w-full sm:w-auto bg-white text-emerald-700 border-2 border-emerald-300 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:bg-emerald-50 transition-all shadow-lg flex items-center justify-center space-x-2"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 10px 25px rgba(16, 185, 129, 0.15)" 
                }}
                whileTap={{ scale: 0.95 }}
              >
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Sign In</span>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* What It Does Section */}
      <motion.section 
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
              Meet Your AI Budtender
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto px-2">
              Meet your AI Budtender — your friendly cannabis shopping assistant.
            </p>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto mt-4 sm:mt-6 px-2">
              Whether you&apos;re looking to sleep better, relieve stress, or just chill after a long day, the AI Budtender helps you discover the perfect products based on your mood, preferences, and comfort level — all through a natural conversation.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white/50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-12 sm:mb-16" variants={itemVariants}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
              Why Use It?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              Get personalized cannabis recommendations without the guesswork
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-emerald-100"
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(16, 185, 129, 0.1)"
                }}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center mb-4 sm:mb-6 text-white">
                  {feature.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Target Audience Section */}
      <motion.section 
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white/50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-12 sm:mb-16" variants={itemVariants}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
              Who It&apos;s For
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 px-2">
              This tool is perfect for:
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {[
              "First-time shoppers unsure where to start",
              "Experienced users looking for something new", 
              "Anyone with a goal (like sleep, energy, or creativity)",
              "Anyone who wants a fast, easy, and private way to shop"
            ].map((audience, index) => (
              <motion.div
                key={index}
                className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-emerald-100 flex items-center space-x-3 sm:space-x-4"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <p className="text-gray-700 font-medium text-sm sm:text-base">{audience}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section 
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-12 sm:mb-16" variants={itemVariants}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-2 sm:mb-4 px-2">
              It&apos;s like texting with a super-smart budtender who knows the whole menu.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                step: "1",
                title: "Ask a question",
                description: "Tell us what you&apos;re looking for or what you want to achieve"
              },
              {
                step: "2", 
                title: "Get suggestions",
                description: "Receive 1–2 product suggestions instantly"
              },
              {
                step: "3",
                title: "Fine-tune",
                description: "Answer a couple quick questions to personalize your match"
              },
              {
                step: "4",
                title: "Perfect match",
                description: "Get the ideal product with price, effects info, and current deals"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                className="text-center"
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-white font-bold text-lg sm:text-xl">
                  {step.step}
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-800">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base px-2">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Live Demo CTA Section */}
      <motion.section 
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-emerald-500 to-green-600 relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.h2 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6"
            variants={itemVariants}
          >
            Start Chatting Now
          </motion.h2>
          <motion.p 
            className="text-lg sm:text-xl text-emerald-100 mb-8 sm:mb-10 max-w-2xl mx-auto px-2"
            variants={itemVariants}
          >
            Try the chatbot below or sign up for the full experience with personalized recommendations
          </motion.p>
          <motion.div variants={itemVariants}>
            <motion.button
              onClick={() => router.push('/sign-up')}
              className="bg-white text-emerald-700 px-8 sm:px-10 py-3 sm:py-4 rounded-full font-bold text-lg sm:text-xl hover:bg-emerald-50 transition-all shadow-2xl flex items-center space-x-2 sm:space-x-3 mx-auto"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(255, 255, 255, 0.3)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Find Your Product Now</span>
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </motion.button>
          </motion.div>
        </div>
      </motion.section>



      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center items-center space-x-1 sm:space-x-1.5 mb-8">
              <Logo width={36} height={36} className="sm:w-12 sm:h-12" />
              <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                BudtenderAI
              </span>
            </div>
            <p className="text-gray-300 text-lg sm:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
              Your trusted AI companion for cannabis guidance and education
            </p>
          </div>
          
          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
                <Link 
                  href="/terms" 
                  className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                >
                  Terms and Conditions
                </Link>
              </div>
              <p className="text-gray-400 text-sm">
                © 2024 BudtenderAI. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Popup Chatbot */}
      <LandingPageChatbot onSignUpClick={() => router.push('/sign-up')} />
    </div>
  );
}

