import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebase';
import { collection, getDocs, setDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';

export type WeekOffType = 'type1' | 'type2'; // Type 1: Fri-Sat, Type 2: Sun-Mon
export type ShiftType = 'Morning' | 'Afternoon' | 'Night';

export interface Team {
    id: string;
    name: string;
    shiftRequirements: Record<ShiftType, number>;
}

export interface User {
    id: string;
    name: string;
    teamId: string;
    weekOffType: WeekOffType;
}

export interface Preference {
    id: string;
    userId: string;
    teamId: string;
    month: number; // 0-11
    year: number;
    shiftType: ShiftType;
    timestamp?: number;
}

export interface Assignment {
    id: string;
    userId: string;
    teamId: string;
    month: number;
    year: number;
    shiftType: ShiftType;
}

interface AppState {
    teams: Team[];
    users: User[];
    preferences: Preference[];
    assignments: Assignment[];

    fetchData: () => Promise<void>;
    addTeam: (name: string) => Promise<void>;
    removeTeam: (id: string) => Promise<void>;
    addUser: (name: string, teamId: string, weekOffType: WeekOffType) => Promise<void>;
    removeUser: (id: string) => Promise<void>;
    updateUser: (id: string, data: Partial<User>) => Promise<void>;
    updateTeamShiftRequirements: (teamId: string, requirements: Record<ShiftType, number>) => Promise<void>;

    setPreference: (userId: string, teamId: string, month: number, year: number, shiftType: ShiftType) => Promise<void>;
    removePreference: (userId: string, month: number, year: number) => Promise<void>;
    generateRoster: (teamId: string, month: number, year: number) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
    teams: [],
    users: [],
    preferences: [],
    assignments: [],
    // ... (fetchData, addTeam, etc. remain unchanged)


    fetchData: async () => {
        try {
            const teamsSnap = await getDocs(collection(db, 'teams'));
            const usersSnap = await getDocs(collection(db, 'users'));
            const prefsSnap = await getDocs(collection(db, 'preferences'));
            const assignsSnap = await getDocs(collection(db, 'assignments'));

            set({
                teams: teamsSnap.docs.map(d => d.data() as Team),
                users: usersSnap.docs.map(d => d.data() as User),
                preferences: prefsSnap.docs.map(d => d.data() as Preference),
                assignments: assignsSnap.docs.map(d => d.data() as Assignment),
            });
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    },

    addTeam: async (name) => {
        const newTeam: Team = {
            id: uuidv4(),
            name,
            shiftRequirements: { Morning: 0, Afternoon: 0, Night: 0 }
        };
        await setDoc(doc(db, 'teams', newTeam.id), newTeam);
        set((state) => ({ teams: [...state.teams, newTeam] }));
    },

    removeTeam: async (id) => {
        // Delete team
        await deleteDoc(doc(db, 'teams', id));

        // Delete users in team
        const teamUsers = get().users.filter(u => u.teamId === id);
        const batch = writeBatch(db);
        teamUsers.forEach(u => {
            batch.delete(doc(db, 'users', u.id));
        });
        await batch.commit();

        set((state) => ({
            teams: state.teams.filter((t) => t.id !== id),
            users: state.users.filter((u) => u.teamId !== id),
        }));
    },

    addUser: async (name, teamId, weekOffType) => {
        const newUser: User = { id: uuidv4(), name, teamId, weekOffType };
        await setDoc(doc(db, 'users', newUser.id), newUser);
        set((state) => ({ users: [...state.users, newUser] }));
    },

    removeUser: async (id) => {
        await deleteDoc(doc(db, 'users', id));
        set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
    },

    updateUser: async (id, data) => {
        const user = get().users.find(u => u.id === id);
        if (user) {
            const updatedUser = { ...user, ...data };
            await setDoc(doc(db, 'users', id), updatedUser);
            set((state) => ({
                users: state.users.map((u) => (u.id === id ? updatedUser : u)),
            }));
        }
    },

    updateTeamShiftRequirements: async (teamId, requirements) => {
        const team = get().teams.find(t => t.id === teamId);
        if (team) {
            const updatedTeam = {
                ...team,
                shiftRequirements: requirements
            };
            await setDoc(doc(db, 'teams', teamId), updatedTeam);
            set((state) => ({
                teams: state.teams.map((t) => (t.id === teamId ? updatedTeam : t)),
            }));
        }
    },

    setPreference: async (userId, teamId, month, year, shiftType) => {
        const state = get();
        const existingIdx = state.preferences.findIndex(
            p => p.userId === userId && p.month === month && p.year === year
        );

        const newPref: Preference = {
            id: existingIdx >= 0 ? state.preferences[existingIdx].id : uuidv4(),
            userId, teamId, month, year, shiftType,
            timestamp: Date.now()
        };

        await setDoc(doc(db, 'preferences', newPref.id), newPref);

        set((state) => {
            if (existingIdx >= 0) {
                const newPrefs = [...state.preferences];
                newPrefs[existingIdx] = newPref;
                return { preferences: newPrefs };
            }
            return { preferences: [...state.preferences, newPref] };
        });
    },

    removePreference: async (userId, month, year) => {
        const state = get();
        const pref = state.preferences.find(
            p => p.userId === userId && p.month === month && p.year === year
        );

        if (pref) {
            await deleteDoc(doc(db, 'preferences', pref.id));
            set((state) => ({
                preferences: state.preferences.filter(p => p.id !== pref.id)
            }));
        }
    },

    generateRoster: async (teamId, month, year) => {
        const state = get();
        const team = state.teams.find(t => t.id === teamId);
        if (!team) return;

        const teamUsers = state.users.filter(u => u.teamId === teamId);

        // Filter AND Sort by timestamp for FCFS
        const teamPrefs = state.preferences
            .filter(p => p.teamId === teamId && p.month === month && p.year === year)
            .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        // Helper to calculate previous months
        const getPrevMonthYear = (m: number, y: number, offset: number) => {
            let newM = m - offset;
            let newY = y;
            while (newM < 0) {
                newM += 12;
                newY -= 1;
            }
            return { month: newM, year: newY };
        };
        const prev1 = getPrevMonthYear(month, year, 1);
        const prev2 = getPrevMonthYear(month, year, 2);

        // Helper to check history
        const wasAssigned = (userId: string, shift: ShiftType, m: number, y: number) => {
            return state.assignments.some(a =>
                a.userId === userId &&
                a.teamId === teamId &&
                a.month === m &&
                a.year === y &&
                a.shiftType === shift
            );
        };

        const isRotationViolation = (userId: string, shift: ShiftType) => {
            return wasAssigned(userId, shift, prev1.month, prev1.year) &&
                wasAssigned(userId, shift, prev2.month, prev2.year);
        };

        // 1. Clear existing assignments for this month/team
        const otherAssignments = state.assignments.filter(
            a => !(a.teamId === teamId && a.month === month && a.year === year)
        );

        // DB: Delete old assignments
        const oldAssignments = state.assignments.filter(
            a => a.teamId === teamId && a.month === month && a.year === year
        );
        const batch = writeBatch(db);
        oldAssignments.forEach(a => {
            batch.delete(doc(db, 'assignments', a.id));
        });

        const newAssignments: Assignment[] = [];
        const unassignedUsers = new Set(teamUsers.map(u => u.id));

        // Helper to assign
        const assign = (userId: string, shift: ShiftType) => {
            const assignment: Assignment = {
                id: uuidv4(),
                userId,
                teamId,
                month,
                year,
                shiftType: shift
            };
            newAssignments.push(assignment);
            unassignedUsers.delete(userId);
        };

        // 2. Process Preferences First (FCFS based on timestamp)
        teamPrefs.forEach(pref => {
            if (unassignedUsers.has(pref.userId)) {
                // Check Rotation Rule
                if (isRotationViolation(pref.userId, pref.shiftType)) {
                    return; // Skip preference if it violates rotation
                }

                const currentAssignments = newAssignments.filter(a => a.shiftType === pref.shiftType);
                const currentCount = currentAssignments.length;
                const limit = team.shiftRequirements[pref.shiftType];

                if (currentCount < limit) {
                    // Enforce Strict Balancing Rule for Preferences
                    const maxPerType = Math.ceil(limit / 2);

                    let type1Count = 0;
                    let type2Count = 0;

                    currentAssignments.forEach(a => {
                        const u = teamUsers.find(user => user.id === a.userId);
                        if (u?.weekOffType === 'type1') type1Count++;
                        else if (u?.weekOffType === 'type2') type2Count++;
                    });

                    const currentUser = teamUsers.find(u => u.id === pref.userId);

                    if (currentUser) {
                        if (currentUser.weekOffType === 'type1' && type1Count >= maxPerType) {
                            return; // Skip: Quota for Type 1 full
                        }
                        if (currentUser.weekOffType === 'type2' && type2Count >= maxPerType) {
                            return; // Skip: Quota for Type 2 full
                        }
                    }

                    assign(pref.userId, pref.shiftType);
                }
            }
        });

        // Helper to shuffle array (Fisher-Yates)
        const shuffleArray = <T>(array: T[]): T[] => {
            const newArray = [...array];
            for (let i = newArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
            }
            return newArray;
        };

        // ... (assignments clearing logic)

        // 3. Fill remaining slots with Logic
        (['Morning', 'Afternoon', 'Night'] as ShiftType[]).forEach(shift => {
            const limit = team.shiftRequirements[shift];
            let currentCount = newAssignments.filter(a => a.shiftType === shift).length;
            let needed = limit - currentCount;

            if (needed <= 0) return;

            // Get available users split by WeekOffType
            // Shuffle available users first to ensure randomness
            const available = shuffleArray(teamUsers.filter(u =>
                unassignedUsers.has(u.id) &&
                !isRotationViolation(u.id, shift)
            ));

            const type1Users = available.filter(u => u.weekOffType === 'type1'); // Fri-Sat
            const type2Users = available.filter(u => u.weekOffType === 'type2'); // Sun-Mon

            let takeFromType1 = 0;
            let takeFromType2 = 0;

            // Target is to split as evenly as possible
            const targetType1 = Math.floor(needed / 2);

            // Take what we can for Type 1 up to target
            takeFromType1 = Math.min(type1Users.length, targetType1);

            // The rest must come from Type 2
            let remaining = needed - takeFromType1;
            takeFromType2 = Math.min(type2Users.length, remaining);

            // If we still need more (because Type 2 didn't have enough), go back to Type 1
            remaining = needed - (takeFromType1 + takeFromType2);
            if (remaining > 0) {
                const extraFrom1 = Math.min(type1Users.length - takeFromType1, remaining);
                takeFromType1 += extraFrom1;
            }

            // Execute Assignment
            type1Users.slice(0, takeFromType1).forEach(u => assign(u.id, shift));
            type2Users.slice(0, takeFromType2).forEach(u => assign(u.id, shift));
        });

        // 4. Assign any remaining users to random available slots (Cleanup)
        (['Morning', 'Afternoon', 'Night'] as ShiftType[]).forEach(shift => {
            const limit = team.shiftRequirements[shift];
            const currentCount = newAssignments.filter(a => a.shiftType === shift).length;
            if (currentCount < limit) {
                const needed = limit - currentCount;
                const available = shuffleArray(teamUsers.filter(u =>
                    unassignedUsers.has(u.id) &&
                    !isRotationViolation(u.id, shift)
                ));
                available.slice(0, needed).forEach(u => assign(u.id, shift));
            }
        });

        // DB: Save new assignments
        newAssignments.forEach(a => {
            batch.set(doc(db, 'assignments', a.id), a);
        });
        await batch.commit();

        set({ assignments: [...otherAssignments, ...newAssignments] });
    },
}));
