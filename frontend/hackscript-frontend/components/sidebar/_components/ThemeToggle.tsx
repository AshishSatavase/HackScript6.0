"use client";

import React, { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const localStorage = window.localStorage;
  const { theme } = useTheme();

  const [themeColor, setThemeColor] = useState(() => {
    const storedThemeColor = localStorage.getItem("themeColor");
    return storedThemeColor ? storedThemeColor : "var(--color-one)";
  });

  const [themeLightColor, setThemeLightColor] = useState(() => {
    const storedThemeLightColor = localStorage.getItem("themeLightColor");
    return storedThemeLightColor
      ? storedThemeLightColor
      : "var(--color-one-light)";
  });

  const [themehsl, setThemehsl] = useState(() => {
    const storedThemeHSLColor = localStorage.getItem("themehsl");
    return storedThemeHSLColor ? storedThemeHSLColor : "238.8, 100%, 70.59%";
  });

  const changeColor = (
    theme: string,
    themeLight: string,
    themehsl: string
  ): void => {
    setThemeColor(theme);
    setThemeLightColor(themeLight);
    setThemehsl(themehsl);
    localStorage.setItem("themeColor", theme);
    localStorage.setItem("themeLightColor", themeLight);
    localStorage.setItem("themehsl", themehsl);
  };

  useEffect(() => {
    document.documentElement.style.setProperty("--theme", themeColor);
    document.documentElement.style.setProperty(
      "--theme-light",
      themeLightColor
    );
    document.documentElement.style.setProperty("--primary", themehsl);
    document.documentElement.style.setProperty("--ring", themehsl);
  }, [themeColor, themeLightColor, themehsl]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.style.setProperty("--theme", themeLightColor);
      document.documentElement.style.setProperty("--theme-light", themeColor);
    } else {
      document.documentElement.style.setProperty("--theme", themeColor);
      document.documentElement.style.setProperty(
        "--theme-light",
        themeLightColor
      );
    }
  }, [theme, themeColor, themeLightColor, themehsl]);

  const { open, animate } = useSidebar();

  return (
    <div
      className={cn(
        "flex items-center justify-start gap-2  group/sidebar py-2"
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="font-normal cursor-pointer space-x-2 items-center text-sm text-black dark:text-white py-1 z-20">
            <div className="rounded-full bg-theme w-5 h-5"></div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          className="flex justify-center gap-x-1.5 py-2"
        >
          <div
            className="rounded-full bg-colorOne w-5 h-5"
            onClick={() =>
              changeColor(
                "var(--color-one)",
                "var(--color-one-light)",
                "var(--color-one-hsl)"
              )
            }
          ></div>
          <div
            className="rounded-full bg-colorTwo w-5 h-5"
            onClick={() =>
              changeColor(
                "var(--color-two)",
                "var(--color-two-light)",
                "var(--color-two-hsl)"
              )
            }
          ></div>
          <div
            className="rounded-full bg-colorThree w-5 h-5"
            onClick={() =>
              changeColor(
                "var(--color-three)",
                "var(--color-three-light)",
                "var(--color-three-hsl)"
              )
            }
          ></div>
          <div
            className="rounded-full bg-colorFour w-5 h-5"
            onClick={() =>
              changeColor(
                "var(--color-four)",
                "var(--color-four-light)",
                "var(--color-four-hsl)"
              )
            }
          ></div>
          <div
            className="rounded-full bg-colorFive w-5 h-5"
            onClick={() =>
              changeColor(
                "var(--color-five)",
                "var(--color-five-light)",
                "var(--color-five-hsl)"
              )
            }
          ></div>
        </DropdownMenuContent>
      </DropdownMenu>

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="cursor-pointer text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0 hover:text-theme"
      >
        Theme Toggler
      </motion.span>
    </div>
  );
}
