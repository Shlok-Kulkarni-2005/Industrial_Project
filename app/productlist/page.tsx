"use client";
import React, { useState, useEffect } from "react";
import { Menu, Clock, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import Sidebar from "../../components/sidebar";

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
}

export default function ProductListPage(): React.ReactElement {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>("");

  const username = "Operator";

  const handleMenuClick = (): void => {
    setSidebarOpen(true);
  };

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  // Fetch jobs data on component mount
  useEffect(() => {
    fetchJobs();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchJobs, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs');
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const data = await response.json();
      setJobs(data.jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to load jobs. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (job: Job): void => {
    console.log("Job clicked:", job);
    // Navigate to job details or perform action
  };

  const getStatusColor = (status: string): string => {
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

  const getStatusText = (status: string): string => {
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Component */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        username={username}
      />

      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-4 flex items-center justify-between">
        <button
          onClick={handleMenuClick}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-blue-700" />
        </button>

        <h1 className="text-xl font-semibold text-blue-700">Product List</h1>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-blue-700 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-lg">A</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <div className="max-w-md mx-auto">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Real-time Machine Status */}
          {jobs.length > 0 && (
            <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Current Machine Status</h3>
              <div className="grid grid-cols-2 gap-3">
                {Array.from(new Set(jobs.map(j => j.machine.name))).map(machineName => {
                  const machineJobs = jobs.filter(j => j.machine.name === machineName);
                  const activeJobs = machineJobs.filter(j => j.status === 'IN_PROGRESS');
                  const isOnline = machineJobs.some(j => j.machine.status === 'ON');
                  const currentProduct = activeJobs.length > 0 ? activeJobs[0].product.name : 'Idle';
                  
                  return (
                    <div key={machineName} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{machineName}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isOnline ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {activeJobs.length > 0 ? (
                          <span className="text-blue-600 font-medium">Processing: {currentProduct}</span>
                        ) : (
                          <span className="text-gray-500">Idle</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Product List */}
          <div className="space-y-3">
            {jobs.map((job: Job) => (
              <button
                key={job.id}
                onClick={() => handleProductClick(job)}
                className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all text-left"
              >
                <div className="flex items-center space-x-3">
                  {/* Status Icon */}
                  <div className="w-6 h-6 border-2 border-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className={`w-2 h-2 ${getStatusColor(job.status)} rounded-full`}></div>
                  </div>

                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 font-medium text-base mb-1">
                      {job.product.name}
                    </h3>
                    <div className="flex items-center space-x-1 mb-1">
                      <span className="text-gray-500 text-sm">Machine:</span>
                      <span className="text-gray-600 text-sm font-medium">
                        {job.machine.name}
                      </span>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        job.machine.status === 'ON' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {job.machine.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 mb-1">
                      <span className="text-gray-500 text-sm">Quantity:</span>
                      <span className="text-gray-600 text-sm font-medium">
                        {job.quantity}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-500 text-sm">Status:</span>
                      <span className={`text-sm font-medium ${
                        job.status === 'IN_PROGRESS' ? 'text-blue-600' :
                        job.status === 'COMPLETED' ? 'text-green-600' :
                        job.status === 'PENDING' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {getStatusText(job.status)}
                      </span>
                    </div>
                  </div>

                  {/* Date and Process Icon */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-gray-500 mb-1">
                      {formatDate(job.createdAt)}
                    </div>
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Empty State (if no jobs) */}
          {jobs.length === 0 && !error && (
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

          {/* Summary Stats */}
          {jobs.length > 0 && (
            <div className="mt-8 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {jobs.length}
                </div>
                <div className="text-gray-500 text-sm">Total Jobs</div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-lg font-semibold text-yellow-600">
                    {jobs.filter((j) => j.status === "PENDING").length}
                  </div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {jobs.filter((j) => j.status === "IN_PROGRESS").length}
                  </div>
                  <div className="text-xs text-gray-500">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {jobs.filter((j) => j.status === "COMPLETED").length}
                  </div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
              </div>

              {/* Machine Status Summary */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Machine Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Array.from(new Set(jobs.map(j => j.machine.name))).map(machineName => {
                    const machineJobs = jobs.filter(j => j.machine.name === machineName);
                    const onlineJobs = machineJobs.filter(j => j.machine.status === 'ON');
                    return (
                      <div key={machineName} className="text-xs">
                        <span className="text-gray-600">{machineName}:</span>
                        <span className={`ml-1 font-medium ${onlineJobs.length > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                          {onlineJobs.length > 0 ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
