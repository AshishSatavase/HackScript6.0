"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const { open, animate } = useSidebar();

  // Toggle between light and dark.
  const toggleTheme = () => {
    if (theme === "light" || theme === "system") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  // If the current theme is light (or system fallback to light), show the Moon icon (targeting dark)
  const isLight = theme === "light" || theme === "system";

  return (
    <div
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2 cursor-pointer"
      )}
      onClick={toggleTheme}
    >
      <div className="font-normal cursor-pointer space-x-2 items-center text-sm text-black dark:text-white py-1 z-20 hover:text-theme">
        {isLight ? <Moon /> : <Sun />}
      </div>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-neutral-700 dark:text-neutral-200 hover:text-theme text-sm transition duration-150 whitespace-pre inline-block"
      >
        {isLight ? "Dark Mode" : "Light Mode"}
      </motion.span>
    </div>
  );
}
