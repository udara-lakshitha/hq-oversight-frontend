import { useState } from 'react';
import LandingPage from './components/LandingPage';
import RegisterForm from './components/RegisterForm';
import Login from './components/Login';

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
        <Login />
        
        <button 
          onClick={() => setView('landing')} 
          className="mt-6 text-sm font-bold text-slate-500 hover:text-slate-800 transition block mx-auto cursor-pointer"
        >
          ← Back to Main Menu
        </button>
      </div>
    );
  }
}

export default App;