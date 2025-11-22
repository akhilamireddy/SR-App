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

    // Filter state
    const [filterTeamId, setFilterTeamId] = useState<string>('');

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

    const filteredUsers = filterTeamId
        ? users.filter(u => u.teamId === filterTeamId)
        : users;

    return (
        <div className="space-y-8">
            {/* 1. Create Team Section */}
            <div className="glass-card rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20">
                        <Users className="w-6 h-6 text-indigo-300" />
                    </div>
                    Create Team
                </h2>
                <form onSubmit={handleCreateTeam} className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium text-indigo-200 ml-1">Team Name</label>
                        <input
                            type="text"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl outline-none"
                            placeholder="e.g. Alpha Squad"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="glass-button px-8 py-3 rounded-xl font-semibold flex items-center gap-2 h-[50px]"
                    >
                        <Plus className="w-5 h-5" />
                        Create
                    </button>
                </form>

                {/* Team List Chips */}
                {teams.length > 0 && (
                    <div className="mt-8 flex flex-wrap gap-3">
                        {teams.map(team => (
                            <div key={team.id} className="flex items-center gap-3 bg-white/5 text-white px-4 py-2 rounded-xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                                <span className="font-medium">{team.name}</span>
                                <button
                                    onClick={() => removeTeam(team.id)}
                                    className="text-indigo-300 hover:text-red-400 transition-colors p-1"
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
                <div className="glass-card rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                            <UserIcon className="w-6 h-6 text-purple-300" />
                        </div>
                        Add Team Member
                    </h2>
                    <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-indigo-200 ml-1">Select Team</label>
                            <select
                                value={selectedTeamId}
                                onChange={(e) => setSelectedTeamId(e.target.value)}
                                className="glass-input w-full px-4 py-3 rounded-xl outline-none appearance-none cursor-pointer"
                                required
                            >
                                <option value="" className="bg-slate-800 text-gray-400">Select a team...</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id} className="bg-slate-800 text-white">{team.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-indigo-200 ml-1">Member Name</label>
                            <input
                                type="text"
                                value={memberName}
                                onChange={(e) => setMemberName(e.target.value)}
                                className="glass-input w-full px-4 py-3 rounded-xl outline-none"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-indigo-200 ml-1">Week-off Type</label>
                            <select
                                value={weekOff}
                                onChange={(e) => setWeekOff(e.target.value as WeekOffType)}
                                className="glass-input w-full px-4 py-3 rounded-xl outline-none appearance-none cursor-pointer"
                            >
                                <option value="type1" className="bg-slate-800 text-white">Type 1 (Fri & Sat)</option>
                                <option value="type2" className="bg-slate-800 text-white">Type 2 (Sun & Mon)</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="glass-button w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 h-[50px]"
                        >
                            <Plus className="w-5 h-5" />
                            Add Member
                        </button>
                    </form>
                </div>
            )}

            {/* 3. Roster List */}
            <div className="glass-card rounded-2xl p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-pink-500/20">
                            <Users className="w-6 h-6 text-pink-300" />
                        </div>
                        Team Members ({filteredUsers.length})
                    </h2>

                    {/* Filter Dropdown */}
                    <div className="w-full md:w-64">
                        <select
                            value={filterTeamId}
                            onChange={(e) => setFilterTeamId(e.target.value)}
                            className="glass-input w-full px-4 py-2 rounded-xl outline-none appearance-none cursor-pointer text-sm"
                        >
                            <option value="" className="bg-slate-800 text-white">All Teams</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id} className="bg-slate-800 text-white">{team.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {users.length === 0 ? (
                    <div className="text-center py-16 text-indigo-200/50">
                        <UserIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">No team members added yet.</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-16 text-indigo-200/50">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">No members found in this team.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredUsers.map((user) => {
                            const team = teams.find(t => t.id === user.teamId);
                            return (
                                <div
                                    key={user.id}
                                    className="group relative bg-white/5 hover:bg-white/10 p-5 rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300 backdrop-blur-sm"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-white text-lg">{user.name}</h3>
                                            <p className="text-sm text-indigo-300 font-medium mt-1">{team?.name || 'Unknown Team'}</p>
                                        </div>
                                        <button
                                            onClick={() => removeUser(user.id)}
                                            className="text-white/20 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-white/5"
                                            title="Remove member"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2">
                                        <span className={clsx(
                                            "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border",
                                            user.weekOffType === 'type1'
                                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                                : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                        )}>
                                            <Calendar className="w-3.5 h-3.5" />
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
