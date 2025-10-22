import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import HomePage from "./pages/homepages";
import DetailPage from "./pages/detailpages";
import AddNewPage from "./pages/addnewpages";
import Header from "./component/header";
import ArchivePage from "./pages/archivepages";
import LoginPage from "./pages/loginpages";
import RegisterPage from "./pages/registerpages";
import { AuthContext } from "./contexts/AuthContext";
import { LocaleProvider } from "./contexts/LocaleContext";
import { LanguageProvider } from "./contexts/LanguageContext";

function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <p>Loading...</p>;

  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  const { user } = useContext(AuthContext);

  return (
    <LanguageProvider>
      <LocaleProvider>
        <Router>
          <div className="app-container">

            {/* Selalu render Header */}
            <Header />

            <Routes>
              {/* Route publik */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Route privat */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <HomePage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/notes/:id"
                element={
                  <PrivateRoute>
                    <DetailPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/add"
                element={
                  <PrivateRoute>
                    <AddNewPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/arsip"
                element={
                  <PrivateRoute>
                    <ArchivePage />
                  </PrivateRoute>
                }
              />

              {/* Default redirect */}
              <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
            </Routes>
          </div>
        </Router>
      </LocaleProvider>
    </LanguageProvider>
  );
}


export default App;
