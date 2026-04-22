import { Home } from "./pages/Home/home"
import { SignIn } from "@/pages/SignIn/sign-in"
import { DefaultLayout } from "@/layouts/default-layout"
import { SidebarLayout } from "@/layouts/sidebar-layout"
import { Routes, Route, Navigate } from "react-router"
import { ProtectedRoute } from "@/components/ProtectRoute/protected-route"
import { Profissionais } from "@/pages/Profissionais/profissionais"
import { Pacientes } from "@/pages/Pacientes/pacientes"
import { Agendamentos } from "@/pages/Agendamentos/agendamentos"
import { Prontuarios } from "@/pages/Prontuarios/prontuarios"
import { Configuracoes } from "@/pages/Configuracoes/configuracoes"
import { Perfil } from "@/pages/Perfil/perfil"
import { CadastroProfissionais } from "@/pages/Profissionais/Cadastro/cadastro-profissionais"
import { SelecaoUnidade } from "@/pages/SelecaoUnidade/selecao-unidade"
import { UnitProtectedRoute } from "@/components/ProtectRoute/unit-protected-route"

export function App() {
  return (
    <DefaultLayout>
      <Routes>
        <Route path="/login" element={<SignIn />} />
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
          <Route path="cadastro-profissionais" element={<CadastroProfissionais />} />
          <Route path="pacientes" element={<Pacientes />} />
          <Route path="agendamentos" element={<Agendamentos />} />
          <Route path="prontuarios" element={<Prontuarios />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>
      </Routes>
    </DefaultLayout>
  )
}
