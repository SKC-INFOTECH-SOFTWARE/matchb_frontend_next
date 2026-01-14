"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, Star, Phone, Heart } from "lucide-react"
import { Header } from "@/components/header"

interface Plan {
  id: number
  name: string
  price: number | string
  duration_months: number
  features: string[] | null
  description: string | null
  type: 'normal' | 'call'
  call_credits?: number | null
  popular?: boolean
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/plans`)
        if (!response.ok) {
          throw new Error("Failed to fetch plans")
        }
        const data = await response.json()
        const formattedPlans: Plan[] = data.plans.map((plan: any) => {
          let features: string[] | null = null
          if (plan.features && typeof plan.features === "string") {
            features = plan.features
              .split(",")
              .map((feature: string) => feature.trim())
              .filter((feature: string) => feature !== "")

          } else if (Array.isArray(plan.features)) {
            features = plan.features.length > 0 ? plan.features : null
          }
          const price = parseFloat(String(plan.price))
          return {
            id: plan.id,
            name: plan.name,
            price: isNaN(price) ? 0 : price,
            duration_months: plan.duration_months,
            features,
            description: plan.description || "No description available",
            type: plan.type || 'normal',
            call_credits: plan.call_credits || null,
            popular: plan.name.toLowerCase().includes("premium") || plan.name.toLowerCase().includes("standard"),
          }
        })
        setPlans(formattedPlans)
        setLoading(false)
      } catch (err) {
        setError("Failed to load plans. Please try again later.")
        setLoading(false)
      }
    }
    fetchPlans()
  }, [])


  const handleChoosePlan = (planId: number) => {
    router.push(`/login/user?planId=${planId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xl text-gray-600">Loading plans...</p>
          </div>
        </section>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xl text-red-600">{error}</p>
          </div>
        </section>
      </div>
    )
  }

  const normalPlans = plans.filter(plan => plan.type === 'normal')
  const callPlans = plans.filter(plan => plan.type === 'call')

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      <Header />
      <div className="pt-16">
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Choose Your <span className="text-rose-600">Perfect Plan</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Select the plan that best suits your needs and start your journey to find your life partner
            </p>
          </div>
        </section>

        {/* Normal Matrimonial Plans */}
        {normalPlans.length > 0 && (
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
                  <Heart className="w-8 h-8 text-rose-500" />
                  Matrimonial Plans
                </h2>
                <p className="text-lg text-gray-600">Complete packages for your matrimonial journey</p>
              </div>

              <div className="grid md:grid-cols-4 gap-8">
                {normalPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                      plan.popular ? "ring-2 ring-rose-600 scale-105" : ""
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="bg-rose-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          Most Popular
                        </div>
                      </div>
                    )}

                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <div className="text-4xl font-bold text-rose-600 mb-1">
                        ₹{Number(plan.price).toFixed(2)}
                      </div>
                      <div className="text-gray-600">
                        {plan.duration_months} {plan.duration_months === 1 ? "Month" : "Months"}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
                    </div>

                    <ul className="space-y-4 mb-8">
                      {Array.isArray(plan.features) && plan.features.length > 0 ? (
                        plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center">
                            <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))
                      ) : (
                        <li className="flex items-center">
                          <span className="text-gray-700">No features available</span>
                        </li>
                      )}
                    </ul>

                    <button
                      onClick={() => handleChoosePlan(plan.id)}
                      className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                        plan.popular
                          ? "bg-rose-600 text-white hover:bg-rose-700"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                      Choose {plan.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Call Plans */}
        {callPlans.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
                  <Phone className="w-8 h-8 text-blue-500" />
                  Call Plans
                </h2>
                <p className="text-lg text-gray-600">Add-on plans to make voice calls with your matches</p>
              </div>

              <div className="grid md:grid-cols-4 gap-8">
                {callPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-2xl shadow-lg p-8 border ${
                      plan.popular ? "ring-2 ring-blue-600 scale-105 border-blue-200" : "border-gray-200"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          Best Value
                        </div>
                      </div>
                    )}

                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <div className="text-4xl font-bold text-blue-600 mb-1">
                        ₹{Number(plan.price).toFixed(2)}
                      </div>
                      <div className="text-lg font-semibold text-blue-500 mb-2">
                        {plan.call_credits} Minutes
                      </div>
                      <div className="text-gray-600">
                        {plan.duration_months} {plan.duration_months === 1 ? "Month" : "Months"}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
                    </div>

                    <ul className="space-y-4 mb-8">
                      {Array.isArray(plan.features) && plan.features.length > 0 ? (
                        plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center">
                            <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))
                      ) : (
                        <li className="flex items-center">
                          <span className="text-gray-700">No features available</span>
                        </li>
                      )}
                    </ul>

                    <button
                      onClick={() => handleChoosePlan(plan.id)}
                      className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                        plan.popular
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                      Purchase Credits
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I upgrade my plan anytime?</h3>
                <p className="text-gray-600">
                  Yes, you can upgrade your plan at any time. The remaining amount will be adjusted in your new plan.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How do Call Plans work?</h3>
                <p className="text-gray-600">
                  Call Plans are add-on credits that allow you to make voice calls with your matches while keeping your phone number private. Purchase credits and start calling!
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Is there a refund policy?</h3>
                <p className="text-gray-600">
                  We offer a 7-day money-back guarantee if you're not satisfied with our service.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Are all profiles verified?</h3>
                <p className="text-gray-600">
                  Yes, all profiles go through our verification process to ensure authenticity and safety.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
