import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { LanguageContext } from "../contexts/languagecontext";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();
  const { register } = useContext(AuthContext); 
  const { language, translations } = useContext(LanguageContext);

  const t = translations[language];

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirm) {
      alert(
        language === "id"
          ? "Password dan konfirmasi password tidak sama!"
          : "Password and confirmation do not match!"
      );
      return;
    }

    const success = await register({ name, email, password }); 
    if (success) {
      alert(
        language === "id"
          ? "Pendaftaran berhasil! Silakan login."
          : "Registration successful! Please login."
      );
      navigate("/login");
    }
  };

  return (
    <main>
      <h2>{t.registerTitle}</h2>
      <form className="input-register" onSubmit={handleRegister}>
        <label>{t.name}</label>
        <input
          type="text"
          placeholder={t.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label>{t.email}</label>
        <input
          type="email"
          placeholder={t.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>{t.password}</label>
        <input
          type="password"
          placeholder={t.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label>{t.confirmPassword}</label>
        <input
          type="password"
          placeholder={t.confirmPasswordPlaceholder}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <button type="submit">{t.registerButton}</button>
      </form>

      <p>
        {t.loginText} <Link to="/login">{t.loginLink}</Link>
      </p>
    </main>
  );
}
