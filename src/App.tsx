import { useState, useEffect } from 'react';
import { TeamManagement } from './components/TeamManagement';
import { ShiftConfiguration } from './components/ShiftConfiguration';
import { RosterView } from './components/RosterView';
import { Login } from './components/Login';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { Users, Settings, Calendar, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from './store/useStore';

function App() {
  const [currentView, setCurrentView] = useState<'team' | 'config' | 'roster'>('team');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchData = useStore(state => state.fetchData);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchData();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchData]);

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen">
      {/* Glass Header */}
      <header className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8 mb-8">
        <div className="max-w-7xl mx-auto glass-card rounded-2xl px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Shift Roster Pro</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-white">Administrator</span>
              <span className="text-xs text-indigo-200">{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl text-indigo-100 hover:bg-white/10 hover:text-white transition-all border border-transparent hover:border-white/10"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Glass Navigation Tabs */}
        <div className="glass-card p-1.5 rounded-2xl mb-8 w-fit mx-auto flex space-x-1">
          <button
            onClick={() => setCurrentView('team')}
            className={clsx(
              'flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300',
              currentView === 'team'
                ? 'bg-white/15 text-white shadow-lg border border-white/10'
                : 'text-indigo-200 hover:text-white hover:bg-white/5'
            )}
          >
            <Users className="w-4 h-4" />
            Team Management
          </button>
          <button
            onClick={() => setCurrentView('config')}
            className={clsx(
              'flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300',
              currentView === 'config'
                ? 'bg-white/15 text-white shadow-lg border border-white/10'
                : 'text-indigo-200 hover:text-white hover:bg-white/5'
            )}
          >
            <Settings className="w-4 h-4" />
            Shift Configuration
          </button>
          <button
            onClick={() => setCurrentView('roster')}
            className={clsx(
              'flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300',
              currentView === 'roster'
                ? 'bg-white/15 text-white shadow-lg border border-white/10'
                : 'text-indigo-200 hover:text-white hover:bg-white/5'
            )}
          >
            <Calendar className="w-4 h-4" />
            Roster View
          </button>
        </div>

        {/* View Content */}
        <div className="animate-fadeIn">
          {currentView === 'team' && <TeamManagement />}
          {currentView === 'config' && <ShiftConfiguration />}
          {currentView === 'roster' && <RosterView />}
        </div>
      </main>
    </div>
  );
}

export default App;
