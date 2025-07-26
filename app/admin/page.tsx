'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Search, 
  User,
  Activity,
  TrendingUp,
  Clock,
  ChevronRight,
  RefreshCw,
  Calendar,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Types for the data we'll be working with
interface ChatData {
  user_id: string;
  user_email: string;
  user_name: string;
  plan_type: string;
  thread_id: string;
  thread_name: string;
  created_at: string;
  last_message_at: string;
  is_most_recent: boolean;
  summary?: string | null;
}

interface UserData {
  user_id: string;
  user_email: string;
  created_at: string;
}

export default function AdminDashboard() {
  // State management
  const [chats, setChats] = useState<ChatData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      if (silent) setRefreshing(true);
      
      // Fetch users and chats in parallel
      const [usersResponse, chatsResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/chats')
      ]);

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }

      if (chatsResponse.ok) {
        const chatsData = await chatsResponse.json();
        setChats(chatsData);
      }
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    fetchData();
  };

  // Filter functions
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate enhanced statistics
  const totalUsers = users.length;
  const totalChats = chats.length;
  
  // Users today (same calendar day)
  const today = new Date();
  const todayUsers = users.filter(user => {
    const userDate = new Date(user.created_at);
    return userDate.toDateString() === today.toDateString();
  }).length;

  // Users this week (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekUsers = users.filter(user => {
    const userDate = new Date(user.created_at);
    return userDate > weekAgo;
  }).length;

  // Users last week (for growth rate calculation)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const lastWeekUsers = users.filter(user => {
    const userDate = new Date(user.created_at);
    return userDate > twoWeeksAgo && userDate <= weekAgo;
  }).length;

  // Growth rate calculation (this week vs last week)
  const growthRate = lastWeekUsers > 0 
    ? Math.round(((thisWeekUsers - lastWeekUsers) / lastWeekUsers) * 100)
    : thisWeekUsers > 0 ? 100 : 0;

  const recentChats = chats
    .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
    .slice(0, 10);

  const recentUsers = filteredUsers
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">
            Welcome to the admin dashboard. Here&apos;s what&apos;s happening with BudtenderAI.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()} 
            {refreshing && <span className="ml-2 text-blue-600">• Refreshing...</span>}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{totalUsers.toLocaleString()}</p>
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {thisWeekUsers} this week
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Users Today</p>
                  <p className="text-3xl font-bold text-gray-900">{todayUsers}</p>
                  <p className="text-sm text-blue-600 mt-1 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {((todayUsers / Math.max(totalUsers, 1)) * 100).toFixed(1)}% of total
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <User className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Users This Week</p>
                  <p className="text-3xl font-bold text-gray-900">{thisWeekUsers}</p>
                  <p className="text-sm text-orange-600 mt-1 flex items-center">
                    <Activity className="h-3 w-3 mr-1" />
                    Last 7 days
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {growthRate >= 0 ? '+' : ''}{growthRate}%
                  </p>
                  <p className={`text-sm mt-1 flex items-center ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className={`h-3 w-3 mr-1 ${growthRate < 0 ? 'rotate-180' : ''}`} />
                    Week over week
                  </p>
                </div>
                <div className={`p-3 rounded-full ${growthRate >= 0 ? 'bg-purple-100' : 'bg-red-100'}`}>
                  <BarChart3 className={`h-6 w-6 ${growthRate >= 0 ? 'text-purple-600' : 'text-red-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex text-gray-800 items-center justify-between">
                <span>Recent Users (Last 5)</span>
                <Users className="h-5 w-5 text-gray-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No users yet</p>
                ) : (
                  recentUsers.map((user) => (
                    <div key={user.user_id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.user_email.split('@')[0]}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.user_email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {formatDate(user.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Conversations */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex text-gray-800 items-center justify-between">
                <span>Recent Conversations (Last 5)</span>
                <MessageSquare className="h-5 w-5 text-gray-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentChats.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No conversations yet</p>
                ) : (
                  recentChats.slice(0, 5).map((chat) => (
                    <div key={chat.thread_id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {chat.thread_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {chat.user_name || chat.user_email.split('@')[0]} • {chat.user_email}
                        </p>
                      </div>
                      <div className="text-right flex items-center space-x-2">
                        <div>
                          <p className="text-xs text-gray-500">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatDate(chat.last_message_at)}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-200"
                onClick={() => window.location.href = '/admin/users'}
              >
                <Users className="h-6 w-6 text-blue-600" />
                <span>Manage Users</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-200"
                onClick={() => window.location.href = '/admin/chats'}
              >
                <MessageSquare className="h-6 w-6 text-green-600" />
                <span>View Chats</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 hover:border-purple-200"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-6 w-6 text-purple-600 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-orange-50 hover:border-orange-200"
                onClick={() => {
                  // Export basic dashboard data as CSV
                  const csvContent = [
                    ['Metric', 'Value'],
                    ['Total Users', totalUsers.toString()],
                    ['New Users Today', todayUsers.toString()],
                    ['Users This Week', thisWeekUsers.toString()],
                    ['Growth Rate', `${growthRate}%`],
                    ['Total Chats', totalChats.toString()],
                    ['Last Updated', lastRefresh.toISOString()]
                  ]
                    .map(row => row.join(','))
                    .join('\n');
                  
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `dashboard-stats-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
              >
                <BarChart3 className="h-6 w-6 text-orange-600" />
                <span>Export Stats</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}