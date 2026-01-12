import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Settings,
  Users,
  MapPin,
  CheckCircle,
  AlertCircle
} from "lucide-react";

// one record in the visibility settings table
interface SearchVisibilitySetting {
  id: number;
  state: string;
  gender: "Male" | "Female";
  visible_count: number;
  updated_at: string; // if backend returns Date objects, change to Date
}

// form state
interface FormData {
  state: string;
  gender: "" | "Male" | "Female";
  visible_count: string; // keep as string for the input
}

type MessageType = "success" | "error" | "";

interface MessageState {
  type: MessageType;
  text: string;
}

export default function AdminSearchVisibilityManager() {
  const [settings, setSettings] = useState<SearchVisibilitySetting[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<MessageState>({ type: "", text: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const [formData, setFormData] = useState<FormData>({
    state: "",
    gender: "",
    visible_count: ""
  });

  const indianStates: string[] = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Puducherry",
    "Chandigarh",
    "Andaman and Nicobar Islands",
    "Dadra and Nagar Haveli",
    "Daman and Diu",
    "Lakshadweep"
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async (): Promise<void> => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/search-visibility", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data: { settings?: SearchVisibilitySetting[] } =
          await response.json();
        setSettings(data.settings || []);
      } else {
        showMessage("error", "Failed to fetch settings");
      }
    } catch (error) {
      showMessage("error", "Error loading settings");
    }
    setLoading(false);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLButtonElement | HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (!formData.state || !formData.gender || formData.visible_count === "") {
      showMessage("error", "Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/search-visibility", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          state: formData.state,
          gender: formData.gender,
          visible_count: parseInt(formData.visible_count, 10)
        })
      });

      if (response.ok) {
        showMessage("success", "Setting saved successfully");
        fetchSettings();
        resetForm();
      } else {
        const errorRes: { error?: string } = await response.json();
        showMessage("error", errorRes.error || "Failed to save setting");
      }
    } catch (error) {
      showMessage("error", "Error saving setting");
    }
    setLoading(false);
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this setting?")) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/admin/search-visibility?id=${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        showMessage("success", "Setting deleted successfully");
        fetchSettings();
      } else {
        showMessage("error", "Failed to delete setting");
      }
    } catch (error) {
      showMessage("error", "Error deleting setting");
    }
    setLoading(false);
  };

  const handleEdit = (setting: SearchVisibilitySetting): void => {
    setFormData({
      state: setting.state,
      gender: setting.gender,
      visible_count: setting.visible_count.toString()
    });
    setEditingId(setting.id);
    setShowAddForm(true);
  };

  const resetForm = (): void => {
    setFormData({ state: "", gender: "", visible_count: "" });
    setEditingId(null);
    setShowAddForm(false);
  };

  const showMessage = (type: MessageType, text: string): void => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  return (
    <div className="min-h-scree p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">
                Search Visibility Manager
              </h1>
              <p className="text-gray-600">
                Control how many profiles users can see by state and gender
              </p>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {message.text && (
          <Alert
            className={`mb-6 ${
              message.type === "success"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription
              className={
                message.type === "success" ? "text-green-700" : "text-red-700"
              }
            >
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="mb-6 border-2 border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  {editingId ? "Edit Setting" : "Add New Setting"}
                </span>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center text-gray-700">
                      <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                      State
                    </Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) =>
                        setFormData({ ...formData, state: value })
                      }
                      disabled={loading}
                    >
                      <SelectTrigger className="h-11 bg-white">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {indianStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center text-gray-700">
                      <Users className="h-4 w-4 mr-2 text-purple-500" />
                      Gender
                    </Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value: "Male" | "Female") =>
                        setFormData({ ...formData, gender: value })
                      }
                      disabled={loading}
                    >
                      <SelectTrigger className="h-11 bg-white">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center text-gray-700">
                      <Settings className="h-4 w-4 mr-2 text-green-500" />
                      Visible Count
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Enter count"
                      value={formData.visible_count}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          visible_count: e.target.value
                        })
                      }
                      disabled={loading}
                      className="h-11 bg-white"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingId ? "Update" : "Add"} Setting
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Button */}
        {!showAddForm && (
          <div className="mb-6">
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Setting
            </Button>
          </div>
        )}

        {/* Settings Table */}
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Current Settings ({settings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading && settings.length === 0 ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">Loading settings...</p>
              </div>
            ) : settings.length === 0 ? (
              <div className="p-12 text-center">
                <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Settings Found
                </h3>
                <p className="text-gray-600">
                  Click "Add New Setting" to create your first visibility rule
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  <div className="bg-slate-50 border-b border-slate-200">
                    <div className="grid grid-cols-5 gap-4 p-4 font-semibold text-sm text-gray-700">
                      <div>State</div>
                      <div>Gender</div>
                      <div>Visible Count</div>
                      <div>Last Updated</div>
                      <div className="text-right">Actions</div>
                    </div>
                  </div>
                  <div>
                    {settings.map((setting) => (
                      <div
                        key={setting.id}
                        className="grid grid-cols-5 gap-4 p-4 border-b border-slate-100 hover:bg-blue-50/50 items-center"
                      >
                        <div className="flex items-center font-medium">
                          <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                          {setting.state}
                        </div>
                        <div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              setting.gender === "Male"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-pink-100 text-pink-700"
                            }`}
                          >
                            {setting.gender}
                          </span>
                        </div>
                        <div>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            {setting.visible_count} profiles
                          </span>
                        </div>
                        <div className="text-gray-600 text-sm">
                          {new Date(setting.updated_at).toLocaleString()}
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(setting)}
                            disabled={loading}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(setting.id)}
                            disabled={loading}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-blue-600" />
              How it works
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>
                  Users must select both <strong>State</strong> and{" "}
                  <strong>Gender</strong> to search for profiles
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>
                  Only the configured number of profiles will be visible to
                  users for each state-gender combination
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>
                  If no setting exists for a combination, users will see 0
                  profiles
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>
                  You can set the visible count to 0 to temporarily hide
                  profiles for a specific state-gender
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
