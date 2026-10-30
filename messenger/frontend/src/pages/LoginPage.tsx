import { useState, type FormEvent } from "react";
import { login } from "../api/authApi";
import { setToken } from "../helpers/authStorage";
import { handleError } from "../helpers/handleError";
import type { User } from "../types";

type Props = {
  onLogin: (token: string, user: User) => void;
  notice?: string;
};

export function LoginPage({ onLogin, notice }: Props) {
  const [phone, setPhone] = useState("+79990000000");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const result = await login({ phone: phone.trim(), password });
      setToken(result.token);
      onLogin(result.token, result.user);
    } catch (error) {
      setError(handleError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="login-layout">
      <div className="login-intro">
        <p className="eyebrow">Учебный мессенджер</p>
        <h1>Разговор начинается<br />с простого «привет».</h1>
        <p className="muted">Войдите в аккаунт, настройте профиль и присоединяйтесь к общему чату.</p>
        <div className="test-accounts">
          <h2>Тестовые аккаунты</h2>
          <p>Для проверки чата откройте второй аккаунт в другом браузере или в режиме инкогнито.</p>
          <ul>
            <li>Alex — +79990000000</li>
            <li>Maria — +79990000001</li>
            <li>Sam — +79990000002</li>
          </ul>
          <p>Пароль для всех: <code>123456</code></p>
        </div>
      </div>
      <div className="panel login-card">
        <h2>Вход</h2>
        <p className="muted">Введите телефон и пароль.</p>
        {notice && <p className="notice" role="status">{notice}</p>}
        <form onSubmit={handleSubmit} className="form-stack">
          <label htmlFor="phone">Телефон</label>
          <input id="phone" type="tel" autoComplete="username" required value={phone}
            onChange={(event) => setPhone(event.target.value)} disabled={loading} />
          <label htmlFor="password">Пароль</label>
          <input id="password" type="password" autoComplete="current-password" required value={password}
            onChange={(event) => setPassword(event.target.value)} disabled={loading} />
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" disabled={loading || !phone.trim() || !password}>
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default LoginPage;
