"use client";

import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-gradient-to-br from-[#F1E395]/5 to-[#5E33FF]/5 z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        {/* Mobile floating orbs */}
        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute w-[1000px] h-[1000px] rounded-full bg-gradient-to-r from-[#F1E395] to-[#8500FF] opacity-20 blur-3xl orb-animation-primary"
            style={{ top: "-50%", left: "-50%" }}
            aria-hidden
          />
          <div
            className="absolute w-[900px] h-[900px] rounded-full bg-gradient-to-r from-[#5E33FF] to-[#FF5900] opacity-25 blur-3xl orb-animation-secondary"
            style={{ bottom: "-50%", right: "-50%" }}
            aria-hidden
          />
          <div
            className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-[#F1E395] to-[#FF5900] opacity-30 blur-2xl orb-animation-tertiary"
            style={{ top: "20%", right: "-20%" }}
            aria-hidden
          />
          <div
            className="absolute w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-[#8500FF] to-[#FF5900] opacity-20 blur-3xl orb-animation-quaternary"
            style={{ bottom: "20%", left: "-30%" }}
            aria-hidden
          />
        </div>

        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col dark:bg-gray-900 sm:p-0">
          {children}
          <div className="lg:w-1/2 w-full h-full lg:flex items-center hidden relative overflow-hidden bg-gradient-to-br from-[#F1E395]/5 to-[#5E33FF]/5">
            {/* Desktop floating orbs */}
            <div
              className="absolute w-[1000px] h-[1000px] rounded-full bg-gradient-to-r from-[#F1E395] to-[#8500FF] opacity-20 blur-3xl orb-animation-primary"
              style={{ top: "-50%", left: "-50%" }}
              aria-hidden
            />
            <div
              className="absolute w-[900px] h-[900px] rounded-full bg-gradient-to-r from-[#5E33FF] to-[#FF5900] opacity-25 blur-3xl orb-animation-secondary"
              style={{ bottom: "-50%", right: "-50%" }}
              aria-hidden
            />
            <div
              className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-[#F1E395] to-[#FF5900] opacity-30 blur-2xl orb-animation-tertiary"
              style={{ top: "20%", right: "-20%" }}
              aria-hidden
            />
            <div
              className="absolute w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-[#8500FF] to-[#FF5900] opacity-20 blur-3xl orb-animation-quaternary"
              style={{ bottom: "20%", left: "-30%" }}
              aria-hidden
            />

            <div className="relative z-10 w-full px-12">
              <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
                <div className="mb-8 flex items-center justify-center gap-3">
                  <Image
                    src="https://cdn.rayo.work/Rayo_assests/logo.svg"
                    alt="Rayo Logo"
                    width={300}
                    height={70}
                    priority
                  />
                </div>
                <p className="text-xl mb-8 text-gray-600 dark:text-gray-200">
                  Monitor and control your system with comprehensive logging and powerful analytics.
                </p>
              </div>
            </div>

            <div className="absolute bottom-8 left-0 w-full text-center text-gray-500 text-sm">
              © 2026 Rayo. All rights reserved.
            </div>
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
