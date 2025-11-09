"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function NotFound() {
  useEffect(() => {
    // Update page metadata
    document.title = "404 - Page Not Found | Rayo";

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "The page you are looking for could not be found. Return to Rayo to continue exploring our revolutionary AI content generator."
      );
    }

    // Update robots meta
    const metaRobots = document.querySelector('meta[name="robots"]');
    if (metaRobots) {
      metaRobots.setAttribute("content", "noindex, follow");
    }
  }, []);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 relative overflow-hidden flex items-center justify-center">
      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 md:px-6 text-center">
        <div className="space-y-8">
          {/* 404 Number */}
          <div>
            <div className="font-sans font-bold text-[200px] leading-none tracking-[-0.06em] text-center text-gray-900 dark:text-white">
              404
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#232F45] dark:text-white mb-4 font-sans">
              Page Not Found
            </h1>
          </div>

          {/* Subtitle */}
          <div>
            <p className="text-xl md:text-xl lg:text-xl text-[rgba(24,34,52,0.65)] dark:text-gray-400 leading-relaxed max-w-2xl mx-auto font-sans">
              While Rayo is off auto-writing another 2,000-word masterpiece,
              with <br /> live citations and zero hallucinations, you've landed
              on a broken link.
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center pt-4">
            <Link
              href="/"
              className="bg-[#5E33FF] hover:bg-[#4D2BD9] text-white px-8 py-4 rounded-full text-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-xl font-sans"
            >
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
    </main>
  );
}
