"use client";
import React, { useState, useEffect } from "react";
import { Menu, ChevronDown, X, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import Sidebar from "../../components/sidebarm";

// Type definitions
interface Machine {
  id: number;
  name: string;
  status: string;
  location?: string;
  description?: string;
}

interface Job {
  id: number;
  machine: {
    id: number;
    name: string;
    status: string;
  };
  product: {
    id: number;
    name: string;
    description?: string;
  };
  operator?: {
    id: number;
    username?: string;
    phone: string;
  };
  quantity: number;
  status: string;
  stage: string;
  createdAt: string;
  totalCost: number;
}

type ViewType = "machine" | "product" | "details";
type FilterType = "Machine/Process No" | "Product Type";

interface CustomDropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export default function WorkPanelInterface() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<ViewType>("machine");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("Machine/Process No");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>("");
  
  // Data state
  const [machines, setMachines] = useState<Machine[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  const filterOptions: FilterType[] = ["Machine/Process No", "Product Type"];

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        fetchData(true); // Silent refresh
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loading, refreshing]);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      // Fetch machines
      const machinesResponse = await fetch('/api/machines');
      if (!machinesResponse.ok) {
        throw new Error('Failed to fetch machines');
      }
      const machinesData = await machinesResponse.json();
      setMachines(machinesData.machines);

      // Fetch jobs
      const jobsResponse = await fetch('/api/jobs');
      if (!jobsResponse.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const jobsData = await jobsResponse.json();
      setJobs(jobsData.jobs);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      if (!silent) {
        setError('Failed to load data. Please refresh the page.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleMenuClick = (): void => {
    setSidebarOpen(true);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "ON":
        return "text-green-600";
      case "OFF":
        return "text-gray-500";
      case "MAINTENANCE":
        return "text-orange-600";
      case "IDLE":
        return "text-yellow-600";
      default:
        return "text-gray-500";
    }
  };

  const getStatusDotColor = (status: string): string => {
    switch (status) {
      case "ON":
        return "bg-green-500";
      case "OFF":
        return "bg-gray-400";
      case "MAINTENANCE":
        return "bg-orange-500";
      case "IDLE":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  const getJobStatusColor = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500';
      case 'IN_PROGRESS':
        return 'bg-blue-500';
      case 'FINISHED':
        return 'bg-green-500';
      case 'DISPATCHED':
        return 'bg-purple-500';
      case 'COMPLETED':
        return 'bg-green-600';
      default:
        return 'bg-gray-400';
    }
  };

  const getJobStatusText = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'FINISHED':
        return 'Finished';
      case 'DISPATCHED':
        return 'Dispatched';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  };

  const handleMachineClick = (machine: Machine): void => {
    console.log("Machine clicked:", machine);
  };

  const handleSeeDetails = (job: Job): void => {
    setSelectedJob(job);
    setCurrentView("details");
  };

  const handleClose = (): void => {
    setCurrentView(selectedFilter === "Product Type" ? "product" : "machine");
    setSelectedJob(null);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const CustomDropdown = ({
    label,
    value,
    options,
    onChange,
  }: CustomDropdownProps) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    return (
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-3 text-sm">
          {label}
        </label>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <span className="text-gray-700 text-sm">{value}</span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700 text-sm first:rounded-t-lg last:rounded-b-lg transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading work panel...</p>
        </div>
      </div>
    );
  }

  const renderMachineView = () => (
    <div className="space-y-4">
      {machines.map((machine) => (
        <button
          key={machine.id}
          onClick={() => handleMachineClick(machine)}
          className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div
                className={`w-3 h-3 rounded-full ${getStatusDotColor(
                  machine.status
                )}`}
              ></div>
            </div>
            <div className="flex-1">
              <h3 className="text-gray-900 font-medium text-base mb-1">
                {machine.name}
              </h3>
              <p
                className={`text-sm font-medium ${getStatusColor(
                  machine.status
                )}`}
              >
                {machine.status}
              </p>
              {machine.location && (
                <p className="text-sm text-gray-500 mt-1">
                  Location: {machine.location}
                </p>
              )}
            </div>
          </div>
        </button>
      ))}

      {/* Status Overview */}
      <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-gray-800 font-medium mb-6">Status Overview</h3>
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {machines.filter((m) => m.status === "ON").length}
            </div>
            <div className="text-sm text-gray-600 flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Online
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-500 mb-2">
              {machines.filter((m) => m.status === "OFF").length}
            </div>
            <div className="text-sm text-gray-600 flex items-center justify-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
              Offline
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProductView = () => (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${getJobStatusColor(job.status)}`}></div>
              <div>
                <h3 className="text-gray-900 font-medium text-base mb-1">
                  {job.product.name}
                </h3>
                <p className="text-sm text-gray-500">Machine: {job.machine.name}</p>
                <p className="text-sm text-gray-500">Quantity: {job.quantity}</p>
                <p className="text-sm text-gray-500">Status: {getJobStatusText(job.status)}</p>
              </div>
            </div>
            <button
              onClick={() => handleSeeDetails(job)}
              className="px-4 py-2 bg-black text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
            >
              See Details
            </button>
          </div>
        </div>
      ))}

      {jobs.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">📦</span>
          </div>
          <h3 className="text-gray-500 font-medium mb-2">
            No jobs found
          </h3>
          <p className="text-gray-400 text-sm">
            Add jobs to see them listed here
          </p>
        </div>
      )}
    </div>
  );

  const renderDetailsView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className={`w-3 h-3 rounded-full ${getJobStatusColor(selectedJob?.status || '')}`}></div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedJob?.product.name}
          </h1>
        </div>
        <button
          onClick={handleClose}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          <span>Close</span>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Created Date
          </label>
          <div className="text-gray-900 text-lg">{selectedJob && formatDate(selectedJob.createdAt)}</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Machine
          </label>
          <div className="text-gray-900 text-lg">
            {selectedJob?.machine.name} ({selectedJob?.machine.status})
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <div className="text-gray-900 text-lg">
            {selectedJob?.quantity} units
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            {selectedJob && getJobStatusText(selectedJob.status)}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stage
          </label>
          <div className="text-gray-900 text-lg">
            {selectedJob?.stage}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Cost
          </label>
          <div className="text-gray-900 text-lg">
            {selectedJob && formatCurrency(selectedJob.totalCost)}
          </div>
        </div>

        {selectedJob?.operator && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Operator
            </label>
            <div className="text-gray-900 text-lg">
              {selectedJob.operator.username || selectedJob.operator.phone}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Progress
          </label>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full"
              style={{ 
                width: selectedJob?.status === 'COMPLETED' ? '100%' : 
                       selectedJob?.status === 'FINISHED' ? '90%' :
                       selectedJob?.status === 'IN_PROGRESS' ? '60%' :
                       selectedJob?.status === 'PENDING' ? '20%' : '10%'
              }}
            ></div>
          </div>
          <div className="text-sm text-gray-600 mt-2">
            {selectedJob?.status === 'COMPLETED' ? '100% Complete' :
             selectedJob?.status === 'FINISHED' ? '90% Complete' :
             selectedJob?.status === 'IN_PROGRESS' ? '60% Complete' :
             selectedJob?.status === 'PENDING' ? '20% Complete' : '10% Complete'}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (currentView === "details") return renderDetailsView();
    if (selectedFilter === "Product Type") return renderProductView();
    return renderMachineView();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Use your existing Sidebar Component */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <header className="bg-white px-6 py-4 flex items-center justify-between">
        <button
          onClick={handleMenuClick}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-blue-700" />
        </button>

        <h1 className="text-xl font-semibold text-blue-700">Work Panel</h1>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 text-blue-700 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-lg">A</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Auto-refresh indicator */}
          {refreshing && (
            <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-center text-blue-700 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Refreshing data...
              </div>
            </div>
          )}

          <CustomDropdown
            label="Select By"
            value={selectedFilter}
            options={filterOptions}
            onChange={(value) => {
              setSelectedFilter(value as FilterType);
              if (currentView !== "details") {
                setCurrentView(
                  value === "Product Type" ? "product" : "machine"
                );
              }
            }}
          />
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
