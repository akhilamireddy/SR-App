import React, { useState, useEffect } from 'react';
import { useStore, type ShiftType } from '../store/useStore';
import { Sun, Moon, Sunset, Users, AlertCircle, Save, Edit2, X, Check } from 'lucide-react';
import clsx from 'clsx';
import { GlassSelect } from './ui/GlassSelect';

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
            case 'Morning': return <Sun className="w-6 h-6 text-orange-400" />;
            case 'Afternoon': return <Sunset className="w-6 h-6 text-amber-400" />;
            case 'Night': return <Moon className="w-6 h-6 text-indigo-400" />;
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
            <div className="text-center py-16 glass-card rounded-2xl">
                <Users className="w-16 h-16 mx-auto mb-4 text-indigo-200/30" />
                <h3 className="text-xl font-medium text-white">No Teams Found</h3>
                <p className="text-indigo-200 mt-2">Please create a team in the Team Management section first.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="glass-card rounded-2xl p-8">

                {/* Team Selector */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end gap-6 justify-between">
                    <div className="w-full md:w-1/3">
                        <GlassSelect
                            label="Select Project / Team"
                            value={selectedTeamId}
                            onChange={(val) => {
                                setSelectedTeamId(val);
                                setIsEditing(false);
                            }}
                            options={teams.map(team => ({ value: team.id, label: team.name }))}
                            placeholder="Select a team..."
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleCancel}
                                    className="px-6 py-2.5 rounded-xl border border-white/10 text-indigo-200 hover:bg-white/5 hover:text-white font-medium flex items-center gap-2 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="glass-button px-6 py-2.5 rounded-xl font-medium flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-6 py-2.5 rounded-xl border border-indigo-400/30 text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 hover:text-white font-medium flex items-center gap-2 transition-all"
                            >
                                <Edit2 className="w-4 h-4" />
                                Edit Configuration
                            </button>
                        )}
                    </div>
                </div>

                {selectedTeam && (
                    <>
                        <div className="flex justify-between items-start mb-8 border-t border-white/10 pt-8">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-indigo-500/20">
                                        <Users className="w-6 h-6 text-indigo-300" />
                                    </div>
                                    Shift Distribution for {selectedTeam.name}
                                </h2>
                                <p className="text-indigo-200/70 mt-2 ml-1">
                                    {isEditing ? "Adjust the numbers below." : "Current approved distribution."}
                                </p>
                            </div>

                            <div className={clsx(
                                "px-4 py-2 rounded-xl border flex items-center gap-2 transition-all duration-300 backdrop-blur-sm",
                                isBalanced
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                                    : "bg-amber-500/10 border-amber-500/20 text-amber-300"
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
                            <div className="mb-8 p-4 bg-emerald-500/10 text-emerald-300 rounded-xl border border-emerald-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <div className="p-1 rounded-full bg-emerald-500/20">
                                    <Check className="w-4 h-4" />
                                </div>
                                Configuration saved successfully!
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {(['Morning', 'Afternoon', 'Night'] as ShiftType[]).map((shiftName) => (
                                <div key={shiftName} className={clsx(
                                    "rounded-2xl p-6 border transition-all duration-300",
                                    isEditing
                                        ? "bg-white/10 border-indigo-400/30 shadow-lg shadow-indigo-500/10"
                                        : "bg-white/5 border-white/5 hover:bg-white/10"
                                )}>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                            {getIcon(shiftName)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{shiftName}</h3>
                                            <span className="text-xs font-medium text-indigo-300 uppercase tracking-wider">Shift</span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-indigo-200/70 mb-8 h-10 leading-relaxed">
                                        {getDescription(shiftName)}
                                    </p>

                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-indigo-200 ml-1">Required Staff</label>
                                        <div className="flex items-center gap-2">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        onClick={() => updateLocalConfig(shiftName, Math.max(0, localConfig[shiftName] - 1))}
                                                        className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 hover:border-indigo-400 hover:text-indigo-300 hover:bg-white/10 flex items-center justify-center font-bold text-lg text-white transition-all shrink-0"
                                                    >
                                                        -
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={localConfig[shiftName]}
                                                        onChange={(e) => updateLocalConfig(shiftName, Math.max(0, parseInt(e.target.value) || 0))}
                                                        className="flex-1 min-w-[60px] text-center font-bold text-xl py-1.5 rounded-lg border border-white/10 bg-black/20 text-white shadow-inner focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                                    />
                                                    <button
                                                        onClick={() => updateLocalConfig(shiftName, localConfig[shiftName] + 1)}
                                                        className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 hover:border-indigo-400 hover:text-indigo-300 hover:bg-white/10 flex items-center justify-center font-bold text-lg text-white transition-all shrink-0"
                                                    >
                                                        +
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="w-full text-center font-bold text-3xl py-3 text-white bg-white/5 rounded-xl border border-white/5">
                                                    {currentConfig[shiftName]}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-6 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex justify-between items-center backdrop-blur-sm">
                            <div className="flex gap-12">
                                <div>
                                    <span className="block text-sm text-indigo-300 font-medium mb-1">Team Size</span>
                                    <span className="text-3xl font-bold text-white">{totalUsers}</span>
                                </div>
                                <div>
                                    <span className="block text-sm text-indigo-300 font-medium mb-1">Assigned Slots</span>
                                    <span className="text-3xl font-bold text-white">{totalRequired}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
