import { SignIn } from "@/pages/sign-in"
import { DefaultLayout } from "@/layouts/default-layout"
import { Routes, Route } from "react-router"

export function App() {
  return (
    <DefaultLayout>
      <Routes>
        <Route path="/login" element={<SignIn />} />
      </Routes>
    </DefaultLayout>
  )
}

