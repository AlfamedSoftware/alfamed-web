import { Home } from "./pages/Home/home"
import { SignIn } from "@/pages/SignIn/sign-in"
import { DefaultLayout } from "@/layouts/default-layout"
import { Routes, Route } from "react-router"
import { ProtectedRoute } from "@/components/ProtectRoute/protected-route"

export function App() {
  return (
    <DefaultLayout>
      <Routes>
        <Route path="/login" element={<SignIn />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
      </Routes>
    </DefaultLayout>
  )
}

