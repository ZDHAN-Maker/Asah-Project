import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { LanguageContext } from "../contexts/LanguageContext";
import ThemeToggle from "./themetoggle";

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const { language, toggleLanguage } = useContext(LanguageContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="app-header">
      <h1>
        <Link to="/" className="app-title-link">
          {language === "id" ? "Aplikasi Catatan" : "Notes App"}
        </Link>
      </h1>

      <nav>
        {/* Jika belum login */}
        {!user && (
          <>
            <button
              className="toggle-language"
              title={language === "id" ? "Ganti Bahasa" : "Change Language"}
              onClick={toggleLanguage}
            >
              <span className="material-symbols-outlined">g_translate</span>
              {language.toUpperCase()}
            </button>
            <ThemeToggle />
            <Link to="/login">{language === "id" ? "Masuk" : "Login"}</Link>
            <Link to="/register">{language === "id" ? "Daftar" : "Register"}</Link>
          </>
        )}

        {/* Jika sudah login */}
        {user && (
          <>
            <button
              className="toggle-language"
              title={language === "id" ? "Ganti Bahasa" : "Change Language"}
              onClick={toggleLanguage}
            >
              <span className="material-symbols-outlined">g_translate</span>
              {language.toUpperCase()}
            </button>
            <Link to="/arsip">{language === "id" ? "Arsip" : "Archive"}</Link>
            <ThemeToggle />
            <button className="button-logout" onClick={handleLogout}>
              <span className="material-symbols-outlined">logout</span>
              {language === "id" ? "Keluar" : "Logout"}
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
