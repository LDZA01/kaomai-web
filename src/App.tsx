import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import EmployerDashboard from './pages/employer/EmployerDashboard';
import CreateJob from './pages/employer/CreateJob';
import Matches from './pages/employer/Matches';
import Matching from './pages/shelter/Matching';
import Residents from './pages/shelter/Residents';
import ShelterDashboard from './pages/shelter/ShelterDashboard';

const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />
        <div className="mx-auto flex max-w-7xl">
          <Sidebar />
          <main className="min-h-[calc(100vh-73px)] flex-1 p-4 sm:p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/shelter/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/shelter/dashboard" element={<ShelterDashboard />} />
              <Route path="/shelter/residents" element={<Residents />} />
              <Route path="/shelter/matching" element={<Matching />} />
              <Route path="/employer/dashboard" element={<EmployerDashboard />} />
              <Route path="/employer/create-job" element={<CreateJob />} />
              <Route path="/employer/matches" element={<Matches />} />
              <Route path="*" element={<Navigate to="/shelter/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
