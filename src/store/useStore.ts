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
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    shiftType: ShiftType;
    timestamp?: number;
}

export interface Assignment {
    id: string;
    userId: string;
    teamId: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    shiftType: ShiftType;
}

export interface RosterLock {
    id: string;
    teamId: string;
    startDate: string;
    endDate: string;
    lockedAt: number;
}

interface AppState {
    teams: Team[];
    users: User[];
    preferences: Preference[];
    assignments: Assignment[];
    rosterLocks: RosterLock[];

    fetchData: () => Promise<void>;
    addTeam: (name: string) => Promise<void>;
    removeTeam: (id: string) => Promise<void>;
    addUser: (name: string, teamId: string, weekOffType: WeekOffType) => Promise<void>;
    removeUser: (id: string) => Promise<void>;
    updateUser: (id: string, data: Partial<User>) => Promise<void>;
    updateTeamShiftRequirements: (teamId: string, requirements: Record<ShiftType, number>) => Promise<void>;

    setPreference: (userId: string, teamId: string, startDate: string, endDate: string, shiftType: ShiftType) => Promise<void>;
    removePreference: (userId: string, startDate: string, endDate: string) => Promise<void>;
    generateRoster: (teamId: string, startDate: string, endDate: string) => Promise<void>;

    addRosterLock: (teamId: string, startDate: string, endDate: string) => Promise<void>;
    removeRosterLock: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
    teams: [],
    users: [],
    preferences: [],
    assignments: [],
    rosterLocks: [],

    fetchData: async () => {
        try {
            const teamsSnap = await getDocs(collection(db, 'teams'));
            const usersSnap = await getDocs(collection(db, 'users'));
            const prefsSnap = await getDocs(collection(db, 'preferences'));
            const assignsSnap = await getDocs(collection(db, 'assignments'));
            const locksSnap = await getDocs(collection(db, 'roster_locks'));

            set({
                teams: teamsSnap.docs.map(d => d.data() as Team),
                users: usersSnap.docs.map(d => d.data() as User),
                preferences: prefsSnap.docs.map(d => d.data() as Preference),
                assignments: assignsSnap.docs.map(d => d.data() as Assignment),
                rosterLocks: locksSnap.docs.map(d => d.data() as RosterLock),
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
        await deleteDoc(doc(db, 'teams', id));
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

    setPreference: async (userId, teamId, startDate, endDate, shiftType) => {
        const state = get();
        const existingIdx = state.preferences.findIndex(
            p => p.userId === userId && p.startDate === startDate && p.endDate === endDate
        );

        const newPref: Preference = {
            id: existingIdx >= 0 ? state.preferences[existingIdx].id : uuidv4(),
            userId, teamId, startDate, endDate, shiftType,
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

    removePreference: async (userId, startDate, endDate) => {
        const state = get();
        const pref = state.preferences.find(
            p => p.userId === userId && p.startDate === startDate && p.endDate === endDate
        );

        if (pref) {
            await deleteDoc(doc(db, 'preferences', pref.id));
            set((state) => ({
                preferences: state.preferences.filter(p => p.id !== pref.id)
            }));
        }
    },

    addRosterLock: async (teamId, startDate, endDate) => {
        const newLock: RosterLock = {
            id: uuidv4(),
            teamId,
            startDate,
            endDate,
            lockedAt: Date.now()
        };
        await setDoc(doc(db, 'roster_locks', newLock.id), newLock);
        set((state) => ({ rosterLocks: [...state.rosterLocks, newLock] }));
    },

    removeRosterLock: async (id) => {
        await deleteDoc(doc(db, 'roster_locks', id));
        set((state) => ({ rosterLocks: state.rosterLocks.filter(l => l.id !== id) }));
    },

    generateRoster: async (teamId, startDate, endDate) => {
        const state = get();
        const team = state.teams.find(t => t.id === teamId);
        if (!team) return;

        // Check if locked
        const isLocked = state.rosterLocks.some(
            l => l.teamId === teamId &&
                ((startDate >= l.startDate && startDate <= l.endDate) ||
                    (endDate >= l.startDate && endDate <= l.endDate) ||
                    (startDate <= l.startDate && endDate >= l.endDate))
        );

        if (isLocked) {
            console.warn("Cannot generate roster for locked period.");
            return;
        }

        const teamUsers = state.users.filter(u => u.teamId === teamId);

        // Filter AND Sort by timestamp for FCFS
        const teamPrefs = state.preferences
            .filter(p => p.teamId === teamId && p.startDate === startDate && p.endDate === endDate)
            .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        // Helper to check history (Rotation Logic)
        const getPreviousAssignment = (userId: string) => {
            const userAssignments = state.assignments
                .filter(a => a.userId === userId && a.teamId === teamId && a.endDate < startDate)
                .sort((a, b) => b.endDate.localeCompare(a.endDate));

            return userAssignments.length > 0 ? userAssignments[0] : null;
        };

        const isRotationViolation = (userId: string, shift: ShiftType) => {
            const prev = getPreviousAssignment(userId);
            // Avoid Night -> Morning
            if (prev && prev.shiftType === 'Night' && shift === 'Morning') return true;
            return false;
        };

        // 1. Clear existing assignments for this range/team
        const otherAssignments = state.assignments.filter(
            a => !(a.teamId === teamId && a.startDate === startDate && a.endDate === endDate)
        );

        // DB: Delete old assignments
        const oldAssignments = state.assignments.filter(
            a => a.teamId === teamId && a.startDate === startDate && a.endDate === endDate
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
                startDate,
                endDate,
                shiftType: shift
            };
            newAssignments.push(assignment);
            unassignedUsers.delete(userId);
        };

        // Helper to shuffle array (Fisher-Yates)
        const shuffleArray = <T>(array: T[]): T[] => {
            const newArray = [...array];
            for (let i = newArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
            }
            return newArray;
        };

        // Process each shift type
        (['Morning', 'Afternoon', 'Night'] as ShiftType[]).forEach(shift => {
            const limit = team.shiftRequirements[shift];
            if (limit === 0) return;

            // Calculate Strict Quotas
            // Even (2N): Quota1 = N, Quota2 = N, Flex = 0
            // Odd (2N+1): Quota1 = N, Quota2 = N, Flex = 1
            const baseQuota = Math.floor(limit / 2);
            let quotaType1 = baseQuota;
            let quotaType2 = baseQuota;
            let flexibleSlots = limit % 2;

            let filledType1 = 0;
            let filledType2 = 0;

            // 2. Process Preferences First (Strictly adhering to quotas)
            const shiftPrefs = teamPrefs.filter(p => p.shiftType === shift);

            shiftPrefs.forEach(pref => {
                if (unassignedUsers.has(pref.userId)) {
                    if (isRotationViolation(pref.userId, shift)) return;

                    const user = teamUsers.find(u => u.id === pref.userId);
                    if (!user) return;

                    if (user.weekOffType === 'type1') {
                        if (filledType1 < quotaType1) {
                            assign(user.id, shift);
                            filledType1++;
                        } else if (flexibleSlots > 0) {
                            assign(user.id, shift);
                            filledType1++;
                            flexibleSlots--;
                        }
                        // Else: Skip preference because it violates base logic
                    } else if (user.weekOffType === 'type2') {
                        if (filledType2 < quotaType2) {
                            assign(user.id, shift);
                            filledType2++;
                        } else if (flexibleSlots > 0) {
                            assign(user.id, shift);
                            filledType2++;
                            flexibleSlots--;
                        }
                        // Else: Skip preference because it violates base logic
                    }
                }
            });

            // 3. Fill Remaining Quotas with Random Users
            const availableUsers = shuffleArray(teamUsers.filter(u =>
                unassignedUsers.has(u.id) && !isRotationViolation(u.id, shift)
            ));

            const type1Users = availableUsers.filter(u => u.weekOffType === 'type1');
            const type2Users = availableUsers.filter(u => u.weekOffType === 'type2');

            // Fill needed Type 1
            let needed1 = Math.max(0, quotaType1 - filledType1);
            // Note: filledType1 might be > quotaType1 if we used flexible slot. In that case needed1 is 0.

            type1Users.forEach(u => {
                if (needed1 > 0 && unassignedUsers.has(u.id)) {
                    assign(u.id, shift);
                    needed1--;
                    filledType1++;
                }
            });

            // Fill needed Type 2
            let needed2 = Math.max(0, quotaType2 - filledType2);
            type2Users.forEach(u => {
                if (needed2 > 0 && unassignedUsers.has(u.id)) {
                    assign(u.id, shift);
                    needed2--;
                    filledType2++;
                }
            });

            // 4. Fill Flexible Slot (if still available)
            if (flexibleSlots > 0) {
                // We need 1 more user of ANY type (since flexible slot is open)
                // Re-fetch available because we just assigned some
                const remainingAvailable = shuffleArray(teamUsers.filter(u =>
                    unassignedUsers.has(u.id) && !isRotationViolation(u.id, shift)
                ));

                if (remainingAvailable.length > 0) {
                    assign(remainingAvailable[0].id, shift);
                    flexibleSlots--;
                }
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
