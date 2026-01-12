import React, { useState } from 'react';
import { Crown, PhoneCall, Check, X } from "lucide-react";
import { Plan } from "../../types/types";

interface PlansModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: Plan[];
  loadingPlans: boolean;
  onSelectPlan: (plan: Plan) => void;
}

export default function PlansModal({ open, onOpenChange, plans, loadingPlans, onSelectPlan }: PlansModalProps) {
  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Choose Your Perfect Plan
            </h2>
            <p className="text-gray-600 text-sm">Select a plan that suits your needs</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loadingPlans ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-3"></div>
              <p className="text-gray-600 text-sm">Loading plans...</p>
            </div>
          ) : (
            <PlansContent plans={plans} onSelectPlan={onSelectPlan} />
          )}
        </div>
      </div>
    </div>
  );
}

function PlansContent({ plans, onSelectPlan }: { plans: Plan[]; onSelectPlan: (plan: Plan) => void }) {
  const [activeTab, setActiveTab] = useState("normal");

  const normalPlans = plans.filter(plan => plan.type === "normal");
  const callPlans = plans.filter(plan => plan.type === "call");

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="flex mb-4 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("normal")}
          className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === "normal"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Premium Plans
        </button>
        <button
          onClick={() => setActiveTab("call")}
          className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === "call"
              ? "bg-white text-green-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Call Plans
        </button>
      </div>

      {/* Premium Plans */}
      {activeTab === "normal" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {normalPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSelect={onSelectPlan}
              type="premium"
            />
          ))}
        </div>
      )}

      {/* Call Plans */}
      {activeTab === "call" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {callPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSelect={onSelectPlan}
              type="call"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PlanCard({ plan, onSelect, type }: { plan: Plan; onSelect: (plan: Plan) => void; type: "premium" | "call" }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Header */}
      <div className="p-4 text-center border-b bg-gray-50">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
          type === "premium" ? "bg-blue-100" : "bg-green-100"
        }`}>
          {type === "premium" ? (
            <Crown className={`h-6 w-6 ${type === "premium" ? "text-blue-600" : "text-green-600"}`} />
          ) : (
            <PhoneCall className="h-6 w-6 text-green-600" />
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {plan.name}
        </h3>
        <div className={`text-2xl font-bold mb-1 ${
          type === "premium" ? "text-blue-600" : "text-green-600"
        }`}>
          ₹{plan.price}
        </div>
        <div className="text-xs text-gray-500">
          {type === "premium" 
            ? (plan.duration_months ? `${plan.duration_months} month${plan.duration_months > 1 ? 's' : ''}` : 'Unlimited')
            : (plan.call_credits ? `${plan.call_credits} call credits` : 'Call credits included')
          }
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-gray-600 text-center mb-4 text-sm">
          {plan.description}
        </p>

        {/* Features */}
        <div className="space-y-2 mb-4">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="h-2.5 w-2.5 text-green-600" />
              </div>
              <span className="text-xs text-gray-700 leading-relaxed">
                {feature}
              </span>
            </div>
          ))}
        </div>

        {/* Button */}
        <button
          onClick={() => onSelect(plan)}
          className={`w-full py-2.5 px-3 rounded-lg text-white font-semibold transition-colors text-sm ${
            type === "premium"
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {type === "premium" ? "Select Plan" : "Buy Credits"}
        </button>
      </div>
    </div>
  );
}