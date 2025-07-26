'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  User,
  Mail,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Filter,
  TrendingUp,
  Shield,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';

interface UserData {
  user_id: string;
  user_email: string;
  created_at: string;
  isAdmin?: boolean;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  lastSignInAt?: string | null;
  emailAddresses?: Array<{
    id: string;
    emailAddress: string;
    verification?: {
      status: string;
      strategy: string;
    };
  }>;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'email' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [visibleUserIds, setVisibleUserIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    userId: string;
    userEmail: string;
    action: 'promote' | 'demote';
  }>({ isOpen: false, userId: '', userEmail: '', action: 'promote' });
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  const { user: currentUser } = useUser();

  useEffect(() => {
    fetchUsers();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchUsers(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      if (silent) setRefreshing(true);
      
      const response = await fetch('/api/admin/users');
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAdminRoleChange = async (userId: string, isAdmin: boolean) => {
    setProcessingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/admin-role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAdmin }),
      });

      if (response.ok) {
        // Update local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.user_id === userId 
              ? { ...user, isAdmin } 
              : user
          )
        );
        
        // Show success message (you could add a toast here)
        console.log(`User ${isAdmin ? 'promoted to' : 'demoted from'} admin successfully`);
      } else {
        const errorData = await response.json();
        console.error('Failed to update admin role:', errorData.error);
        // Show error message (you could add a toast here)
      }
    } catch (error) {
      console.error('Error updating admin role:', error);
    } finally {
      setProcessingUserId(null);
      setConfirmDialog({ isOpen: false, userId: '', userEmail: '', action: 'promote' });
    }
  };

  const openConfirmDialog = (userId: string, userEmail: string, action: 'promote' | 'demote') => {
    setConfirmDialog({ isOpen: true, userId, userEmail, action });
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  // Enhanced filtering
  const filteredAndSortedUsers = users
    .filter(user => {
      const matchesSearch = user.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.user_id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const userDate = new Date(user.created_at);
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      let matchesDateFilter = true;
      switch (dateFilter) {
        case 'today':
          matchesDateFilter = userDate.toDateString() === today.toDateString();
          break;
        case 'week':
          matchesDateFilter = userDate > weekAgo;
          break;
        case 'month':
          matchesDateFilter = userDate > monthAgo;
          break;
        default:
          matchesDateFilter = true;
      }

      return matchesSearch && matchesDateFilter;
    })
    .sort((a, b) => {
      const aValue = sortBy === 'email' ? a.user_email : a.created_at;
      const bValue = sortBy === 'email' ? b.user_email : b.created_at;
      
      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredAndSortedUsers.slice(startIndex, endIndex);

  // Statistics calculations
  const totalUsers = users.length;
  const adminUsers = users.filter(user => user.isAdmin).length;
  const todayUsers = users.filter(user => {
    const userDate = new Date(user.created_at);
    const today = new Date();
    return userDate.toDateString() === today.toDateString();
  }).length;

  const weekUsers = users.filter(user => {
    const userDate = new Date(user.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return userDate > weekAgo;
  }).length;

  // Growth calculation
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const lastWeekUsers = users.filter(user => {
    const userDate = new Date(user.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return userDate > twoWeeksAgo && userDate <= weekAgo;
  }).length;

  const growthRate = lastWeekUsers > 0 
    ? Math.round(((weekUsers - lastWeekUsers) / lastWeekUsers) * 100)
    : weekUsers > 0 ? 100 : 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportUsers = () => {
    const csvContent = [
      ['User ID', 'Email', 'Admin Status', 'First Name', 'Last Name', 'Created At', 'Join Date'],
      ...filteredAndSortedUsers.map(user => [
        user.user_id,
        user.user_email,
        user.isAdmin ? 'Admin' : 'User',
        user.firstName || '',
        user.lastName || '',
        user.created_at,
        new Date(user.created_at).toLocaleDateString()
      ])
    ]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleUserIdVisibility = (userId: string) => {
    setVisibleUserIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const changePage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <h3 className="text-lg font-semibold">
                {confirmDialog.action === 'promote' ? 'Promote to Admin' : 'Remove Admin Rights'}
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {confirmDialog.action === 'promote' ? 'promote' : 'demote'}{' '}
              <span className="font-medium">{confirmDialog.userEmail}</span>{' '}
              {confirmDialog.action === 'promote' ? 'to admin?' : 'from admin?'}
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setConfirmDialog({ isOpen: false, userId: '', userEmail: '', action: 'promote' })}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleAdminRoleChange(confirmDialog.userId, confirmDialog.action === 'promote')}
                disabled={processingUserId === confirmDialog.userId}
                className={`flex-1 ${
                  confirmDialog.action === 'promote' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } text-white`}
              >
                {processingUserId === confirmDialog.userId ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage users and admin rights in BudtenderAI.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()} 
            {refreshing && <span className="ml-2 text-blue-600">• Refreshing...</span>}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={exportUsers}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV ({filteredAndSortedUsers.length})</span>
          </Button>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{totalUsers.toLocaleString()}</p>
                <p className="text-sm text-blue-600 mt-1">All time</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admin Users</p>
                <p className="text-3xl font-bold text-gray-900">{adminUsers}</p>
                <p className="text-sm text-purple-600 mt-1">
                  {((adminUsers / Math.max(totalUsers, 1)) * 100).toFixed(1)}% of total
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <ShieldCheck className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Today</p>
                <p className="text-3xl font-bold text-gray-900">{todayUsers}</p>
                <p className="text-sm text-green-600 mt-1">
                  {((todayUsers / Math.max(totalUsers, 1)) * 100).toFixed(1)}% of total
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {growthRate >= 0 ? '+' : ''}{growthRate}%
                </p>
                <p className={`text-sm mt-1 ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Week over week
                </p>
              </div>
              <div className={`p-3 rounded-full ${growthRate >= 0 ? 'bg-orange-100' : 'bg-red-100'}`}>
                <TrendingUp className={`h-6 w-6 ${growthRate >= 0 ? 'text-orange-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters and Search */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by email or user ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month');
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Users</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'email' | 'created_at')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="created_at">Sort by Date</option>
                <option value="email">Sort by Email</option>
              </select>
              
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table with Admin Management */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex text-gray-800 items-center justify-between">
            <span>
              Users ({filteredAndSortedUsers.length} 
              {filteredAndSortedUsers.length !== totalUsers && ` of ${totalUsers}`})
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              <Users className="h-5 w-5 text-gray-500" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAndSortedUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No users found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm ? 'Try adjusting your search terms or filters' : 'Users will appear here once they register'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {currentUsers.map((user, index) => (
                  <motion.div
                    key={user.user_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                      user.isAdmin 
                        ? 'bg-purple-50 border border-purple-200' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        user.isAdmin ? 'bg-purple-100' : 'bg-blue-100'
                      }`}>
                        {user.isAdmin ? (
                          <ShieldCheck className="h-6 w-6 text-purple-600" />
                        ) : (
                          <User className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user.user_email.split('@')[0]}
                          </p>
                          {user.isAdmin && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.user_email}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          Joined {formatDate(user.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right mr-4">
                        <p className="text-sm font-medium text-gray-900">
                          ID: {visibleUserIds.has(user.user_id) ? user.user_id : '••••••••'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {/* Admin Role Management Buttons */}
                      {currentUser?.id !== user.user_id && (
                        <div className="flex items-center space-x-1">
                          {user.isAdmin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openConfirmDialog(user.user_id, user.user_email, 'demote')}
                              disabled={processingUserId === user.user_id}
                              className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50"
                            >
                              {processingUserId === user.user_id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Remove Admin
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openConfirmDialog(user.user_id, user.user_email, 'promote')}
                              disabled={processingUserId === user.user_id}
                              className="h-8 px-3 text-green-600 border-green-200 hover:bg-green-50"
                            >
                              {processingUserId === user.user_id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Make Admin
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleUserIdVisibility(user.user_id)}
                        className="h-8 w-8 p-0"
                      >
                        {visibleUserIds.has(user.user_id) ? 
                          <EyeOff className="h-4 w-4" /> : 
                          <Eye className="h-4 w-4" />
                        }
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedUsers.length)} of {filteredAndSortedUsers.length} users
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changePage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center space-x-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {/* Show page numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // Show first page, last page, current page, and pages around current
                          return page === 1 || 
                                page === totalPages || 
                                Math.abs(page - currentPage) <= 1;
                        })
                        .map((page, index, array) => {
                          // Add ellipsis if there's a gap
                          const showEllipsis = index > 0 && page - array[index - 1] > 1;
                          
                          return (
                            <React.Fragment key={page}>
                              {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                              <Button
                                variant={page === currentPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => changePage(page)}
                                className="h-8 w-8 p-0"
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          );
                        })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changePage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center space-x-1"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 