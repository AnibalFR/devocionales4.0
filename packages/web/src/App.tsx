import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './lib/apollo';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { FamiliasPage } from './pages/FamiliasPage';
import { MiembrosPage } from './pages/MiembrosPage';
import { VisitasPage } from './pages/VisitasPage';
import { DevocionalesPage } from './pages/DevocionalesPage';
import { MetasPage } from './pages/MetasPage';
import { ReporteCicloPage } from './pages/ReporteCicloPage';
import { BarriosPage } from './pages/BarriosPage';
import { NucleosPage } from './pages/NucleosPage';
import { ExportarImportarPage } from './pages/ExportarImportarPage';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={<Navigate to="/familias" replace />}
      />
      <Route
        path="/familias"
        element={
          <ProtectedRoute>
            <Layout>
              <FamiliasPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/miembros"
        element={
          <ProtectedRoute>
            <Layout>
              <MiembrosPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/visitas"
        element={
          <ProtectedRoute>
            <Layout>
              <VisitasPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/devocionales"
        element={
          <ProtectedRoute>
            <Layout>
              <DevocionalesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/metas"
        element={
          <ProtectedRoute>
            <Layout>
              <MetasPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reporte-ciclo"
        element={
          <ProtectedRoute>
            <Layout>
              <ReporteCicloPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/barrios"
        element={
          <ProtectedRoute>
            <Layout>
              <BarriosPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/nucleos"
        element={
          <ProtectedRoute>
            <Layout>
              <NucleosPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/exportar-importar"
        element={
          <ProtectedRoute>
            <Layout>
              <ExportarImportarPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ApolloProvider>
  );
}

export default App;
