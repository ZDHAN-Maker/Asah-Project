import React, { useContext } from 'react';
import NoteItem from './notesitem';
import { LanguageContext } from '../contexts/languagecontext';

function NotesList({ notes }) {
  const { language, translations } = useContext(LanguageContext);
  const t = translations[language];

  if (notes.length === 0) {
    return (
      <div className="notes-list-empty">
        <p>{t.emptyNotes}</p>
      </div>
    );
  }

  return (
    <div className="notes-list">
      {notes.map((note) => (
        <NoteItem key={note.id} {...note} />
      ))}
    </div>
  );
}

export default NotesList;
