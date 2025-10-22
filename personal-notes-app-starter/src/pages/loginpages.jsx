import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { LanguageContext, LanguageProvider } from "../contexts/languagecontext";
import { LocaleContext } from "../contexts/LocaleContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const { language, translations } = useContext(LanguageContext);
  const navigate = useNavigate();
  const { locale } = useContext(LocaleContext);
  const t = translations[language];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login({ email, password });
    if (success) {
      navigate("/");
    } else {
      alert(
        language === "id"
          ? "Email atau password salah!"
          : "Invalid email or password!"
      );
    }
  };

  return (
      <main>
        <h2>{t.loginTitle}</h2>
        <form className="input-login" onSubmit={handleSubmit}>
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

          <button type="submit">{t.loginButton}</button>
        </form>

        <p>
          {t.registerText} <Link to="/register">{t.registerLink}</Link>
        </p>
      </main>
  );
}
