import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("theme") || "light";
    });

    useEffect(() => {
        document.body.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    return (
        <button onClick={toggleTheme} className="theme-toggle">
            {theme === "light" ? (
                <span className="material-symbols-outlined">dark_mode</span>
            ) : (
                <span className="material-symbols-outlined">light_mode</span>
            )}
        </button>
    );
}
