import type { User } from "../types";

type Props = { profile: User };

export function ProfileCard({ profile }: Props) {
  return (
    <section className="profile-card" aria-label="Данные профиля">
      <div className="avatar" aria-hidden="true">{profile.nickname.charAt(0).toUpperCase() || "?"}</div>
      <h2>{profile.nickname}</h2>
      <p className="muted">{profile.phone}</p>
      <p className="profile-bio">{profile.bio || "Описание пока не заполнено."}</p>
    </section>
  );
}

export default ProfileCard;
