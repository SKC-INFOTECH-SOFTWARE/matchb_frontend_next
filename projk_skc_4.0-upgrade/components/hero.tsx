"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Heart, Users, Shield } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/subtle-heart-pattern.png')] opacity-5"></div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Heart className="w-4 h-4" />
            Trusted by 10,000+ Happy Couples
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-gray-500  mb-6 leading-tight">
            Find Your
            <span className="text-rose-600 block">Perfect Match</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-500 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join India's most trusted matrimonial platform. Connect with verified profiles and find your life partner
            with complete privacy and security.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/register">
              <Button size="lg" className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-4 text-lg">
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="border-rose-200 text-rose-700 hover:bg-rose-50 px-8 py-4 text-lg bg-transparent"
              >
                Sign In
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-rose-100 rounded-full mx-auto mb-3">
                <Users className="w-6 h-6 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">50,000+</div>
              <div className="text-gray-600">Active Profiles</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-rose-100 rounded-full mx-auto mb-3">
                <Heart className="w-6 h-6 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">10,000+</div>
              <div className="text-gray-600">Success Stories</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-rose-100 rounded-full mx-auto mb-3">
                <Shield className="w-6 h-6 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">100%</div>
              <div className="text-gray-500">Verified Profiles</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
