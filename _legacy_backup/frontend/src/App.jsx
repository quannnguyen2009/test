import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import { api } from "./api"
import Header from "./components/Header"

// Pages
import Home from "./pages/Home"
import Competition from "./pages/Competition"
import CreateCompetition from "./pages/CreateCompetition"
import EditCompetition from "./pages/EditCompetition"
import { Login, Register } from "./pages/Auth"

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      api.getMe(token)
        .then(setUser)
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
    window.location.href = "/"
  }

  if (loading) return null

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Header user={user} logout={logout} />
      <div className="pt-16 min-h-screen bg-white text-black">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/competition/:id/edit" element={<EditCompetition />} />
          <Route path="/competition/:id" element={<Competition />} />
          <Route path="/create" element={<CreateCompetition />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
