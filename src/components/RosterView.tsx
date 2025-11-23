import React, { useState } from 'react';
import { useStore, type ShiftType } from '../store/useStore';
import { Calendar, RefreshCw, Download, Lock, Save } from 'lucide-react';
import clsx from 'clsx';
import * as XLSX from 'xlsx';
import { GlassSelect } from './ui/GlassSelect';

export const RosterView: React.FC = () => {
    const { teams, users, preferences, assignments, rosterLocks, setPreference, removePreference, generateRoster, addRosterLock } = useStore();
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');

    // Date Range State
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const selectedTeam = teams.find(t => t.id === selectedTeamId);
    const teamUsers = users.filter(u => u.teamId === selectedTeamId);

    // Check if current view is locked
    const isLocked = rosterLocks.some(
        l => l.teamId === selectedTeamId &&
            ((startDate >= l.startDate && startDate <= l.endDate) ||
                (endDate >= l.startDate && endDate <= l.endDate) ||
                (startDate <= l.startDate && endDate >= l.endDate))
    );

    // Helper to generate date range array
    const getDatesInRange = (start: string, end: string) => {
        const dates: Date[] = [];
        const current = new Date(start);
        const last = new Date(end);

        while (current <= last) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    };

    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const getDayName = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    };

    // Helper to check if a date is a week-off for a user
    const isWeekOff = (date: Date, weekOffType: 'type1' | 'type2') => {
        const day = date.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
        if (weekOffType === 'type1') {
            return day === 5 || day === 6; // Fri, Sat
        } else {
            return day === 0 || day === 1; // Sun, Mon
        }
    };

    const handlePreferenceChange = (userId: string, shiftValue: string) => {
        if (isLocked) return; // Prevent changes if locked
        if (selectedTeamId && startDate && endDate) {
            if (shiftValue === '') {
                removePreference(userId, startDate, endDate);
            } else {
                setPreference(userId, selectedTeamId, startDate, endDate, shiftValue as ShiftType);
            }
        }
    };

    const handleGenerate = () => {
        if (isLocked) return;
        if (selectedTeamId && startDate && endDate) {
            generateRoster(selectedTeamId, startDate, endDate);
        }
    };

    const handleSave = () => {
        if (selectedTeamId && startDate && endDate) {
            if (window.confirm("Are you sure you want to save this roster? This will lock the date range and prevent further changes.")) {
                addRosterLock(selectedTeamId, startDate, endDate);
            }
        }
    };

    const getAssignment = (userId: string) => {
        return assignments.find(
            a => a.userId === userId &&
                a.teamId === selectedTeamId &&
                a.startDate === startDate &&
                a.endDate === endDate
        );
    };

    const getPreference = (userId: string) => {
        return preferences.find(
            p => p.userId === userId &&
                p.teamId === selectedTeamId &&
                p.startDate === startDate &&
                p.endDate === endDate
        );
    };

    const handleExport = () => {
        if (!selectedTeam || !startDate || !endDate) return;

        const dates = getDatesInRange(startDate, endDate);

        // Prepare data for export: Date, Day, Morning, Afternoon, Night, Week Off
        const data = dates.map(date => {
            const row: any = {
                'Date': formatDate(date),
                'Day': getDayName(date),
                'Morning': '',
                'Afternoon': '',
                'Night': '',
                'Week Off': ''
            };

            const morningUsers: string[] = [];
            const afternoonUsers: string[] = [];
            const nightUsers: string[] = [];
            const offUsers: string[] = [];

            teamUsers.forEach(user => {
                const isOff = isWeekOff(date, user.weekOffType);
                if (isOff) {
                    offUsers.push(user.name);
                } else {
                    const assignment = getAssignment(user.id);
                    if (assignment) {
                        if (assignment.shiftType === 'Morning') morningUsers.push(user.name);
                        else if (assignment.shiftType === 'Afternoon') afternoonUsers.push(user.name);
                        else if (assignment.shiftType === 'Night') nightUsers.push(user.name);
                    }
                }
            });

            row['Morning'] = morningUsers.join(', ');
            row['Afternoon'] = afternoonUsers.join(', ');
            row['Night'] = nightUsers.join(', ');
            row['Week Off'] = offUsers.join(', ');

            return row;
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Roster");

        const fileName = `Roster_${selectedTeam.name}_${startDate}_to_${endDate}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const dates = (startDate && endDate) ? getDatesInRange(startDate, endDate) : [];

    return (
        <div className="space-y-8">
            <div className="glass-card rounded-2xl p-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/20">
                            <Calendar className="w-6 h-6 text-indigo-300" />
                        </div>
                        Roster Generation
                    </h2>
                    {isLocked && (
                        <div className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 font-semibold text-sm flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            <span>Locked</span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div>
                        <GlassSelect
                            label="Select Team"
                            value={selectedTeamId}
                            onChange={setSelectedTeamId}
                            options={teams.map(team => ({ value: team.id, label: team.name }))}
                            placeholder="Select a team..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-indigo-200 mb-2 ml-1">From Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="glass-input w-full py-3 px-4 rounded-xl outline-none font-medium cursor-pointer text-white scheme-dark"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-indigo-200 mb-2 ml-1">To Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="glass-input w-full py-3 px-4 rounded-xl outline-none font-medium cursor-pointer text-white scheme-dark"
                        />
                    </div>
                </div>

                {selectedTeam && startDate && endDate && (
                    <>
                        {/* Preferences Section */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-white mb-4 ml-1">User Preferences</h3>
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 backdrop-blur-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {teamUsers.map((user) => {
                                        const pref = getPreference(user.id);
                                        return (
                                            <div key={user.id} className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-xs border border-indigo-500/30">
                                                        {user.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-indigo-100">{user.name}</span>
                                                </div>
                                                <select
                                                    value={pref?.shiftType || ''}
                                                    onChange={(e) => handlePreferenceChange(user.id, e.target.value)}
                                                    disabled={isLocked}
                                                    className={clsx(
                                                        "text-sm bg-black/20 border-white/10 text-indigo-200 rounded-lg focus:ring-indigo-500/50 focus:border-indigo-500/50 py-1.5 px-2 outline-none cursor-pointer hover:bg-black/30 transition-colors",
                                                        isLocked && "opacity-50 cursor-not-allowed"
                                                    )}
                                                >
                                                    <option value="" className="bg-slate-800">No Pref</option>
                                                    <option value="Morning" className="bg-slate-800">Morning</option>
                                                    <option value="Afternoon" className="bg-slate-800">Afternoon</option>
                                                    <option value="Night" className="bg-slate-800">Night</option>
                                                </select>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Action */}
                        <div className="flex justify-end gap-4 mb-8">
                            <button
                                onClick={handleExport}
                                className="px-6 py-2.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 font-semibold transition-all flex items-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                Export
                            </button>

                            {!isLocked && (
                                <>
                                    <button
                                        onClick={handleSave}
                                        className="px-6 py-2.5 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 font-semibold transition-all flex items-center gap-2"
                                    >
                                        <Save className="w-5 h-5" />
                                        <span>Save Roster</span>
                                    </button>
                                    <button
                                        onClick={handleGenerate}
                                        className="glass-button px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                        Generate
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Results Table (Compact Shift View) */}
                        <div className="overflow-x-auto rounded-2xl border border-white/10 shadow-lg">
                            <table className="min-w-full divide-y divide-white/10">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-200 uppercase tracking-wider w-32">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-200 uppercase tracking-wider w-32">Day</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-orange-300 uppercase tracking-wider">Morning</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-amber-300 uppercase tracking-wider">Afternoon</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-300 uppercase tracking-wider">Night</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Week Off</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 bg-white/5 backdrop-blur-sm">
                                    {dates.map((date) => {
                                        const morningUsers: string[] = [];
                                        const afternoonUsers: string[] = [];
                                        const nightUsers: string[] = [];
                                        const offUsers: string[] = [];

                                        teamUsers.forEach(user => {
                                            const isOff = isWeekOff(date, user.weekOffType);
                                            if (isOff) {
                                                offUsers.push(user.name);
                                            } else {
                                                const assignment = getAssignment(user.id);
                                                if (assignment) {
                                                    if (assignment.shiftType === 'Morning') morningUsers.push(user.name);
                                                    else if (assignment.shiftType === 'Afternoon') afternoonUsers.push(user.name);
                                                    else if (assignment.shiftType === 'Night') nightUsers.push(user.name);
                                                }
                                            }
                                        });

                                        return (
                                            <tr key={date.toISOString()} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                                    {formatDate(date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-200">
                                                    {getDayName(date)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-white">
                                                    <div className="flex flex-wrap gap-2">
                                                        {morningUsers.map(name => (
                                                            <span key={name} className="px-2 py-1 rounded-md bg-orange-500/20 text-orange-200 border border-orange-500/30 text-xs">
                                                                {name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-white">
                                                    <div className="flex flex-wrap gap-2">
                                                        {afternoonUsers.map(name => (
                                                            <span key={name} className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-200 border border-amber-500/30 text-xs">
                                                                {name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-white">
                                                    <div className="flex flex-wrap gap-2">
                                                        {nightUsers.map(name => (
                                                            <span key={name} className="px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 text-xs">
                                                                {name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-white">
                                                    <div className="flex flex-wrap gap-2">
                                                        {offUsers.map(name => (
                                                            <span key={name} className="px-2 py-1 rounded-md bg-white/5 text-gray-400 border border-white/10 text-xs">
                                                                {name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
