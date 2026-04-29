import { Home } from "./pages/Home/home"
import { SignIn } from "@/pages/SignIn/sign-in"
import { DefaultLayout } from "@/layouts/default-layout"
import { SidebarLayout } from "@/layouts/sidebar-layout"
import { Routes, Route, Navigate } from "react-router"
import { ProtectedRoute } from "@/components/ProtectRoute/protected-route"
import { InternalProtectedRoute } from "@/components/ProtectRoute/internal-protected-route"
import { Profissionais } from "@/pages/Profissionais/profissionais"
import { ProfessionalProfile } from "@/pages/Profissionais/professional-profile"
import { Pacientes } from "@/pages/Pacientes/pacientes"
import { Agendamentos } from "@/pages/Agendamentos/agendamentos"
import { Prontuarios } from "@/pages/Prontuarios/prontuarios"
import { Configuracoes } from "@/pages/Configuracoes/configuracoes"
import { Perfil } from "@/pages/Perfil/perfil"
import { AdminSignIn } from "@/pages/SignIn/admin-sign-in"
import { ServiceDeskUnitsList } from "@/pages/ServiceDesk/units-list"
import { ServiceDeskUnitDetails } from "@/pages/ServiceDesk/unit-details"
import { SelecaoUnidade } from "@/pages/SelecaoUnidade/selecao-unidade"
import { UnitProtectedRoute } from "@/components/ProtectRoute/unit-protected-route"

export function App() {
  return (
    <DefaultLayout>
      <Routes>
        <Route path="/login" element={<SignIn />} />
        <Route path="/admin/login" element={<AdminSignIn />} />
        <Route
          path="/session"
          element={
            <ProtectedRoute>
              <SelecaoUnidade />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <UnitProtectedRoute>
                <SidebarLayout />
              </UnitProtectedRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="profissionais" element={<Profissionais />} />
          <Route path="profissionais/:id" element={<ProfessionalProfile />} />
          <Route path="cadastro-profissionais" element={<Navigate to="/profissionais" replace />} />
          <Route path="pacientes" element={<Pacientes />} />
          <Route path="agendamentos" element={<Agendamentos />} />
          <Route path="prontuarios" element={<Prontuarios />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <InternalProtectedRoute>
                <SidebarLayout />
              </InternalProtectedRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/unidades" replace />} />
          <Route path="unidades" element={<ServiceDeskUnitsList />} />
          <Route path="unidades/:id" element={<ServiceDeskUnitDetails />} />
        </Route>
      </Routes>
    </DefaultLayout>
  )
}
