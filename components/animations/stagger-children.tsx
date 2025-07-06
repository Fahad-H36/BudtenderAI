"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface StaggerChildrenProps {
  children: ReactNode
  className?: string
  delay?: number
  childrenDelay?: number
  viewport?: { once: boolean; amount?: number }
}

export function StaggerChildren({
  children,
  className = "",
  delay = 0,
  childrenDelay = 0.1,
  viewport = { once: true, amount: 0.25 },
}: StaggerChildrenProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: childrenDelay,
        delayChildren: delay,
      },
    },
  }

  return (
    <motion.div variants={container} initial="hidden" whileInView="show" viewport={viewport} className={className}>
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.25, 0.25, 0.75],
      },
    },
  }

  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  )
}

