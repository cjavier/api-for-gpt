//import logo from './logo.png';
import './App.css';
import Login from './components/Accounts/Login';
import Dashboard from './components/Dashboard';
import Account from './components/Accounts/Account';
import Onboarding from './components/Onboarding/Onboarding';
import Register from './components/Accounts/Register';
import ForgotPassword from './components/ForgotPassword';
import SAT from './components/SAT';
import FacturasSAT from './components/FacturasSAT';
import TransaccionesSAT from './components/TransaccionesSAT';


import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import React, { useContext } from 'react';
import { AuthContext } from './AuthContext';

function App() {
  const { currentUser } = useContext(AuthContext);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cuenta" element={<Account />} />
          <Route path="/integrar-sat" element={<SAT />} />
          <Route path="/facturas-sat" element={<FacturasSAT />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/transacciones-sat" element={<TransaccionesSAT />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
