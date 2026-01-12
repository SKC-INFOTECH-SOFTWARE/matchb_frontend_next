"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Phone, Heart } from "lucide-react"
import Link from "next/link"

interface Plan {
  id: number
  name: string
  price: number | string
  duration_months: number
  description: string | null
  features: string[] | null
  type: 'normal' | 'call'
  call_credits?: number | null
  popular?: boolean
}

export function Plans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch("/api/plans")
        if (!response.ok) {
          throw new Error("Failed to fetch plans")
        }
        const data = await response.json()
        
        const formattedPlans = data.plans.map((plan: any) => {
          let features: string[] | null = null
          if (plan.features) {
            if (typeof plan.features === "string") {
              features = plan.features
                .split(",")
                .map((feature: string) => feature.trim())
                .filter((feature: string) => feature !== "")
            } else if (Array.isArray(plan.features)) {
              features = plan.features.filter((feature: string) => feature.trim() !== "")
            }
          }
          const price = parseFloat(String(plan.price))
          return {
            id: plan.id,
            name: plan.name,
            price: isNaN(price) ? 0 : price,
            duration_months: plan.duration_months,
            description: plan.description || "No description available",
            features,
            type: plan.type || 'normal',
            call_credits: plan.call_credits || null,
            popular: plan.name.toLowerCase().includes("premium") || plan.name.toLowerCase().includes("standard"),
          }
        })
        setPlans(formattedPlans)
        setLoading(false)
      } catch (err) {
        console.error("Fetch error:", err)
        setError("Failed to load plans. Please try again later.")
        setLoading(false)
      }
    }
    fetchPlans()
  }, [])

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">Loading plans...</div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center text-red-600">{error}</div>
      </section>
    )
  }

  const normalPlans = plans.filter(plan => plan.type === 'normal')
  const callPlans = plans.filter(plan => plan.type === 'call')

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-500 mb-4">Choose Your Plan</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Select the perfect plan that suits your matrimonial journey
          </p>
        </div>

        {/* Normal Subscription Plans */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-600 mb-2 flex items-center justify-center gap-2">
              <Heart className="w-6 h-6 text-rose-500" />
              Matrimonial Plans
            </h3>
            <p className="text-lg text-gray-500">Complete matrimonial packages for finding your perfect match</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {normalPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${plan.popular ? "border-rose-500 shadow-xl scale-105" : "border-gray-200"}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-rose-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-bold text-gray-500">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-rose-600 mb-2">
                    ₹{Number(plan.price).toFixed(2)}
                  </div>
                  <p className="text-gray-500 text-sm">
                    {plan.duration_months} {plan.duration_months === 1 ? "Month" : "Months"}
                  </p>
                  <p className="text-gray-500 text-sm">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {Array.isArray(plan.features) && plan.features.length > 0 ? (
                      plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-500 text-sm">{feature}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500 text-sm">No features available</li>
                    )}
                  </ul>
                  <Link href={`/register?planId=${plan.id}`} className="block">
                    <Button
                      className={`w-full mt-6 ${
                        plan.popular ? "bg-rose-600 hover:bg-rose-700" : "bg-gray-500 hover:bg-gray-600"
                      }`}
                    >
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call Plans */}
        {callPlans.length > 0 && (
          <div>
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-600 mb-2 flex items-center justify-center gap-2">
                <Phone className="w-6 h-6 text-blue-500" />
                Call Plans
              </h3>
              <p className="text-lg text-gray-500">Add-on plans to make voice calls with your matches</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {callPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative ${plan.popular ? "border-blue-500 shadow-xl scale-105" : "border-gray-200"}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Best Value
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl font-bold text-gray-500">{plan.name}</CardTitle>
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      ₹{Number(plan.price).toFixed(2)}
                    </div>
                    <div className="text-lg font-semibold text-blue-500 mb-1">
                      {plan.call_credits} Minutes
                    </div>
                    <p className="text-gray-500 text-sm">
                      {plan.duration_months} {plan.duration_months === 1 ? "Month" : "Months"}
                    </p>
                    <p className="text-gray-500">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {Array.isArray(plan.features) && plan.features.length > 0 ? (
                        plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center gap-3">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-gray-500">{feature}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500">No features available</li>
                      )}
                    </ul>
                    <Link href={`/register?planId=${plan.id}`} className="block">
                      <Button
                        className={`w-full mt-6 ${
                          plan.popular ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-500 hover:bg-gray-600"
                        }`}
                      >
                        Purchase Credits
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}