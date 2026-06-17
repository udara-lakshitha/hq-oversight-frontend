import { useState } from 'react';
import LandingPage from './components/LandingPage';
import RegisterForm from './components/RegisterForm';

function App() {
  const [view, setView] = useState('landing');

  if (view === 'landing') {
    return <LandingPage setView={setView} />;
  }

  if (view === 'register') {
    return <RegisterForm setView={setView} />;
  }

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center space-y-4">
          <h2 className="text-2xl font-black text-slate-900">Student Login</h2>
          <p className="text-sm font-medium text-slate-500 bg-amber-50 text-amber-700 border border-amber-200 p-3 rounded-xl">
            ⚠️ Login sub-systems view placeholder active. Ready to build authentication layers next!
          </p>
          <button 
            onClick={() => setView('landing')} 
            className="text-sm font-bold text-blue-600 hover:underline block mx-auto cursor-pointer"
          >
            ← Back to Main Menu
          </button>
        </div>
      </div>
    );
  }
}

export default App;