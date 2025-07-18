"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Zap, DollarSign, Moon, ShoppingCart } from "lucide-react"
import { Logo } from "@/components/ui/Logo"

interface ShortcutAssistanceProps {
  onShortcutClick: (shortcut: string) => void
}

export function ShortcutAssistance({ onShortcutClick }: ShortcutAssistanceProps) {
  const [hoveredExperience, setHoveredExperience] = useState(false)

  const experienceMessages = {
    calm: "I'm looking for something that will help me feel calm and peaceful. What would you recommend?",
    happy: "I want something that will boost my mood and make me feel happy and uplifted. Any suggestions?",
    relaxed: "I need something to help me unwind and feel completely relaxed after a long day. What do you have?",
    energetic: "I'm looking for something that will give me energy and keep me motivated. What's your recommendation?",
    focused: "I need something that will help me stay focused and productive. What strains work best for concentration?",
    sleepy: "I'm having trouble sleeping and need something that will help me get a good night's rest. What's best for sleep?",
    creative: "I want something that will spark my creativity and help me think outside the box. Any creative strains?"
  }

  const experiences = Object.keys(experienceMessages)

  const shortcuts = [
    {
      id: "experience",
      icon: <Zap className="h-4 w-4" />,
      text: "What kind of experience are you looking for today?",
      hasHover: true,
    },
    {
      id: "cheapest",
      icon: <DollarSign className="h-4 w-4" />,
      text: "What's your cheapest half ounce?",
      hasHover: false,
    },
    {
      id: "strongest",
      icon: <Logo width={16} height={16} />,
      text: "What's the strongest sativa you have?",
      hasHover: false,
    },
    {
      id: "sleep",
      icon: <Moon className="h-4 w-4" />,
      text: "What's good for sleep?",
      hasHover: false,
    },
    {
      id: "edible",
      icon: <ShoppingCart className="h-4 w-4" />,
      text: "What's your best edible under $20?",
      hasHover: false,
    },
  ]

  const handleExperienceClick = (experience: string) => {
    onShortcutClick(experienceMessages[experience as keyof typeof experienceMessages])
    setHoveredExperience(false)
  }

  return (
    <div className="w-full max-w-3xl mx-auto mb-3">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-200/60 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-emerald-700 rounded-full"></div>
            <h3 className="text-sm font-semibold text-emerald-700">Quick Shortcuts</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.id} className="relative">
              {shortcut.hasHover ? (
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredExperience(true)}
                  onMouseLeave={() => setHoveredExperience(false)}
                >
                  <button
                    className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-100/20 to-emerald-100/10 hover:from-emerald-100/30 hover:to-emerald-100/20 border border-emerald-200/40 rounded-lg text-sm text-emerald-700 transition-all duration-200 hover:shadow-md group"
                  >
                    {shortcut.icon}
                    <span className="font-medium">{shortcut.text}</span>
                    <ChevronDown className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
                  </button>
                  
                  <AnimatePresence>
                    {hoveredExperience && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-[#E3FFCC]/60 p-3 z-50 min-w-[200px]"
                      >
                        <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-l border-t border-[#E3FFCC]/60 rotate-45"></div>
                        <div className="text-xs text-[#777C90] font-medium mb-2">Choose your experience:</div>
                        <div className="flex flex-wrap gap-1">
                          {experiences.map((experience) => (
                            <button
                              key={experience}
                              onClick={() => handleExperienceClick(experience)}
                              className="px-2 py-1 bg-emerald-100/10 hover:bg-emerald-100/20 text-emerald-700 rounded-md text-xs font-medium transition-all duration-150 hover:shadow-sm capitalize"
                            >
                              {experience}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => onShortcutClick(shortcut.text)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-100/20 to-emerald-100/10 hover:from-emerald-100/30 hover:to-emerald-100/20 border border-emerald-200/40 rounded-lg text-sm text-emerald-700 transition-all duration-200 hover:shadow-md"
                >
                  {shortcut.icon}
                  <span className="font-medium">{shortcut.text}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 