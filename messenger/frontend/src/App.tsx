import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { getProfile } from "./api/userApi";
import { clearToken, getToken } from "./helpers/authStorage";
import { handleError, isUnauthorized } from "./helpers/handleError";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import ChatPage from "./pages/ChatPage";
import type { User } from "./types";

function AppContent() {
  const [token, setToken] = useState<string | null>(getToken);
  const [user, setUser] = useState<User | null>(null);
  const [notice, setNotice] = useState("");
  const [accountError, setAccountError] = useState("");
  const navigate = useNavigate();

  const handleUnauthorized = useCallback(() => {
    clearToken();
    setToken(null);
    setUser(null);
    setNotice("Сессия завершена. Войдите снова.");
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setAccountError("");
    getProfile(token).then((profile) => {
      if (active) setUser(profile);
    }).catch((error: unknown) => {
      if (!active) return;
      if (isUnauthorized(error)) handleUnauthorized();
      else setAccountError(handleError(error));
    });
    return () => { active = false; };
  }, [token, handleUnauthorized]);

  function handleLogin(newToken: string, profile: User) {
    setToken(newToken);
    setUser(profile);
    setNotice("");
    navigate("/chat", { replace: true });
  }

  function handleLogout() {
    clearToken();
    setToken(null);
    setUser(null);
    setNotice("");
    setAccountError("");
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand"><span className="brand-mark" aria-hidden="true">m.</span> Messenger Mini</div>
        {token && <div className="account"><span>{user?.nickname || "Пользователь"}</span>
          <button className="button-secondary" onClick={handleLogout}>Выйти</button></div>}
      </header>
      <nav className="navigation" aria-label="Разделы приложения">
        {token ? <>
          <NavLink to="/chat">Чат</NavLink>
          <NavLink to="/profile">Профиль</NavLink>
        </> : <NavLink to="/login">Вход</NavLink>}
      </nav>
      <main>
        {token && accountError && <p className="error" role="alert">{accountError}</p>}
        <Routes>
          <Route path="/login" element={token ? <Navigate to="/chat" replace />
            : <LoginPage onLogin={handleLogin} notice={notice} />} />
          <Route path="/profile" element={token
            ? <ProfilePage token={token} onUnauthorized={handleUnauthorized} onProfileUpdated={setUser} />
            : <Navigate to="/login" replace />} />
          <Route path="/chat" element={token
            ? <ChatPage token={token} currentUserId={user?.id} onUnauthorized={handleUnauthorized} />
            : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to={token ? "/chat" : "/login"} replace />} />
        </Routes>
      </main>
      <footer>Семинар 20.10 · React + TypeScript</footer>
    </div>
  );
}

export function App() {
  return <BrowserRouter><AppContent /></BrowserRouter>;
}

export default App;
