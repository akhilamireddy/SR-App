import React, { useState } from 'react';
import { useStore, type ShiftType } from '../store/useStore';
import { Calendar, RefreshCw, Download, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import * as XLSX from 'xlsx';

export const RosterView: React.FC = () => {
    const { teams, users, preferences, assignments, setPreference, removePreference, generateRoster } = useStore();
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = [2024, 2025, 2026];

    const selectedTeam = teams.find(t => t.id === selectedTeamId);
    const teamUsers = users.filter(u => u.teamId === selectedTeamId);

    const handlePreferenceChange = (userId: string, shiftValue: string) => {
        if (selectedTeamId) {
            if (shiftValue === '') {
                removePreference(userId, selectedMonth, selectedYear);
            } else {
                setPreference(userId, selectedTeamId, selectedMonth, selectedYear, shiftValue as ShiftType);
            }
        }
    };

    const handleGenerate = () => {
        if (selectedTeamId) {
            generateRoster(selectedTeamId, selectedMonth, selectedYear);
        }
    };

    const getAssignment = (userId: string) => {
        return assignments.find(
            a => a.userId === userId &&
                a.teamId === selectedTeamId &&
                a.month === selectedMonth &&
                a.year === selectedYear
        );
    };

    const getPreference = (userId: string) => {
        return preferences.find(
            p => p.userId === userId &&
                p.teamId === selectedTeamId &&
                p.month === selectedMonth &&
                p.year === selectedYear
        );
    };

    const handleExport = () => {
        if (!selectedTeam) return;

        const data = teamUsers.map(user => {
            const assignment = getAssignment(user.id);
            return {
                'Employee Name': user.name,
                'Week Off': user.weekOffType === 'type1' ? 'Fri-Sat' : 'Sun-Mon',
                'Assigned Shift': assignment ? assignment.shiftType : 'Not Assigned'
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Roster");

        const fileName = `Roster_${selectedTeam.name}_${months[selectedMonth]}_${selectedYear}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    return (
        <div className="space-y-8">
            <div className="glass-card rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20">
                        <Calendar className="w-6 h-6 text-indigo-300" />
                    </div>
                    Roster Generation
                </h2>

                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-indigo-200 mb-2 ml-1">Select Team</label>
                        <div className="relative">
                            <select
                                value={selectedTeamId}
                                onChange={(e) => setSelectedTeamId(e.target.value)}
                                className="glass-input w-full appearance-none py-3 px-4 pr-8 rounded-xl leading-tight outline-none font-medium cursor-pointer"
                            >
                                <option value="" className="bg-slate-800 text-gray-400">Select a team...</option>
                                {teams.map((team) => (
                                    <option key={team.id} value={team.id} className="bg-slate-800 text-white">{team.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-indigo-200">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-indigo-200 mb-2 ml-1">Month</label>
                        <div className="relative">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="glass-input w-full appearance-none py-3 px-4 pr-8 rounded-xl leading-tight outline-none font-medium cursor-pointer"
                            >
                                {months.map((m, idx) => (
                                    <option key={idx} value={idx} className="bg-slate-800 text-white">{m}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-indigo-200">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-indigo-200 mb-2 ml-1">Year</label>
                        <div className="relative">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="glass-input w-full appearance-none py-3 px-4 pr-8 rounded-xl leading-tight outline-none font-medium cursor-pointer"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y} className="bg-slate-800 text-white">{y}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-indigo-200">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

                {selectedTeam && (
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
                                                    className="text-sm bg-black/20 border-white/10 text-indigo-200 rounded-lg focus:ring-indigo-500/50 focus:border-indigo-500/50 py-1.5 px-2 outline-none cursor-pointer hover:bg-black/30 transition-colors"
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
                                Export to Excel
                            </button>
                            <button
                                onClick={handleGenerate}
                                className="glass-button px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Generate Roster
                            </button>
                        </div>

                        {/* Results Table */}
                        <div className="overflow-hidden rounded-2xl border border-white/10 shadow-lg">
                            <table className="min-w-full divide-y divide-white/10">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-200 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-200 uppercase tracking-wider">Week Off</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-200 uppercase tracking-wider">Assigned Shift</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 bg-white/5 backdrop-blur-sm">
                                    {teamUsers.map((user) => {
                                        const assignment = getAssignment(user.id);
                                        return (
                                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-indigo-200 font-bold text-xs border border-white/5">
                                                            {user.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-white">{user.name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={clsx(
                                                        "px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-lg border",
                                                        user.weekOffType === 'type1'
                                                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                                            : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                                    )}>
                                                        {user.weekOffType === 'type1' ? 'Fri-Sat' : 'Sun-Mon'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {assignment ? (
                                                        <span className={clsx(
                                                            "px-3 py-1 text-sm font-medium rounded-lg border",
                                                            assignment.shiftType === 'Morning' && "bg-orange-500/10 text-orange-300 border-orange-500/20",
                                                            assignment.shiftType === 'Afternoon' && "bg-amber-500/10 text-amber-300 border-amber-500/20",
                                                            assignment.shiftType === 'Night' && "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                                                        )}>
                                                            {assignment.shiftType}
                                                        </span>
                                                    ) : (
                                                        <span className="text-white/30 text-sm italic">Not Assigned</span>
                                                    )}
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
