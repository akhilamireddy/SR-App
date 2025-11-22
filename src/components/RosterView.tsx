import React, { useState } from 'react';
import { useStore, type ShiftType } from '../store/useStore';
import { Calendar, RefreshCw, Download } from 'lucide-react';
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
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                    Roster Generation
                </h2>

                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Team</label>
                        <select
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        >
                            <option value="">Select a team...</option>
                            {teams.map((team) => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        >
                            {months.map((m, idx) => (
                                <option key={idx} value={idx}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        >
                            {years.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedTeam && (
                    <>
                        {/* Preferences Section */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">User Preferences</h3>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {teamUsers.map((user) => {
                                        const pref = getPreference(user.id);
                                        return (
                                            <div key={user.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                        {user.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-gray-700">{user.name}</span>
                                                </div>
                                                <select
                                                    value={pref?.shiftType || ''}
                                                    onChange={(e) => handlePreferenceChange(user.id, e.target.value)}
                                                    className="text-sm border-gray-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                >
                                                    <option value="">No Pref</option>
                                                    <option value="Morning">Morning</option>
                                                    <option value="Afternoon">Afternoon</option>
                                                    <option value="Night">Night</option>
                                                </select>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Action */}
                        <div className="flex justify-end gap-3 mb-8">
                            <button
                                onClick={handleExport}
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-md"
                            >
                                <Download className="w-5 h-5" />
                                Export to Excel
                            </button>
                            <button
                                onClick={handleGenerate}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-md"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Generate Roster
                            </button>
                        </div>

                        {/* Results Table */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week Off</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Shift</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {teamUsers.map((user) => {
                                        const assignment = getAssignment(user.id);
                                        return (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                                                            {user.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={clsx(
                                                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                                        user.weekOffType === 'type1' ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                                                    )}>
                                                        {user.weekOffType === 'type1' ? 'Fri-Sat' : 'Sun-Mon'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {assignment ? (
                                                        <span className={clsx(
                                                            "px-2 py-1 text-sm font-medium rounded-md",
                                                            assignment.shiftType === 'Morning' && "bg-yellow-100 text-yellow-800",
                                                            assignment.shiftType === 'Afternoon' && "bg-orange-100 text-orange-800",
                                                            assignment.shiftType === 'Night' && "bg-indigo-100 text-indigo-800"
                                                        )}>
                                                            {assignment.shiftType}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm italic">Not Assigned</span>
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
