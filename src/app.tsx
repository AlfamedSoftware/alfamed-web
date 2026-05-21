import { Home } from "./pages/Home/home"
import { Default } from "./pages/Default/default"
import { SignIn } from "@/pages/SignIn/sign-in"
import { ResetPassword } from "@/pages/ResetPassword/reset-password"
import { DefaultLayout } from "@/layouts/default-layout"
import { Routes, Route, Navigate } from "react-router"
import { ProtectedRoute } from "@/components/ProtectRoute/protected-route"
import { InternalProtectedRoute } from "@/components/ProtectRoute/internal-protected-route"
import { Profissionais } from "@/pages/Profissionais/listar-profissionais"
import { ProfessionalProfile } from "@/pages/Profissionais/edicao-profissionais"
import { CadastroProfissionais } from "@/pages/Profissionais/cadastro-profissionais"
import { ProfissionaisEspecialidades } from "@/pages/Profissionais/profissionais-especialidades"
import { Procedimentos } from "@/pages/Procedimentos/procedimentos"
import { Especialidades } from "@/pages/Especialidades/especialidades"
import { Agendamentos } from "@/pages/Agendamentos/agendamentos"
import { Agendas } from "@/pages/Agendas/agendas"
import { Perfil } from "@/pages/Profissionais/perfil"
import { AdminSignIn } from "@/pages/SignIn/admin-sign-in"
import { ServiceDeskUnitsList } from "@/pages/ServiceDesk/units-list"
import { ServiceDeskUnitDetails } from "@/pages/ServiceDesk/unit-details"
import { ServiceDeskUpmUsers } from "@/pages/ServiceDesk/upm-users"
import { UpmUserProfile } from "@/pages/ServiceDesk/upm-user-profile"
import { SelecaoUnidade } from "@/pages/SelecaoUnidade/selecao-unidade"
import { UnitProtectedRoute } from "@/components/ProtectRoute/unit-protected-route"
import { SessionUnitProvider } from "@/contexts/session-unit-context"

export function App() {
  return (
    <DefaultLayout>
      <SessionUnitProvider>
        <Routes>
          <Route path="/login" element={<SignIn />} />
          <Route path="/admin/login" element={<AdminSignIn />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/sign-in" element={<SignIn />} />
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
                  <Default />
                </UnitProtectedRoute>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="profissionais" element={<Profissionais />} />
            <Route path="profissionais/vinculo-especialidades" element={<ProfissionaisEspecialidades />} />
            <Route path="profissionais/:id" element={<ProfessionalProfile />} />
            <Route path="cadastro-profissionais" element={<CadastroProfissionais />} />
            <Route path="procedimentos" element={<Procedimentos />} />
            <Route path="especialidades" element={<Especialidades />} />
            <Route path="agendas" element={<Agendas />} />
            <Route path="agendamentos" element={<Agendamentos />} />
            <Route path="perfil" element={<Perfil />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <InternalProtectedRoute>
                  <Default />
                </InternalProtectedRoute>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/unidades" replace />} />
            <Route path="unidades" element={<ServiceDeskUnitsList />} />
            <Route path="unidades/:id" element={<ServiceDeskUnitDetails />} />
            <Route path="upm" element={<ServiceDeskUpmUsers />} />
            <Route path="upm/usuarios/:id" element={<UpmUserProfile />} />
          </Route>
        </Routes>
      </SessionUnitProvider>
    </DefaultLayout>
  )
}
