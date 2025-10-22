import React, { useState, useContext } from 'react';
import { getArchivedNotes } from '../utils/local-data';
import NotesList from '../component/noteslist';
import SearchBar from '../component/searchbar';
import { LanguageContext } from '../contexts/languagecontext';

function ArchivePage() {
  const [keyword, setKeyword] = useState('');
  const archivedNotes = getArchivedNotes();

  const { language, translations } = useContext(LanguageContext);
  const t = translations[language];

  const filteredNotes = archivedNotes.filter((note) =>
    note.title.toLowerCase().includes(keyword.toLowerCase())
  );

  return (
    <main>
      <h2>{language === "id" ? "Catatan Arsip" : "Archived Notes"}</h2>

      <SearchBar
        keyword={keyword}
        keywordChange={(value) => setKeyword(value)}
        placeholder={t.addNoteTitlePlaceholder} 
      />

      {filteredNotes.length > 0 ? (
        <div className='notes-list'>
          <NotesList notes={filteredNotes} />
        </div>
      ) : (
        <div className='notes-list-empty'>
          <p className='notes-empty'>{t.emptyNotes}</p>
        </div>
      )}
    </main>
  );
}

export default ArchivePage;
