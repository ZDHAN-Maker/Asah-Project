import { createContext, useState, useEffect } from "react";
import {
  login as apiLogin,
  putAccessToken,
  getUserLogged,
  register as apiRegister,
} from "../utils/network-data";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // cek status login saat komponen dimount
  useEffect(() => {
    async function fetchUser() {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      putAccessToken(token); 
      
      const { error, data } = await getUserLogged();
      if (!error) {
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data)); 
      } else {
        setUser(null);
        localStorage.removeItem("user");
      }
      setLoading(false);
    }

    fetchUser();
  }, []);

  // fungsi login
  const login = async ({ email, password }) => {
    const { error, data } = await apiLogin({ email, password });
    console.log("Login response:", { error, data });

    if (!error && data?.accessToken) {
      putAccessToken(data.accessToken);
      localStorage.setItem("accessToken", data.accessToken);

      const { error: userError, data: userData } = await getUserLogged();
      if (!userError) {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData)); 
        return true;
      }
    }
    return false;
  };

  // fungsi register
  const register = async ({ name, email, password }) => {
    const { error, data } = await apiRegister({ name, email, password });
    console.log("Register response:", { error, data });
    return !error;
  };

  // fungsi logout
  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user"); 
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {loading ? <p>Loading...</p> : children}
    </AuthContext.Provider>
  );
}
