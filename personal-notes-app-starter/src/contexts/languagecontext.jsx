// src/contexts/LanguageContext.js
import { createContext, useState, useEffect } from "react";

export const LanguageContext = createContext();

const translations = {
    id: {
        // Login Page
        loginTitle: "Yuk, login untuk menggunakan aplikasi.",
        email: "Email",
        emailPlaceholder: "Masukkan email",
        password: "Password",
        passwordPlaceholder: "Masukkan password",
        loginButton: "Login",
        registerText: "Belum punya akun?",
        registerLink: "Daftar di sini",

        // Register Page
        registerTitle: "Buat akun baru",
        name: "Nama",
        namePlaceholder: "Masukkan nama",
        confirmPassword: "Konfirmasi Password",
        confirmPasswordPlaceholder: "Ulangi password",
        registerButton: "Daftar",
        loginText: "Sudah punya akun?",
        loginLink: "Login di sini",

        // Home page
        activeNotes: "Catatan Aktif",
        emptyNotes: "Tidak ada catatan",
        addNote: "Tambah Catatan",

        // Detail page
        detailNotFound: "Catatan tidak ditemukan",
        confirmDelete: "Apakah Anda yakin ingin menghapus catatan ini?",
        archive: "Arsipkan",
        unarchive: "Pindahkan ke Aktif",
        delete: "Hapus Catatan",

        // Add Note page
        addNoteTitlePlaceholder: "Judul Catatan ...",
        addNoteBodyPlaceholder: "Tulis catatanmu di sini ...",
        saveNote: "Simpan Catatan",
        cancel: "Batal",
        alertEmpty: "Judul atau isi catatan tidak boleh kosong!"
    },
    en: {
        // Login Page
        loginTitle: "Login to use the app.",
        email: "Email",
        emailPlaceholder: "Enter email",
        password: "Password",
        passwordPlaceholder: "Enter password",
        loginButton: "Login",
        registerText: "Don't have an account?",
        registerLink: "Register here",

        // Register Page
        registerTitle: "Create a new account",
        name: "Name",
        namePlaceholder: "Enter your name",
        confirmPassword: "Confirm Password",
        confirmPasswordPlaceholder: "Repeat password",
        registerButton: "Register",
        loginText: "Already have an account?",
        loginLink: "Login here",

        // Home page
        activeNotes: "Active Notes",
        emptyNotes: "No notes available",
        addNote: "Add Note",

        // Detail page
        detailNotFound: "Note not found",
        confirmDelete: "Are you sure you want to delete this note?",
        archive: "Archive",
        unarchive: "Move to Active",
        delete: "Delete Note",

        // Add Note page
        addNoteTitlePlaceholder: "Note Title ...",
        addNoteBodyPlaceholder: "Write your note here ...",
        saveNote: "Save Note",
        cancel: "Cancel",
        alertEmpty: "Title or body cannot be empty!"
    },
};

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState("id");

    useEffect(() => {
        const savedLang = localStorage.getItem("language");
        if (savedLang) setLanguage(savedLang);
    }, []);

    const toggleLanguage = () => {
        const newLang = language === "id" ? "en" : "id";
        setLanguage(newLang);
        localStorage.setItem("language", newLang);
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, translations }}>
            {children}
        </LanguageContext.Provider>
    );
}
