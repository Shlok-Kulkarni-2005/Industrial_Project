"use client";
import React, { useState, useEffect } from "react";
import { Menu, Loader2, AlertCircle } from "lucide-react";
import Sidebar from "../../components/sidebar";

// Type definitions
interface Alert {
  id: number;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  sentByUser?: {
    id: number;
    name: string;
    email: string;
  };
}

const username = "Operator";

export default function SeeAlertsPage() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const handleMenuClick = (): void => {
    setSidebarOpen(true);
  };

  const handleCloseSidebar = (): void => {
    setSidebarOpen(false);
  };

  // Fetch alerts on component mount
  useEffect(() => {
    fetchAlerts();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/alerts?limit=50');
      
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      
      const data = await response.json();
      setAlerts(data.alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setError('Failed to load alerts. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const getAlertIcon = (type: string): string => {
    switch (type) {
      case 'SYSTEM':
        return '🔧';
      case 'MANAGER':
        return '👨‍💼';
      case 'JOB':
        return '📋';
      default:
        return '🔔';
    }
  };

  const getAlertColor = (type: string): string => {
    switch (type) {
      case 'SYSTEM':
        return 'bg-blue-100 border-blue-200';
      case 'MANAGER':
        return 'bg-purple-100 border-purple-200';
      case 'JOB':
        return 'bg-green-100 border-green-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const handleLoadMore = (): void => {
    // Handle load more functionality
    console.log("Load more alerts clicked");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading alerts...</p>
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

        <h1 className="text-xl font-semibold text-blue-700">See Alerts</h1>

        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-lg">A</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <div className="max-w-md mx-auto space-y-4">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {alerts.map((alert: Alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-lg p-4 shadow-sm border ${getAlertColor(alert.type)} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start space-x-3">
                {/* Avatar */}
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-700 font-medium text-sm">
                    {alert.sentByUser ? getInitials(alert.sentByUser.name) : getAlertIcon(alert.type)}
                  </span>
                </div>

                {/* Alert Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-gray-900 font-medium text-sm">
                      {alert.sentByUser ? alert.sentByUser.name : alert.title}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(alert.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {alert.message}
                  </p>
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      {alert.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State (if no alerts) */}
          {alerts.length === 0 && !error && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">🔔</span>
              </div>
              <h3 className="text-gray-500 font-medium mb-2">No alerts</h3>
              <p className="text-gray-400 text-sm">
                All systems are running smoothly
              </p>
            </div>
          )}

          {/* Load More Button (if needed) */}
          {alerts.length > 0 && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Load more alerts
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
