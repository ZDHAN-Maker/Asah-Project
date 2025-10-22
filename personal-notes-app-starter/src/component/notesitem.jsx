import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { showFormattedDate } from '../utils/local-data';
import { LanguageContext } from '../contexts/languagecontext';

function NoteItem({ id, title, createdAt, body }) {
  const { language } = useContext(LanguageContext);

  const formattedDate = showFormattedDate(createdAt, language);

  return (
    <div className='note-item'>
      <h3>
        <Link to={`/notes/${id}`} className='note-item__title'>
          {title}
        </Link>
      </h3>
      <p className='note-item__date'>{formattedDate}</p>
      <p className='note-item__body'>{body}</p>
    </div>
  );
}

export default NoteItem;
