"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  CreditCard, Plus, Edit2, Trash2, Loader2, DollarSign,
  Calendar, CheckCircle, XCircle, Save, X, Phone, Users
} from "lucide-react"

interface Plan {
  id: number
  name: string
  price: number
  duration_months: number
  call_credits?: number
  features: string
  description: string
  type: 'normal' | 'call'
  can_view_details: boolean
  can_make_calls: boolean
  is_active: boolean
  created_at: string
  updated_at?: string
}

interface FormData {
  name: string
  price: string
  duration_months: string
  call_credits: string
  features: string
  description: string
  type: 'normal' | 'call'
  can_view_details: boolean
  can_make_calls: boolean
  is_active: boolean
}

export default function AdminPlansManagement() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [dialog, setDialog] = useState<{
    open: boolean
    type: 'create' | 'edit' | 'delete' | null
    plan?: Plan
  }>({ open: false, type: null })

  const [formData, setFormData] = useState<FormData>({
    name: "",
    price: "",
    duration_months: "",
    call_credits: "",
    features: "",
    description: "",
    type: 'normal',
    can_view_details: true,
    can_make_calls: false,
    is_active: true
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/plans`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      } else {
        setMessage({ type: 'error', text: 'Failed to load plans' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error while fetching plans' })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      duration_months: "",
      call_credits: "",
      features: "",
      description: "",
      type: 'normal',
      can_view_details: true,
      can_make_calls: false,
      is_active: true
    })
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (message) setMessage(null)
  }

  const handlePlanTypeChange = (value: 'normal' | 'call') => {
    setFormData(prev => ({
      ...prev,
      type: value,
      can_view_details: value === 'normal' ? true : false,
      can_make_calls: value === 'call' ? true : false
    }))
  }

  const openDialog = (type: 'create' | 'edit' | 'delete', plan?: Plan) => {
    if (type === 'edit' && plan) {
      setFormData({
        name: plan.name,
        price: plan.price.toString(),
        duration_months: plan.duration_months.toString(),
        call_credits: plan.call_credits?.toString() || "",
        features: plan.features || "",
        description: plan.description || "",
        type: plan.type,
        can_view_details: plan.can_view_details,
        can_make_calls: plan.can_make_calls,
        is_active: plan.is_active
      })
    } else {
      resetForm()
    }
    setDialog({ open: true, type, plan })
  }

  const closeDialog = () => {
    setDialog({ open: false, type: null })
    resetForm()
    setMessage(null)
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Plan name is required' })
      return false
    }

    const price = parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      setMessage({ type: 'error', text: 'Valid price is required' })
      return false
    }

    const duration = parseInt(formData.duration_months)
    if (isNaN(duration) || duration <= 0) {
      setMessage({ type: 'error', text: 'Valid duration in months is required' })
      return false
    }

    // Validate call credits for call plans
    if (formData.type === 'call') {
      const callCredits = parseInt(formData.call_credits)
      if (isNaN(callCredits) || callCredits <= 0) {
        setMessage({ type: 'error', text: 'Valid call credits are required for call plans' })
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      const token = localStorage.getItem("token")
      const url = dialog.type === 'edit'
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/plans/${dialog.plan?.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/plans`

      const method = dialog.type === 'edit' ? 'PUT' : 'POST'

      const requestData: {
        name: string
        price: number
        duration_months: number
        features: string | null
        description: string | null
        type: 'normal' | 'call'
        can_view_details: boolean
        can_make_calls: boolean
        is_active: boolean
        call_credits?: number
      } = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        duration_months: parseInt(formData.duration_months),
        features: formData.features.trim() || null,
        description: formData.description.trim() || null,
        type: formData.type,
        can_view_details: formData.can_view_details,
        can_make_calls: formData.can_make_calls,
        is_active: formData.is_active
      }

      // Add call_credits only for call plans
      if (formData.type === 'call') {
        requestData.call_credits = parseInt(formData.call_credits)
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        await fetchPlans()
        closeDialog()
        setMessage({
          type: 'success',
          text: `Plan ${dialog.type === 'edit' ? 'updated' : 'created'} successfully`
        })
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Operation failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!dialog.plan) return

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/plans/${dialog.plan.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        await fetchPlans()
        closeDialog()
        setMessage({ type: 'success', text: 'Plan deleted successfully' })
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to delete plan' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePlanStatus = async (planId: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/plans/${planId}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      })

      if (response.ok) {
        await fetchPlans()
        setMessage({
          type: 'success',
          text: `Plan ${!currentStatus ? 'activated' : 'deactivated'} successfully`
        })
      } else {
        setMessage({ type: 'error', text: 'Failed to update plan status' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    }
  }

  if (loading) {
    return (
      <Card className="mx-auto w-full max-w-7xl">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
       <Card>
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                Plans Management
              </CardTitle>
              <CardDescription className="text-sm">Create, edit, and manage subscription plans</CardDescription>
            </div>
            <Button onClick={() => openDialog('create')} className="w-full sm:w-auto" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:hidden">Add Plan</span>
              <span className="hidden sm:inline">Add New Plan</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-4 sm:mb-6">
              <AlertDescription className="text-sm">{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3 sm:space-y-4">
            {plans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm sm:text-base">No plans found. Create your first plan to get started.</p>
              </div>
            ) : (
              plans.map((plan) => (
                <div
                  key={plan.id}
                  className="border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Mobile Layout */}
                  <div className="block sm:hidden p-3">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-base font-semibold truncate">{plan.name}</h3>
                          <Badge variant={plan.type === 'call' ? 'default' : 'secondary'} className="text-xs">
                            {plan.type === 'call' ? (
                              <>
                                <Phone className="h-3 w-3 mr-1" />
                                Call Plan
                              </>
                            ) : (
                              <>
                                <Users className="h-3 w-3 mr-1" />
                                Normal Plan
                              </>
                            )}
                          </Badge>
                          <Badge variant={plan.is_active ? 'default' : 'secondary'} className="text-xs">
                            {plan.is_active ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span className="font-medium">₹{plan.price}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}</span>
                          </div>
                          {plan.type === 'call' && plan.call_credits && (
                            <>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{plan.call_credits} credits</span>
                              </div>
                            </>
                          )}
                        </div>

                        {plan.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{plan.description}</p>
                        )}

                        {plan.features && (
                          <div className="text-xs text-gray-500 mb-2">
                            <strong>Features:</strong> <span className="line-clamp-1">{plan.features}</span>
                          </div>
                        )}

                        <div className="text-xs text-gray-400">
                          Created: {new Date(plan.created_at).toLocaleDateString()}
                          {plan.updated_at && (
                            <span className="block">
                              Updated: {new Date(plan.updated_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mobile Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={plan.is_active}
                          onCheckedChange={() => togglePlanStatus(plan.id, plan.is_active)}
                        />
                        <span className="text-xs text-gray-500">
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDialog('edit', plan)}
                          className="text-xs"
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDialog('delete', plan)}
                          className="text-red-600 hover:text-red-700 text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-center justify-between p-4 sm:p-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{plan.name}</h3>
                        <Badge variant={plan.type === 'call' ? 'default' : 'secondary'}>
                          {plan.type === 'call' ? (
                            <>
                              <Phone className="h-3 w-3 mr-1" />
                              Call Plan
                            </>
                          ) : (
                            <>
                              <Users className="h-3 w-3 mr-1" />
                              Normal Plan
                            </>
                          )}
                        </Badge>
                        <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                          {plan.is_active ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">₹{plan.price}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}</span>
                        </div>
                        {plan.type === 'call' && plan.call_credits && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span>{plan.call_credits} credits</span>
                          </div>
                        )}
                      </div>

                      {plan.description && (
                        <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                      )}

                      {plan.features && (
                        <div className="text-sm text-gray-500 mb-2">
                          <strong>Features:</strong> {plan.features}
                        </div>
                      )}

                      <div className="text-xs text-gray-400">
                        Created: {new Date(plan.created_at).toLocaleDateString()}
                        {plan.updated_at && (
                          <span className="ml-4">
                            Updated: {new Date(plan.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Desktop Actions */}
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={plan.is_active}
                          onCheckedChange={() => togglePlanStatus(plan.id, plan.is_active)}
                        />
                        <span className="text-sm text-gray-500 hidden lg:inline">
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog('edit', plan)}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        <span className="hidden lg:inline">Edit</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog('delete', plan)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        <span className="hidden lg:inline">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog - Responsive */}
      <Dialog open={dialog.open && (dialog.type === 'create' || dialog.type === 'edit')} onOpenChange={closeDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {dialog.type === 'create' ? 'Create New Plan' : 'Edit Plan'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {dialog.type === 'create'
                ? 'Create a new subscription plan for users'
                : 'Update the selected plan details'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {message && (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                <AlertDescription className="text-sm">{message.text}</AlertDescription>
              </Alert>
            )}

            {/* Plan Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Plan Type *</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={handlePlanTypeChange}
                disabled={isSubmitting}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal" className="flex items-center gap-2 cursor-pointer">
                    <Users className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium">Normal Plan</div>
                      <div className="text-xs text-gray-500">Profile viewing and matching</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50">
                  <RadioGroupItem value="call" id="call" />
                  <Label htmlFor="call" className="flex items-center gap-2 cursor-pointer">
                    <Phone className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="font-medium">Call Plan</div>
                      <div className="text-xs text-gray-500">Voice calling with credits</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan-name" className="text-sm">Plan Name *</Label>
                <Input
                  id="plan-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Premium Plan"
                  required
                  disabled={isSubmitting}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-price" className="text-sm">Price (₹) *</Label>
                <Input
                  id="plan-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="e.g., 999"
                  required
                  disabled={isSubmitting}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-duration" className="text-sm">Duration (Months) *</Label>
                <Input
                  id="plan-duration"
                  type="number"
                  min="1"
                  value={formData.duration_months}
                  onChange={(e) => handleInputChange("duration_months", e.target.value)}
                  placeholder="e.g., 6"
                  required
                  disabled={isSubmitting}
                  className="text-sm"
                />
              </div>

              {/* Call Credits field - only shown for call plans */}
              {formData.type === 'call' && (
                <div className="space-y-2">
                  <Label htmlFor="call-credits" className="text-sm">Call Credits *</Label>
                  <Input
                    id="call-credits"
                    type="number"
                    min="1"
                    value={formData.call_credits}
                    onChange={(e) => handleInputChange("call_credits", e.target.value)}
                    placeholder="e.g., 150"
                    required={formData.type === 'call'}
                    disabled={isSubmitting}
                    className="text-sm"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="plan-status" className="text-sm">Status</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="plan-status"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                    disabled={isSubmitting}
                  />
                  <span className="text-sm">
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Plan Features */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Plan Features</Label>
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.can_view_details}
                    onCheckedChange={(checked) => handleInputChange("can_view_details", checked)}
                    disabled={isSubmitting}
                  />
                  <Label className="text-sm">Can View Details</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.can_make_calls}
                    onCheckedChange={(checked) => handleInputChange("can_make_calls", checked)}
                    disabled={isSubmitting}
                  />
                  <Label className="text-sm">Can Make Calls</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-features" className="text-sm">Features Description</Label>
              <Textarea
                id="plan-features"
                value={formData.features}
                onChange={(e) => handleInputChange("features", e.target.value)}
                placeholder="List of features included in this plan..."
                disabled={isSubmitting}
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-description" className="text-sm">Description</Label>
              <Textarea
                id="plan-description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Brief description of the plan..."
                disabled={isSubmitting}
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isSubmitting}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {dialog.type === 'create' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {dialog.type === 'create' ? 'Create Plan' : 'Update Plan'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Responsive */}
      <Dialog open={dialog.open && dialog.type === 'delete'} onOpenChange={closeDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Delete Plan</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to delete this plan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {dialog.plan && (
            <div className="p-3 sm:p-4 bg-red-50 rounded-lg">
              <h3 className="font-medium text-red-900 text-sm sm:text-base">{dialog.plan.name}</h3>
              <p className="text-xs sm:text-sm text-red-700">
                ₹{dialog.plan.price} for {dialog.plan.duration_months} month{dialog.plan.duration_months > 1 ? 's' : ''}
                {dialog.plan.type === 'call' && dialog.plan.call_credits && (
                  <span> • {dialog.plan.call_credits} credits</span>
                )}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={isSubmitting}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Plan
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
