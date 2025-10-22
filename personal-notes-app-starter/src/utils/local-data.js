const STORAGE_PREFIX = "notes-app-data-";

// Helper untuk buat ID unik
function generateId() {
  if (crypto.randomUUID) {
    return `notes-${crypto.randomUUID()}`;
  }
  return `notes-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// ambil key berdasarkan user yang login
function getStorageKey() {
  const userData = JSON.parse(localStorage.getItem("user"));
  return userData && userData.email
    ? `${STORAGE_PREFIX}${userData.email}`
    : `${STORAGE_PREFIX}guest`;
}

// fungsi untuk mendapatkan catatan awal berdasarkan status login
function getInitialNotes() {
  const userData = JSON.parse(localStorage.getItem("user"));

  if (!userData || !userData.name) {
    return [
      {
        id: generateId(),
        title: "Catatan Pertama",
        body: "Silakan login atau registrasi untuk mulai membuat catatan.",
        createdAt: new Date().toISOString(),
        archived: false,
      },
    ];
  }

  return [
    {
      id: generateId(),
      title: `Haloo Welcome, ${userData.name}!`,
      body: "Selamat datang di Notes Pribadi kamu. Ini adalah catatan pertama kamu.",
      createdAt: new Date().toISOString(),
      archived: false,
    },
  ];
}

// ambil data dari localStorage
function getNotes() {
  const key = getStorageKey();
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : getInitialNotes();
  } catch (err) {
    console.error("Error parsing notes:", err);
    return getInitialNotes();
  }
}

// simpan data ke localStorage
function saveNotes(notes) {
  const key = getStorageKey();
  localStorage.setItem(key, JSON.stringify(notes));
}

// fungsi-fungsi CRUD
function getAllNotes() {
  return getNotes();
}

function getNote(id) {
  return getNotes().find((note) => String(note.id) === String(id));
}

function getActiveNotes() {
  return getNotes().filter((note) => !note.archived);
}

function getArchivedNotes() {
  return getNotes().filter((note) => note.archived);
}

function addNote({ title, body }) {
  const notes = getNotes();
  const newNote = {
    id: generateId(),
    title: title || "(untitled)",
    body,
    createdAt: new Date().toISOString(),
    archived: false,
  };
  notes.push(newNote);
  saveNotes(notes);
}

function deleteNote(id) {
  const notes = getNotes().filter((note) => String(note.id) !== String(id));
  saveNotes(notes);
}

function archiveNote(id) {
  const notes = getNotes().map((note) =>
    String(note.id) === String(id) ? { ...note, archived: true } : note
  );
  saveNotes(notes);
}

function unarchiveNote(id) {
  const notes = getNotes().map((note) =>
    String(note.id) === String(id) ? { ...note, archived: false } : note
  );
  saveNotes(notes);
}

function editNote({ id, title, body }) {
  const notes = getNotes().map((note) =>
    String(note.id) === String(id) ? { ...note, title, body } : note
  );
  saveNotes(notes);
}

function showFormattedDate(date, lang = "id") {
  return new Date(date).toLocaleDateString(
    lang === "id" ? "id-ID" : "en-US",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

export {
  getAllNotes,
  getActiveNotes,
  getArchivedNotes,
  deleteNote,
  editNote,
  getNote,
  archiveNote,
  unarchiveNote,
  addNote,
  showFormattedDate,
};
