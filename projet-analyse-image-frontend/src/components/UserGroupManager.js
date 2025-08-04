import React, { useState, useEffect } from 'react';
import { userService, groupService } from '../services/api';
import Modal from './Modal';
import { Tooltip } from './Tooltip';

function UserGroupManager({ onUserGroupChange }) {
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [newUser, setNewUser] = useState({ name: '', email: '', group_id: '' });
    const [newGroup, setNewGroup] = useState({ name: '', description: '' });
    const [editingUser, setEditingUser] = useState(null);
    const [editingGroup, setEditingGroup] = useState(null);
    const [userSort, setUserSort] = useState({ field: 'name', direction: 'asc' });
    const [groupSort, setGroupSort] = useState({ field: 'name', direction: 'asc' });

    // Editing states
    const [editFormUser, setEditFormUser] = useState({ name: '', email: '', group_id: '' });
    const [editFormGroup, setEditFormGroup] = useState({ name: '', description: '' });
    const [showAddUser, setShowAddUser] = useState(false);
    const [showAddGroup, setShowAddGroup] = useState(false);

    // Add new state variables for collapse functionality
    const [groupsCollapsed, setGroupsCollapsed] = useState(false);
    const [usersCollapsed, setUsersCollapsed] = useState(false);

    const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false);
    const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [groupToDelete, setGroupToDelete] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, groupsData] = await Promise.all([
                userService.getAll(),
                groupService.getAll()
            ]);
            setUsers(usersData);
            setGroups(groupsData);
            setError(null);
        } catch (err) {
            setError('Failed to load users and groups');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Add hover effects to table rows programmatically
    useEffect(() => {
        const addHoverEffects = () => {
            const tableRows = document.querySelectorAll('tbody tr');
            tableRows.forEach((row, index) => {
                // Only target rows that have the hover classes (to avoid affecting other tables)
                if (row.className.includes('hover:bg-gray-50')) {
                    // Remove any existing hover listeners
                    row.removeEventListener('mouseenter', handleRowHover);
                    row.removeEventListener('mouseleave', handleRowLeave);
                    
                    // Add new hover listeners
                    row.addEventListener('mouseenter', handleRowHover);
                    row.addEventListener('mouseleave', handleRowLeave);
                }
            });
        };

        const handleRowHover = (e) => {
            const isDarkMode = document.body.classList.contains('dark');
            
            // Target all cells in the row, not just the row itself
            const row = e.target.tagName === 'TR' ? e.target : e.target.closest('tr');
            const cells = row.querySelectorAll('td');
            
            cells.forEach(cell => {
                if (isDarkMode) {
                    cell.style.setProperty('background-color', '#1E2A44', 'important'); // night-700 - more subtle
                } else {
                    cell.style.setProperty('background-color', '#f8fafc', 'important'); // slate-50 - more subtle
                }
                cell.style.setProperty('transition', 'background-color 0.2s ease', 'important');
            });
        };

        const handleRowLeave = (e) => {
            // Clear background from all cells in the row
            const row = e.target.tagName === 'TR' ? e.target : e.target.closest('tr');
            const cells = row.querySelectorAll('td');
            
            cells.forEach(cell => {
                cell.style.removeProperty('background-color');
            });
        };

        // Apply hover effects after component renders
        const timer = setTimeout(addHoverEffects, 100);

        return () => {
            clearTimeout(timer);
            // Clean up event listeners
            const tableRows = document.querySelectorAll('tbody tr');
            tableRows.forEach(row => {
                if (row.className.includes('hover:bg-gray-50')) {
                    row.removeEventListener('mouseenter', handleRowHover);
                    row.removeEventListener('mouseleave', handleRowLeave);
                }
            });
        };
    }, [users, groups]); // Re-apply when data changes

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroup.name) return;

        setLoading(true);
        try {
            await groupService.create(newGroup);
            setNewGroup({ name: '', description: '' });
            await loadData();
            if (onUserGroupChange) onUserGroupChange();
            setError(null);
            setShowAddGroup(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create group');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (!newUser.name) return;

        setLoading(true);
        try {
            const userToCreate = {
                ...newUser,
                email: newUser.email.trim() || null,
                group_id: newUser.group_id || null
            };
            await userService.create(userToCreate);
            setNewUser({ name: '', email: '', group_id: '' });
            await loadData();
            if (onUserGroupChange) onUserGroupChange();
            setError(null);
            setShowAddUser(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create user');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!editingUser || !editFormUser.name) return;

        setLoading(true);
        try {
            const userToUpdate = {
                ...editFormUser,
                email: editFormUser.email.trim() || null,
                group_id: editFormUser.group_id || null
            };
            await userService.update(editingUser.id, userToUpdate);
            await loadData();
            if (onUserGroupChange) onUserGroupChange();
            setEditingUser(null);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update user');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateGroup = async (e) => {
        e.preventDefault();
        if (!editingGroup || !editFormGroup.name) return;

        setLoading(true);
        try {
            await groupService.update(editingGroup.id, editFormGroup);
            await loadData();
            if (onUserGroupChange) onUserGroupChange();
            setEditingGroup(null);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update group');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteGroup = async (groupId) => {
        const group = groups.find(g => g.id === groupId);
        setGroupToDelete(group);
        setShowDeleteGroupConfirm(true);
    };

    const confirmDeleteGroup = async () => {
        if (!groupToDelete) return;

        setLoading(true);
        try {
            await groupService.delete(groupToDelete.id);
            await loadData();
            if (onUserGroupChange) onUserGroupChange();
            setShowDeleteGroupConfirm(false);
            setGroupToDelete(null);
        } catch (err) {
            setError('Failed to delete group');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        const user = users.find(u => u.id === userId);
        setUserToDelete(user);
        setShowDeleteUserConfirm(true);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;

        setLoading(true);
        try {
            await userService.delete(userToDelete.id);
            await loadData();
            if (onUserGroupChange) onUserGroupChange();
            setShowDeleteUserConfirm(false);
            setUserToDelete(null);
        } catch (err) {
            setError('Failed to delete user');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const startEditingUser = (user) => {
        setEditingUser(user);
        setEditFormUser({
            name: user.name,
            email: user.email || '',
            group_id: user.group_id || ''
        });
    };

    const startEditingGroup = (group) => {
        setEditingGroup(group);
        setEditFormGroup({
            name: group.name,
            description: group.description || ''
        });
    };

    const cancelEditing = () => {
        setEditingUser(null);
        setEditingGroup(null);
        setEditFormUser({ name: '', email: '', group_id: '' });
        setEditFormGroup({ name: '', description: '' });
    };

    const sortUsers = (field) => {
        setUserSort(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortGroups = (field) => {
        setGroupSort(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortedUsers = () => {
        return [...users].sort((a, b) => {
            let aValue = userSort.field === 'group' 
                ? groups.find(g => g.id === a.group_id)?.name || ''
                : a[userSort.field] || '';
            let bValue = userSort.field === 'group'
                ? groups.find(g => g.id === b.group_id)?.name || ''
                : b[userSort.field] || '';
            
            return userSort.direction === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        });
    };

    const getSortedGroups = () => {
        return [...groups].sort((a, b) => {
            const aValue = a[groupSort.field] || '';
            const bValue = b[groupSort.field] || '';
            return groupSort.direction === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        });
    };

    const renderSortArrow = (currentField, sortState) => {
        if (sortState.field !== currentField) return null;
        return sortState.direction === 'asc' ? '↑' : '↓';
    };

    return (
        <div className="w-full">
            <div className="max-w-7xl mx-auto">
                {error && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Groups Section - Now 5 columns wide */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="dashboard-card">
                            <div className="h-full bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm transition-all duration-300 hover:shadow-lg">
                                <div className="p-4 border-b border-gray-200 dark:border-night-600 flex justify-between items-center">
                                    <Tooltip>
                                        <Tooltip.Trigger asChild>
                                            <h3 className="text-base font-medium text-text dark:text-text-dark flex items-center gap-2">
                                                <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                Groups
                                            </h3>
                                        </Tooltip.Trigger>
                                        <Tooltip.Panel className="bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg">
                                            Manage project groups
                                        </Tooltip.Panel>
                                    </Tooltip>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setGroupsCollapsed(prev => !prev)}
                                            className="btn btn-icon text-text-muted dark:text-text-muted hover:text-text dark:hover:text-text-dark"
                                            aria-label={groupsCollapsed ? "Expand groups" : "Collapse groups"}
                                        >
                                            {groupsCollapsed ? (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setShowAddGroup(true)}
                                            className="px-4 py-2 rounded-xl text-white hover:opacity-80 transition-all duration-200 text-sm font-medium"
                                            style={{
                                                background: 'linear-gradient(45deg, #00BFFF, #0080FF)'
                                            }}
                                        >
                                            Add Group
                                        </button>
                                    </div>
                                </div>

                                {!groupsCollapsed && (
                                    <div className="overflow-y-auto" style={{maxHeight: "calc(100vh - 300px)"}}>
                                        <table className="w-full">
                                            <thead className="sticky top-0 z-10 bg-white/90 dark:bg-night-700 backdrop-filter backdrop-blur-sm">
                                                <tr>
                                                    <th 
                                                        className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200 w-2/5"
                                                        onClick={() => sortGroups('name')}
                                                    >
                                                        Name {renderSortArrow('name', groupSort)}
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider w-2/5">Description</th>
                                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider w-1/5">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border dark:divide-border-dark">
                                                {getSortedGroups().length === 0 ? (
                                                    <tr>
                                                        <td colSpan="3" className="px-4 py-4 text-center text-text-muted">
                                                            No groups found
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    getSortedGroups().map(group => (
                                                        <tr key={group.id} className="hover:bg-gray-50 dark:hover:bg-night-700 transition-colors cursor-pointer">
                                                            <td className="px-4 py-3">
                                                                <div className="text-sm font-medium text-text dark:text-text-dark break-words">{group.name}</div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="text-xs text-text-muted dark:text-text-muted break-words">{group.description}</div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-sm whitespace-nowrap">
                                                                <button
                                                                    onClick={() => startEditingGroup(group)}
                                                                    className="btn btn-text btn-sm text-text-muted dark:text-text-muted hover:text-text dark:hover:text-text-dark"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteGroup(group.id)}
                                                                    className="btn btn-icon btn-sm text-red-600 hover:text-red-800 transition-colors"
                                                                    title="Delete group"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Users Section - Now 7 columns wide */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="dashboard-card">
                            <div className="h-full bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm transition-all duration-300 hover:shadow-lg">
                                <div className="p-4 border-b border-gray-200 dark:border-night-600 flex justify-between items-center">
                                    <Tooltip>
                                        <Tooltip.Trigger asChild>
                                            <h3 className="text-base font-medium text-text dark:text-text-dark flex items-center gap-2">
                                                <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                                Users
                                            </h3>
                                        </Tooltip.Trigger>
                                        <Tooltip.Panel className="bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg">
                                            Manage system users
                                        </Tooltip.Panel>
                                    </Tooltip>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setUsersCollapsed(prev => !prev)}
                                            className="btn btn-icon text-text-muted dark:text-text-muted hover:text-text dark:hover:text-text-dark"
                                            aria-label={usersCollapsed ? "Expand users" : "Collapse users"}
                                        >
                                            {usersCollapsed ? (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setShowAddUser(true)}
                                            className="px-4 py-2 rounded-xl text-white hover:opacity-80 transition-all duration-200 text-sm font-medium"
                                            style={{
                                                background: 'linear-gradient(45deg, #00BFFF, #0080FF)'
                                            }}
                                        >
                                            Add User
                                        </button>
                                    </div>
                                </div>

                                {!usersCollapsed && (
                                    <div className="overflow-y-auto" style={{maxHeight: "calc(100vh - 300px)"}}>
                                        <table className="w-full">
                                            <thead className="sticky top-0 z-10 bg-white/90 backdrop-filter backdrop-blur-md dark:bg-night-700 border-b border-gray-200 dark:border-night-600">
                                                <tr>
                                                    <th 
                                                        className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200 w-3/12"
                                                        onClick={() => sortUsers('name')}
                                                    >
                                                        Name {renderSortArrow('name', userSort)}
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider w-4/12">Email</th>
                                                    <th 
                                                        className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200 w-3/12"
                                                        onClick={() => sortUsers('group')}
                                                    >
                                                        Group {renderSortArrow('group', userSort)}
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider w-2/12">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border dark:divide-border-dark">
                                                {getSortedUsers().length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" className="px-4 py-4 text-center text-text-muted">
                                                            No users found
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    getSortedUsers().map(user => (
                                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-night-700 transition-colors cursor-pointer">
                                                            <td className="px-4 py-3">
                                                                <div className="text-sm font-medium text-text dark:text-text-dark break-words">{user.name}</div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="text-xs text-text-muted dark:text-text-muted break-words">{user.email}</div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="text-xs text-text-muted dark:text-text-muted break-words">
                                                                    {groups.find(g => g.id === user.group_id)?.name || 'None'}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-sm whitespace-nowrap">
                                                                <button
                                                                    onClick={() => startEditingUser(user)}
                                                                    className="btn btn-text btn-sm text-text-muted dark:text-text-muted hover:text-text dark:hover:text-text-dark"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteUser(user.id)}
                                                                    className="btn btn-icon btn-sm text-red-600 hover:text-red-800 transition-colors"
                                                                    title="Delete user"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modals remain unchanged */}
                <Modal
                    isOpen={showAddGroup || editingGroup}
                    onClose={() => {
                        editingGroup ? cancelEditing() : setShowAddGroup(false);
                        setNewGroup({ name: '', description: '' });
                    }}
                    title={editingGroup ? 'Edit Group' : 'Add New Group'}
                >
                    <form onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Group Name"
                                value={editingGroup ? editFormGroup.name : newGroup.name}
                                onChange={e => editingGroup
                                    ? setEditFormGroup({ ...editFormGroup, name: e.target.value })
                                    : setNewGroup({ ...newGroup, name: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="Description"
                                value={editingGroup ? editFormGroup.description : newGroup.description}
                                onChange={e => editingGroup
                                    ? setEditFormGroup({ ...editFormGroup, description: e.target.value })
                                    : setNewGroup({ ...newGroup, description: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={loading}
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => {
                                    editingGroup ? cancelEditing() : setShowAddGroup(false);
                                    setNewGroup({ name: '', description: '' });
                                }}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !(editingGroup ? editFormGroup.name : newGroup.name)}
                                className="btn btn-primary"
                            >
                                {editingGroup ? 'Update' : 'Add'} Group
                            </button>
                        </div>
                    </form>
                </Modal>

                <Modal
                    isOpen={showAddUser || editingUser}
                    onClose={() => {
                        editingUser ? cancelEditing() : setShowAddUser(false);
                        setNewUser({ name: '', email: '', group_id: '' });
                    }}
                    title={editingUser ? 'Edit User' : 'Add New User'}
                >
                    <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                placeholder="User Name"
                                value={editingUser ? editFormUser.name : newUser.name}
                                onChange={e => editingUser
                                    ? setEditFormUser({ ...editFormUser, name: e.target.value })
                                    : setNewUser({ ...newUser, name: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <input
                                type="email"
                                placeholder="Email"
                                value={editingUser ? editFormUser.email : newUser.email}
                                onChange={e => editingUser
                                    ? setEditFormUser({ ...editFormUser, email: e.target.value })
                                    : setNewUser({ ...newUser, email: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <select
                                value={editingUser ? editFormUser.group_id : newUser.group_id}
                                onChange={e => editingUser
                                    ? setEditFormUser({ ...editFormUser, group_id: e.target.value })
                                    : setNewUser({ ...newUser, group_id: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={loading}
                            >
                                <option value="">Select Group</option>
                                {groups.map(group => (
                                    <option key={group.id} value={group.id}>{group.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => {
                                    editingUser ? cancelEditing() : setShowAddUser(false);
                                    setNewUser({ name: '', email: '', group_id: '' });
                                }}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !(editingUser ? editFormUser.name : newUser.name)}
                                className="btn btn-primary"
                            >
                                {editingUser ? 'Update' : 'Add'} User
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Add Delete User Confirmation Modal */}
                <Modal
                    isOpen={showDeleteUserConfirm}
                    onClose={() => {
                        setShowDeleteUserConfirm(false);
                        setUserToDelete(null);
                    }}
                    title="Delete User"
                >
                    <div className="space-y-4">
                        <div className="text-indigo-700">
                            <p className="font-medium mb-2">⚠️ Warning: This action cannot be undone!</p>
                            <p>Are you sure you want to delete user "{userToDelete?.name}"?</p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteUserConfirm(false);
                                    setUserToDelete(null);
                                }}
                                className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
                                disabled={loading}
                                style={{
                                    background: 'linear-gradient(45deg, #8B5CF6, #6366F1)',
                                    borderColor: 'rgba(139, 92, 246, 0.3)',
                                    color: 'white',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteUser}
                                className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
                                disabled={loading}
                                style={{
                                    background: 'linear-gradient(45deg, #DC2626, #B91C1C)',
                                    borderColor: 'rgba(220, 38, 38, 0.3)',
                                    color: 'white',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(220, 38, 38, 0.3)',
                                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.2)'
                                }}
                            >
                                Delete User
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Add Delete Group Confirmation Modal */}
                <Modal
                    isOpen={showDeleteGroupConfirm}
                    onClose={() => {
                        setShowDeleteGroupConfirm(false);
                        setGroupToDelete(null);
                    }}
                    title="Delete Group"
                >
                    <div className="space-y-4">
                        <div className="text-indigo-700">
                            <p className="font-medium mb-2">⚠️ Warning: This action cannot be undone!</p>
                            <p>Are you sure you want to delete group "{groupToDelete?.name}"?</p>
                            {users.some(u => u.group_id === groupToDelete?.id) && (
                                <p className="mt-2 text-red-500">
                                    ⚠️ This group has users assigned to it. Deleting it will remove the group assignment from these users.
                                </p>
                            )}
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteGroupConfirm(false);
                                    setGroupToDelete(null);
                                }}
                                className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
                                disabled={loading}
                                style={{
                                    background: 'linear-gradient(45deg, #8B5CF6, #6366F1)',
                                    borderColor: 'rgba(139, 92, 246, 0.3)',
                                    color: 'white',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteGroup}
                                className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
                                disabled={loading}
                                style={{
                                    background: 'linear-gradient(45deg, #DC2626, #B91C1C)',
                                    borderColor: 'rgba(220, 38, 38, 0.3)',
                                    color: 'white',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(220, 38, 38, 0.3)',
                                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.2)'
                                }}
                            >
                                Delete Group
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
}

export default UserGroupManager;