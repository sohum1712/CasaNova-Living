import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

export const LandingNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
      isScrolled ? 'bg-black/60 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo and Brand Name */}
        <Link to="/" className="flex items-center space-x-3 group animate-in fade-in slide-in-from-left duration-700">
          <div className="w-10 h-10 bg-purple-600/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 group-hover:bg-purple-600/30 transition-all transform group-hover:scale-110">
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 text-purple-400 fill-current"
            >
              <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zM12 4.1l6.5 4.1L12 12.3 5.5 8.2 12 4.1zM5.5 16.8V9.7L12 13.8l6.5-4.1v7.1L12 20.9 5.5 16.8z" />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white transition-all group-hover:text-purple-400">
            CasaNova
          </span>
        </Link>

        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center space-x-10 text-gray-400 font-medium">
          <a href="#features" className="hover:text-white transition-colors cursor-pointer">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors cursor-pointer">Pricing</a>
          <a href="#about" className="hover:text-white transition-colors cursor-pointer">About</a>
          <a href="#resources" className="hover:text-white transition-colors cursor-pointer text-gradient font-bold">Solutions</a>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <Link to="/dashboard">
            <Button variant="ghost" className="text-white hover:bg-white/5 px-6 font-medium">
              Log in
            </Button>
          </Link>
          <Link to="/management">
            <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-6 font-bold shadow-lg shadow-white/5">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
