"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useMotionPrefs } from "@/components/motion/MotionPrefsProvider";

interface MotionWrapperProps {
  children: ReactNode;
}

export function MotionWrapper({ children }: MotionWrapperProps) {
  const pathname = usePathname();
  const { reduced } = useMotionPrefs();

  const variants = {
    initial: { opacity: 0, y: reduced ? 0 : 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: reduced ? 0 : -8 },
  };

  return (
    <motion.div
      key={pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={reduced ? {} : variants}
      transition={reduced ? {} : { duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
