import React, { useState } from 'react';
import { useStore, type WeekOffType } from '../store/useStore';
import { Plus, Trash2, User as UserIcon, Calendar, Users } from 'lucide-react';
import clsx from 'clsx';

export const TeamManagement: React.FC = () => {
    const { teams, users, addTeam, removeTeam, addUser, removeUser } = useStore();
    const [newTeamName, setNewTeamName] = useState('');

    // Member form state
    const [memberName, setMemberName] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [weekOff, setWeekOff] = useState<WeekOffType>('type1');

    const handleCreateTeam = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTeamName.trim()) {
            addTeam(newTeamName);
            setNewTeamName('');
        }
    };

    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault();
        if (memberName && selectedTeamId) {
            addUser(memberName, selectedTeamId, weekOff);
            setMemberName('');
            setWeekOff('type1');
        }
    };

    return (
        <div className="space-y-8">
            {/* 1. Create Team Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Users className="w-6 h-6 text-indigo-600" />
                    Create Team
                </h2>
                <form onSubmit={handleCreateTeam} className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium text-gray-600">Team Name</label>
                        <input
                            type="text"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            placeholder="e.g. Alpha Squad"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 h-[42px]"
                    >
                        <Plus className="w-5 h-5" />
                        Create Team
                    </button>
                </form>

                {/* Team List Chips */}
                {teams.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-3">
                        {teams.map(team => (
                            <div key={team.id} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100">
                                <span className="font-medium">{team.name}</span>
                                <button
                                    onClick={() => removeTeam(team.id)}
                                    className="hover:text-red-500 transition-colors"
                                    title="Delete Team"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 2. Add Member Section (Only visible if teams exist) */}
            {teams.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <UserIcon className="w-6 h-6 text-indigo-600" />
                        Add Team Member
                    </h2>
                    <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Select Team</label>
                            <select
                                value={selectedTeamId}
                                onChange={(e) => setSelectedTeamId(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                                required
                            >
                                <option value="">Select a team...</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Member Name</label>
                            <input
                                type="text"
                                value={memberName}
                                onChange={(e) => setMemberName(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Week-off Type</label>
                            <select
                                value={weekOff}
                                onChange={(e) => setWeekOff(e.target.value as WeekOffType)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                            >
                                <option value="type1">Type 1 (Fri & Sat)</option>
                                <option value="type2">Type 2 (Sun & Mon)</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Add Member
                        </button>
                    </form>
                </div>
            )}

            {/* 3. Roster List */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Users className="w-6 h-6 text-indigo-600" />
                    All Members ({users.length})
                </h2>

                {users.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <UserIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No team members added yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {users.map((user) => {
                            const team = teams.find(t => t.id === user.teamId);
                            return (
                                <div
                                    key={user.id}
                                    className="group relative bg-gray-50 hover:bg-white p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{user.name}</h3>
                                            <p className="text-xs text-indigo-600 font-medium mt-1">{team?.name || 'Unknown Team'}</p>
                                        </div>
                                        <button
                                            onClick={() => removeUser(user.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                            title="Remove member"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2">
                                        <span className={clsx(
                                            "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                                            user.weekOffType === 'type1'
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-purple-100 text-purple-700"
                                        )}>
                                            <Calendar className="w-3 h-3" />
                                            {user.weekOffType === 'type1' ? 'Fri-Sat Off' : 'Sun-Mon Off'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
