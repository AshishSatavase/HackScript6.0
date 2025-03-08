"use client";
import React from "react";
import { motion } from "framer-motion";
import { useSidebar } from "@/components/ui/sidebar";
import {
  SignedIn,
  SignedOut,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { User2 } from "lucide-react";

export function User() {
  const { open, animate } = useSidebar();
  const { user } = useUser();

  return (
    <div
      className={cn(
        "flex items-center justify-start gap-2  group/sidebar py-2"
      )}
    >
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <SignUpButton mode="modal">
          <div className="font-normal cursor-pointer space-x-2 items-center text-sm text-black dark:text-white py-1 z-20">
            <User2 />
          </div>
        </SignUpButton>
      </SignedOut>

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="cursor-pointer text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0 hover:text-theme"
      >
        <SignedIn>{user?.fullName}</SignedIn>
        <SignedOut>Guest User</SignedOut>
      </motion.span>
    </div>
  );
}
