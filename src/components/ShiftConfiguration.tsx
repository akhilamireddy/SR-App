import React, { useState, useEffect } from 'react';
import { useStore, type ShiftType } from '../store/useStore';
import { Sun, Moon, Sunset, Users, AlertCircle, ChevronDown, Save, Edit2, X, Check } from 'lucide-react';
import clsx from 'clsx';

export const ShiftConfiguration: React.FC = () => {
    const { teams, users, updateTeamShiftRequirements } = useStore();
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const [localConfig, setLocalConfig] = useState<Record<ShiftType, number>>({ Morning: 0, Afternoon: 0, Night: 0 });
    const [showSuccess, setShowSuccess] = useState(false);

    // Auto-select first team
    useEffect(() => {
        if (teams.length > 0 && !selectedTeamId) {
            setSelectedTeamId(teams[0].id);
        }
    }, [teams, selectedTeamId]);

    const selectedTeam = teams.find(t => t.id === selectedTeamId);

    // Sync local config when team changes or edit starts
    useEffect(() => {
        if (selectedTeam) {
            setLocalConfig(selectedTeam.shiftRequirements);
        }
    }, [selectedTeam, isEditing]);

    const teamUsers = users.filter(u => u.teamId === selectedTeamId);
    const totalUsers = teamUsers.length;

    // Calculate total from LOCAL config while editing, otherwise from STORE
    const currentConfig = isEditing ? localConfig : (selectedTeam?.shiftRequirements || { Morning: 0, Afternoon: 0, Night: 0 });

    const totalRequired = Object.values(currentConfig).reduce((a, b) => a + b, 0);
    const isBalanced = totalRequired === totalUsers;

    const handleSave = () => {
        if (selectedTeam) {
            updateTeamShiftRequirements(selectedTeam.id, localConfig);
            setIsEditing(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (selectedTeam) {
            setLocalConfig(selectedTeam.shiftRequirements);
        }
    };

    const updateLocalConfig = (shift: ShiftType, val: number) => {
        setLocalConfig(prev => ({ ...prev, [shift]: val }));
    };

    const getIcon = (shift: ShiftType) => {
        switch (shift) {
            case 'Morning': return <Sun className="w-6 h-6 text-orange-500" />;
            case 'Afternoon': return <Sunset className="w-6 h-6 text-amber-600" />;
            case 'Night': return <Moon className="w-6 h-6 text-indigo-600" />;
        }
    };

    const getDescription = (shift: ShiftType) => {
        switch (shift) {
            case 'Morning': return 'Start the day fresh. Typically 6 AM - 2 PM.';
            case 'Afternoon': return 'Mid-day operations. Typically 2 PM - 10 PM.';
            case 'Night': return 'Overnight coverage. Typically 10 PM - 6 AM.';
        }
    };

    if (teams.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900">No Teams Found</h3>
                <p className="text-gray-500">Please create a team in the Team Management section first.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">

                {/* Team Selector */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end gap-4 justify-between">
                    <div className="w-full md:w-1/3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Project / Team</label>
                        <div className="relative">
                            <select
                                value={selectedTeamId}
                                onChange={(e) => {
                                    setSelectedTeamId(e.target.value);
                                    setIsEditing(false);
                                }}
                                className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 font-medium"
                            >
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium flex items-center gap-2 shadow-sm"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-medium flex items-center gap-2"
                            >
                                <Edit2 className="w-4 h-4" />
                                Edit Configuration
                            </button>
                        )}
                    </div>
                </div>

                {selectedTeam && (
                    <>
                        <div className="flex justify-between items-start mb-6 border-t border-gray-100 pt-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <Users className="w-6 h-6 text-indigo-600" />
                                    Shift Distribution for {selectedTeam.name}
                                </h2>
                                <p className="text-gray-500 mt-1">
                                    {isEditing ? "Adjust the numbers below." : "Current approved distribution."}
                                </p>
                            </div>

                            <div className={clsx(
                                "px-4 py-2 rounded-lg border flex items-center gap-2 transition-all duration-300",
                                isBalanced ? "bg-green-50 border-green-200 text-green-700" : "bg-amber-50 border-amber-200 text-amber-700"
                            )}>
                                {isBalanced ? (
                                    <span className="font-medium flex items-center gap-2">
                                        <Check className="w-4 h-4" />
                                        Balanced
                                    </span>
                                ) : (
                                    <span className="font-medium flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        {totalRequired < totalUsers
                                            ? `${totalUsers - totalRequired} unassigned`
                                            : `${totalRequired - totalUsers} over capacity`}
                                    </span>
                                )}
                            </div>
                        </div>

                        {showSuccess && (
                            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <Check className="w-5 h-5" />
                                Configuration saved successfully!
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {(['Morning', 'Afternoon', 'Night'] as ShiftType[]).map((shiftName) => (
                                <div key={shiftName} className={clsx(
                                    "rounded-xl p-6 border transition-all duration-300",
                                    isEditing ? "bg-white border-indigo-200 shadow-md" : "bg-gray-50 border-gray-200"
                                )}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-white rounded-lg shadow-sm">
                                            {getIcon(shiftName)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{shiftName}</h3>
                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-600 mb-6 h-10">
                                        {getDescription(shiftName)}
                                    </p>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Required Staff</label>
                                        <div className="flex items-center gap-3">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        onClick={() => updateLocalConfig(shiftName, Math.max(0, localConfig[shiftName] - 1))}
                                                        className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 hover:border-indigo-500 hover:text-indigo-600 flex items-center justify-center font-bold text-lg transition-all"
                                                    >
                                                        -
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={localConfig[shiftName]}
                                                        onChange={(e) => updateLocalConfig(shiftName, Math.max(0, parseInt(e.target.value) || 0))}
                                                        className="flex-1 text-center font-bold text-xl py-1.5 rounded-lg border-gray-200 bg-white shadow-inner focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                    <button
                                                        onClick={() => updateLocalConfig(shiftName, localConfig[shiftName] + 1)}
                                                        className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 hover:border-indigo-500 hover:text-indigo-600 flex items-center justify-center font-bold text-lg transition-all"
                                                    >
                                                        +
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="w-full text-center font-bold text-2xl py-2 text-gray-800 bg-gray-100 rounded-lg border border-transparent">
                                                    {currentConfig[shiftName]}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between items-center">
                            <div className="flex gap-8">
                                <div>
                                    <span className="block text-sm text-indigo-600 font-medium">Team Size</span>
                                    <span className="text-2xl font-bold text-indigo-900">{totalUsers}</span>
                                </div>
                                <div>
                                    <span className="block text-sm text-indigo-600 font-medium">Assigned Slots</span>
                                    <span className="text-2xl font-bold text-indigo-900">{totalRequired}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
