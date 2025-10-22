import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { showFormattedDate } from "../utils";  // <-- perbaikan di sini
import {
  getNote,
  deleteNote,
  archiveNote,
  unarchiveNote,
} from "../utils/local-data";
import { LanguageContext } from "../contexts/languagecontext";

export default function DetailPages() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const { language, translations } = useContext(LanguageContext);
  const t = translations[language];

  useEffect(() => {
    const fetchedNote = getNote(id);
    setNote(fetchedNote);
  }, [id]);

  if (!note) {
    return (
      <main className="detail-page">
        <h2 className="detail-page__title">{t.detailNotFound}</h2>
      </main>
    );
  }

  const handleToggleArchive = () => {
    if (note.archived) {
      unarchiveNote(note.id);
      navigate("/");
    } else {
      archiveNote(note.id);
      navigate("/archive");
    }
  };

  const handleDelete = () => {
    const confirmDelete = window.confirm(t.confirmDelete);
    if (confirmDelete) {
      deleteNote(note.id);
      navigate("/");
    }
  };

  return (
    <main className="detail-page">
      <div>
        <h2 className="detail-page__title">{note.title}</h2>
        <p className="detail-page__createdAt">
          {showFormattedDate(note.createdAt, language)}
        </p>
        <div className="detail-page__body">{note.body}</div>
      </div>

      <div className="detail-page__action">
        <button
          className="action"
          onClick={handleToggleArchive}
          title={note.archived ? t.unarchive : t.archive}
        >
          <span className="material-symbols-outlined">
            {note.archived ? "unarchive" : "archive"}
          </span>
        </button>

        <button className="action" onClick={handleDelete} title={t.delete}>
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>
    </main>
  );
}
