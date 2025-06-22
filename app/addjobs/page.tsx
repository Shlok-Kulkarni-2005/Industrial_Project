"use client";
import React, { useState, useEffect } from "react";
import { Menu, ChevronDown, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/sidebar";

// Type definitions
interface Machine {
  id: number;
  name: string;
  status: string;
  location?: string;
  description?: string;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  costPerUnit: number;
}

interface Operator {
  id: number;
  username?: string;
  phone: string;
}

interface JobData {
  machineId: number;
  productId: number;
  operatorId?: number;
  quantity: number;
}

interface CustomDropdownProps {
  label: string;
  value: string;
  options: Array<{ id: number; name: string; [key: string]: any }>;
  onChange: (id: number) => void;
  disabled?: boolean;
  error?: string;
  displayKey?: string;
}

const username = "Operator";

// Custom Dropdown Component
const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  value,
  options,
  onChange,
  disabled = false,
  error,
  displayKey = "name"
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleOptionClick = (option: any): void => {
    onChange(option.id);
    setIsOpen(false);
  };

  const handleToggle = (): void => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const selectedOption = options.find(option => option.id.toString() === value);

  return (
    <div className="mb-6">
      <label className="block text-gray-700 font-medium mb-2">{label}</label>
      <div className="relative">
        <button
          onClick={handleToggle}
          disabled={disabled}
          className={`w-full bg-white border rounded-lg px-4 py-3 text-left flex items-center justify-between transition-colors ${
            error 
              ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="text-gray-700">
            {selectedOption ? selectedOption[displayKey] : `Select ${label.toLowerCase()}`}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {error}
          </p>
        )}

        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-sm">
                No options available
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 text-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors"
                >
                  <div className="font-medium">{option[displayKey]}</div>
                  {option.description && (
                    <div className="text-sm text-gray-500">{option.description}</div>
                  )}
                  {option.status && (
                    <div className="text-sm text-gray-500">Status: {option.status}</div>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function AddJobsForm() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  
  // Form state
  const [selectedMachineId, setSelectedMachineId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  
  // Form validation
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const router = useRouter();

  // Fetch form data on component mount
  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/add-job');
      
      if (!response.ok) {
        throw new Error('Failed to fetch form data');
      }
      
      const data = await response.json();
      setMachines(data.machines);
      setProducts(data.products);
      setOperators(data.operators);
    } catch (error) {
      console.error('Error fetching form data:', error);
      setError('Failed to load form data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!selectedMachineId) {
      newErrors.machine = 'Please select a machine';
    }

    if (!selectedProductId) {
      newErrors.product = 'Please select a product';
    }

    if (!quantity || parseInt(quantity) <= 0) {
      newErrors.quantity = 'Please enter a valid quantity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddJob = async (): Promise<void> => {
    // Clear previous messages
    setError("");
    setSuccess("");

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const jobData: JobData = {
        machineId: parseInt(selectedMachineId),
        productId: parseInt(selectedProductId),
        operatorId: selectedOperatorId ? parseInt(selectedOperatorId) : undefined,
        quantity: parseInt(quantity)
      };

      const response = await fetch('/api/add-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add job');
      }

      setSuccess('Job added successfully!');
      
      // Reset form
      setSelectedMachineId("");
      setSelectedProductId("");
      setSelectedOperatorId("");
      setQuantity("1");
      setErrors({});

      // Redirect to product list after a short delay
      setTimeout(() => {
        router.push('/productlist');
      }, 2000);

    } catch (error) {
      console.error('Error adding job:', error);
      setError(error instanceof Error ? error.message : 'Failed to add job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMenuClick = (): void => {
    setSidebarOpen(true);
  };

  const handleCloseSidebar = (): void => {
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Component */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        username={username}
      />

      {/* Header */}
      <header className="bg-blue-700 shadow-sm px-4 py-4 flex items-center justify-between">
        <button
          onClick={handleMenuClick}
          className="p-2 hover:bg-blue-600 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>

        <h1 className="text-xl font-semibold text-white">Add Jobs</h1>

        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-lg">A</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="max-w-md mx-auto">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800">{success}</span>
              </div>
            </div>
          )}

          {/* Select Machine/Process */}
          <CustomDropdown
            label="Select Machine/Process"
            value={selectedMachineId}
            options={machines}
            onChange={(id) => setSelectedMachineId(id.toString())}
            error={errors.machine}
          />

          {/* Add Product */}
          <CustomDropdown
            label="Add Product"
            value={selectedProductId}
            options={products}
            onChange={(id) => setSelectedProductId(id.toString())}
            error={errors.product}
          />

          {/* Select Operator (Optional) */}
          <CustomDropdown
            label="Select Operator (Optional)"
            value={selectedOperatorId}
            options={operators}
            onChange={(id) => setSelectedOperatorId(id.toString())}
            displayKey="username"
          />

          {/* Quantity Input */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={`w-full bg-white border rounded-lg px-4 py-3 transition-colors ${
                errors.quantity 
                  ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Enter quantity"
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.quantity}
              </p>
            )}
          </div>

          {/* Add Button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={handleAddJob}
              disabled={submitting}
              className={`px-8 py-3 rounded-full font-medium transition-colors shadow-lg flex items-center ${
                submitting
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-white text-blue-700 hover:bg-blue-700 hover:text-white'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Job'
              )}
            </button>
          </div>

          {/* Info Section */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-blue-800 font-medium mb-2">Important Notes:</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Only machines with "ON" status can be selected</li>
              <li>• Jobs will be added to the Product List automatically</li>
              <li>• Product counts will be updated in real-time</li>
              <li>• Jobs will appear in the Manager's Work Panel</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
