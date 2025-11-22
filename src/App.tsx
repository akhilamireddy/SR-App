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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Shift Roster Pro</h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden md:block">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm mb-8 w-fit mx-auto border border-gray-100">
          <button
            onClick={() => setCurrentView('team')}
            className={clsx(
              'flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              currentView === 'team'
                ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            <Users className="w-4 h-4" />
            Team Management
          </button>
          <button
            onClick={() => setCurrentView('config')}
            className={clsx(
              'flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              currentView === 'config'
                ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            <Settings className="w-4 h-4" />
            Shift Configuration
          </button>
          <button
            onClick={() => setCurrentView('roster')}
            className={clsx(
              'flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              currentView === 'roster'
                ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
