import { useEffect, useState, type FormEvent } from "react";
import { getProfile, updateProfile } from "../api/userApi";
import ProfileCard from "../components/ProfileCard";
import { handleError, isUnauthorized } from "../helpers/handleError";
import type { User } from "../types";

type Props = {
  token: string;
  onUnauthorized: () => void;
  onProfileUpdated: (profile: User) => void;
};

export function ProfilePage({ token, onUnauthorized, onProfileUpdated }: Props) {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setSuccess("");
    getProfile(token).then((data) => {
      if (!active) return;
      setProfile(data);
      setNickname(data.nickname);
      setBio(data.bio);
      onProfileUpdated(data);
    }).catch((error: unknown) => {
      if (!active) return;
      if (isUnauthorized(error)) onUnauthorized();
      else setError(handleError(error));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [token, onUnauthorized, onProfileUpdated, loadAttempt]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !nickname.trim()) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updateProfile(token, { nickname: nickname.trim(), bio: bio.trim() });
      setProfile(updated);
      setNickname(updated.nickname);
      setBio(updated.bio);
      onProfileUpdated(updated);
      setSuccess("Профиль сохранён.");
    } catch (error) {
      if (isUnauthorized(error)) onUnauthorized();
      else setError(handleError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <div className="page-heading"><div><p className="eyebrow">Личный кабинет</p>
        <h1>Профиль</h1><p className="muted">Так вас видят участники чата.</p></div></div>
      {loading && <p role="status">Загрузка профиля...</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {!loading && !profile && <button onClick={() => setLoadAttempt((value) => value + 1)}>Повторить загрузку</button>}
      {!loading && profile && <div className="panel profile-layout">
        <ProfileCard profile={profile} />
        <form onSubmit={handleSave} className="form-stack profile-form">
          <h2>Редактировать профиль</h2>
          <label htmlFor="nickname">Никнейм</label>
          <input id="nickname" value={nickname} required disabled={saving}
            onChange={(event) => { setNickname(event.target.value); setSuccess(""); }} />
          <label htmlFor="bio">Описание</label>
          <textarea id="bio" rows={4} value={bio} disabled={saving}
            onChange={(event) => { setBio(event.target.value); setSuccess(""); }} />
          <p className="muted small">Телефон используется для входа и не редактируется.</p>
          {success && <p className="success" role="status">{success}</p>}
          <button type="submit" disabled={saving || !nickname.trim()}>
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
        </form>
      </div>}
    </section>
  );
}

export default ProfilePage;
