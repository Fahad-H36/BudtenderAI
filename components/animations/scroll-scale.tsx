"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { type ReactNode, useRef } from "react"

interface ScrollScaleProps {
  children: ReactNode
  className?: string
  baseScale?: number
  targetScale?: number
}

export function ScrollScale({ children, className = "", baseScale = 0.9, targetScale = 1 }: ScrollScaleProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const scale = useTransform(scrollYProgress, [0, 0.5], [baseScale, targetScale])
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0.6, 1])

  return (
    <motion.div ref={ref} style={{ scale, opacity }} className={className}>
      {children}
    </motion.div>
  )
}

