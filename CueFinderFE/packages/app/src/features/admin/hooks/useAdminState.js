import { useState, useCallback } from 'react';
import * as adminUsersService from '../../../api/adminUsersService';
import * as cueService from '../../../api/cueService';
import * as cueCaseService from '../../../api/cueCaseService';

/**
 * useAdminState Hook
 * Manages admin dashboard state for users, cues, and cases
 */
export function useAdminState() {
  const [users, setUsers] = useState([]);
  const [cues, setCues] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all admin data
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, cuesData, casesData] = await Promise.all([
        adminUsersService.getAllUsers().catch(() => []),
        cueService.getCues().catch(() => []),
        cueCaseService.getCueCases().catch(() => [])
      ]);
      setUsers(usersData || []);
      setCues(cuesData || []);
      setCases(casesData || []);
    } catch (err) {
      console.error('Error loading admin data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user
  const updateUser = useCallback(async (userId, userData) => {
    try {
      const updated = await adminUsersService.updateUser(userId, userData);
      setUsers(prev => prev.map(u => u.id === userId ? updated : u));
      return updated;
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  }, []);

  // Delete user
  const deleteUser = useCallback(async (userId) => {
    try {
      await adminUsersService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  }, []);

  // Delete cue
  const deleteCue = useCallback(async (cueId) => {
    try {
      await cueService.deleteCue(cueId);
      setCues(prev => prev.filter(c => c.id !== cueId));
    } catch (err) {
      console.error('Error deleting cue:', err);
      throw err;
    }
  }, []);

  // Delete case
  const deleteCase = useCallback(async (caseId) => {
    try {
      await cueCaseService.deleteCueCase(caseId);
      setCases(prev => prev.filter(c => c.id !== caseId));
    } catch (err) {
      console.error('Error deleting case:', err);
      throw err;
    }
  }, []);

  // Toggle user ban/active status
  const toggleUserStatus = useCallback(async (userId, isActive) => {
    try {
      const updated = await updateUser(userId, { IsActive: !isActive });
      return updated;
    } catch (err) {
      console.error('Error toggling user status:', err);
      throw err;
    }
  }, [updateUser]);

  return {
    users,
    cues,
    cases,
    loading,
    error,
    loadAllData,
    updateUser,
    deleteUser,
    deleteCue,
    deleteCase,
    toggleUserStatus
  };
}
