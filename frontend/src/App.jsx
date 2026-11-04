import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import VoterForm from './pages/VoterForm.jsx';
import VoterList from './pages/VoterList.jsx';
import VoterDetail from './pages/VoterDetail.jsx';
import VoterEdit from './pages/VoterEdit.jsx';
import Search from './pages/Search.jsx';
import Reports from './pages/Reports.jsx';
import Users from './pages/Users.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import Settings from './pages/Settings.jsx';
import Vote from './pages/Vote.jsx';
import Results from './pages/Results.jsx';
import NotFound from './pages/NotFound.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Elections from './pages/admin/Elections.jsx';
import Positions from './pages/admin/Positions.jsx';
import Candidates from './pages/admin/Candidates.jsx';
import Turnout from './pages/Turnout.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import VerifyVote from './pages/VerifyVote.jsx';
<Route path="/verify-vote" element={<VerifyVote />} />

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/vote" element={<Vote />} />
      <Route path="/results" element={<Results />} />
<Route path="/turnout" element={<Turnout />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
       
      </Route>
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/voters" element={<VoterList />} />
        <Route path="/voters/new" element={<ProtectedRoute roles={['ADMINISTRATOR', 'REGISTRATION_OFFICER']}><VoterForm /></ProtectedRoute>} />
        <Route path="/voters/:id" element={<VoterDetail />} />
        <Route path="/voters/:id/edit" element={<ProtectedRoute roles={['ADMINISTRATOR', 'REGISTRATION_OFFICER']}><VoterEdit /></ProtectedRoute>} />
        <Route path="/search" element={<Search />} />
        <Route path="/reports" element={<ProtectedRoute roles={['ADMINISTRATOR', 'REGISTRATION_OFFICER']}><Reports /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute roles={['ADMINISTRATOR']}><Users /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute roles={['ADMINISTRATOR']}><AuditLogs /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute roles={['ADMINISTRATOR']}><Settings /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<NotFound />} />
<Route path="/admin/elections" element={<ProtectedRoute roles={['ADMINISTRATOR']}><Elections /></ProtectedRoute>} />
<Route path="/admin/positions" element={<ProtectedRoute roles={['ADMINISTRATOR']}><Positions /></ProtectedRoute>} />
<Route path="/admin/candidates" element={<ProtectedRoute roles={['ADMINISTRATOR']}><Candidates /></ProtectedRoute>} />
    </Routes>
  );
}