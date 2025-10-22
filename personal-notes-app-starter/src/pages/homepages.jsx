import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import NotesList from '../component/noteslist';
import SearchBar from '../component/searchbar';
import { getActiveNotes } from '../utils/local-data';
import { LanguageContext } from '../contexts/languagecontext';

export default function HomePage() {
  const [notes] = useState(getActiveNotes());
  const [search, setSearch] = useState('');
  const { language, translations } = useContext(LanguageContext);
  const t = translations[language];

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main>
      <h2>{t.activeNotes}</h2>
      <SearchBar keyword={search} setKeyword={setSearch} />
      {filteredNotes.length > 0 ? (
        <NotesList notes={filteredNotes} />
      ) : (
        <div className="notes-list-empty">
          <p>{t.emptyNotes}</p>
        </div>
      )}
      <div className="homepage__action">
        <Link to="/add" className="action">
          +
        </Link>
      </div>
    </main>
  );
}
