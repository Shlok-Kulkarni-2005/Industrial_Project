"use client";
import React, { useState, useEffect } from "react";
import { Menu, Clock, Loader2, AlertCircle, RefreshCw, X, Calendar, Users, Settings, CheckCircle, PlayCircle, PauseCircle } from "lucide-react";
import Sidebar from "../../components/sidebar";

interface ProductCount {
  id: number;
  name: string;
  description?: string;
  totalQuantity: number;
  totalJobs: number;
  averageQuantity: number;
}

interface ProductDetails {
  product: {
    id: number;
    name: string;
    description?: string;
    costPerUnit: number;
  };
  date: string;
  summary: {
    totalJobs: number;
    totalQuantity: number;
    totalCost: number;
    completedJobs: number;
    inProgressJobs: number;
    pendingJobs: number;
    totalMachines: number;
    totalOperators: number;
  };
  machineStats: Array<{
    machineName: string;
    jobs: any[];
    totalJobs: number;
    totalQuantity: number;
    totalCost: number;
    completedJobs: number;
    inProgressJobs: number;
    pendingJobs: number;
  }>;
  operators: Array<{
    username: string;
    phone: string;
  }>;
  jobs: Array<{
    id: number;
    machine: string;
    operator: string;
    quantity: number;
    status: string;
    stage: string;
    createdAt: string;
    checklistItems: any[];
    costPerUnit: number;
    totalCost: number;
  }>;
}

export default function ProductCountPage(): React.ReactElement {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [productCounts, setProductCounts] = useState<ProductCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<ProductCount | null>(null);
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string>("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const username = "Operator";

  const handleMenuClick = (): void => {
    setSidebarOpen(true);
  };

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await fetchProductCounts();
    setRefreshing(false);
  };

  // Fetch product count data on component mount
  useEffect(() => {
    fetchProductCounts();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchProductCounts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchProductCounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs');
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const data = await response.json();
      
      // Calculate product counts from jobs data
      const productCountMap = new Map<number, ProductCount>();
      
      data.jobs.forEach((job: any) => {
        const productId = job.product.id;
        const productName = job.product.name;
        const productDescription = job.product.description;
        const quantity = job.quantity;
        
        if (productCountMap.has(productId)) {
          const existing = productCountMap.get(productId)!;
          existing.totalQuantity += quantity;
          existing.totalJobs += 1;
          existing.averageQuantity = Math.round(existing.totalQuantity / existing.totalJobs);
        } else {
          productCountMap.set(productId, {
            id: productId,
            name: productName,
            description: productDescription,
            totalQuantity: quantity,
            totalJobs: 1,
            averageQuantity: quantity
          });
        }
      });
      
      // Convert map to array and sort by total quantity
      const counts = Array.from(productCountMap.values())
        .sort((a, b) => b.totalQuantity - a.totalQuantity);
      
      setProductCounts(counts);
    } catch (error) {
      console.error('Error fetching product counts:', error);
      setError('Failed to load product counts. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: ProductCount): void => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
    fetchProductDetails(product.id);
  };

  const handleCloseModal = (): void => {
    setShowDetailsModal(false);
    setSelectedProduct(null);
    setProductDetails(null);
    setDetailsError("");
  };

  const fetchProductDetails = async (productId: number): Promise<void> => {
    try {
      setDetailsLoading(true);
      setDetailsError("");
      
      const response = await fetch(`/api/products/details?productId=${productId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }
      
      const data = await response.json();
      setProductDetails(data);
    } catch (error) {
      console.error('Error fetching product details:', error);
      setDetailsError('Failed to load product details. Please try again.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'IN_PROGRESS':
        return 'text-blue-600 bg-blue-100';
      case 'FINISHED':
        return 'text-green-600 bg-green-100';
      case 'COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'DISPATCHED':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <PauseCircle className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="w-4 h-4" />;
      case 'FINISHED':
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading product counts...</p>
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

        <h1 className="text-xl font-semibold text-blue-700">Product Count</h1>

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

          {/* Product Count List */}
          <div className="space-y-3">
            {productCounts.map((product: ProductCount) => (
              <div
                key={product.id}
                className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
              >
                <div className="flex items-center space-x-3 mb-3">
                  {/* Count Icon */}
                  <div className="w-6 h-6 border-2 border-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 font-medium text-base mb-1">
                      {product.name}
                    </h3>
                    <div className="flex items-center space-x-1 mb-1">
                      <span className="text-gray-500 text-sm">Total:</span>
                      <span className="text-gray-600 text-sm font-medium">
                        {formatNumber(product.totalQuantity)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 mb-1">
                      <span className="text-gray-500 text-sm">Jobs:</span>
                      <span className="text-gray-600 text-sm font-medium">
                        {product.totalJobs}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-500 text-sm">Avg:</span>
                      <span className="text-gray-600 text-sm font-medium">
                        {formatNumber(product.averageQuantity)}
                      </span>
                    </div>
                  </div>

                  {/* Count Icon */}
                  <div className="flex-shrink-0">
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* See Details Button */}
                <button
                  onClick={() => handleProductClick(product)}
                  className="w-full mt-3 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  See Details
                </button>
              </div>
            ))}
          </div>

          {/* Empty State (if no products) */}
          {productCounts.length === 0 && !error && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">📦</span>
              </div>
              <h3 className="text-gray-500 font-medium mb-2">
                No products found
              </h3>
              <p className="text-gray-400 text-sm">
                Add jobs to see product counts here
              </p>
            </div>
          )}

          {/* Summary Stats */}
          {productCounts.length > 0 && (
            <div className="mt-8 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {productCounts.length}
                </div>
                <div className="text-gray-500 text-sm">Product Types</div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {formatNumber(productCounts.reduce((sum, p) => sum + p.totalQuantity, 0))}
                  </div>
                  <div className="text-xs text-gray-500">Total Units</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {formatNumber(productCounts.reduce((sum, p) => sum + p.totalJobs, 0))}
                  </div>
                  <div className="text-xs text-gray-500">Total Jobs</div>
                </div>
              </div>

              {/* Top Products */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Top Products</h4>
                <div className="space-y-2">
                  {productCounts.slice(0, 3).map((product, index) => (
                    <div key={product.id} className="flex justify-between items-center text-xs">
                      <span className="text-gray-600 truncate flex-1">
                        {index + 1}. {product.name}
                      </span>
                      <span className="text-gray-800 font-medium ml-2">
                        {formatNumber(product.totalQuantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Product Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedProduct?.name} - Details
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Current day operations and machine-wise processing
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {detailsLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading product details...</p>
                </div>
              ) : detailsError ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
                  <p className="text-red-600">{detailsError}</p>
                </div>
              ) : productDetails ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Total Jobs</p>
                          <p className="text-xl font-bold text-blue-900">{productDetails.summary.totalJobs}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm text-green-600 font-medium">Total Quantity</p>
                          <p className="text-xl font-bold text-green-900">{formatNumber(productDetails.summary.totalQuantity)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Settings className="w-5 h-5 text-purple-600 mr-2" />
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Machines Used</p>
                          <p className="text-xl font-bold text-purple-900">{productDetails.summary.totalMachines}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-orange-600 mr-2" />
                        <div>
                          <p className="text-sm text-orange-600 font-medium">Operators</p>
                          <p className="text-xl font-bold text-orange-900">{productDetails.summary.totalOperators}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Job Status Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Status Summary</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{productDetails.summary.pendingJobs}</div>
                        <div className="text-sm text-gray-600">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{productDetails.summary.inProgressJobs}</div>
                        <div className="text-sm text-gray-600">In Progress</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{productDetails.summary.completedJobs}</div>
                        <div className="text-sm text-gray-600">Completed</div>
                      </div>
                    </div>
                  </div>

                  {/* Machine-wise Processing Steps */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Machine-wise Processing Steps</h3>
                    <div className="space-y-4">
                      {productDetails.machineStats.map((machine) => (
                        <div key={machine.machineName} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-medium text-gray-900">{machine.machineName}</h4>
                            <div className="flex space-x-2">
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                {machine.totalJobs} jobs
                              </span>
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                {formatNumber(machine.totalQuantity)} units
                              </span>
                            </div>
                          </div>
                          
                          {/* Job Status for this machine */}
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="text-center p-2 bg-yellow-50 rounded">
                              <div className="text-sm font-medium text-yellow-800">{machine.pendingJobs}</div>
                              <div className="text-xs text-yellow-600">Pending</div>
                            </div>
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <div className="text-sm font-medium text-blue-800">{machine.inProgressJobs}</div>
                              <div className="text-xs text-blue-600">In Progress</div>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded">
                              <div className="text-sm font-medium text-green-800">{machine.completedJobs}</div>
                              <div className="text-xs text-green-600">Completed</div>
                            </div>
                          </div>

                          {/* Individual Jobs */}
                          <div className="space-y-2">
                            {machine.jobs.map((job) => (
                              <div key={job.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center space-x-3">
                                  {getStatusIcon(job.status)}
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      Job #{job.id} - {job.operator}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {formatDate(job.createdAt)} • {job.quantity} units
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                                    {job.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Operators List */}
                  {productDetails.operators.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Operators Working Today</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {productDetails.operators.map((operator, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {operator.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{operator.username}</div>
                              <div className="text-xs text-gray-500">{operator.phone}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
