import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addNote } from '../utils/local-data';
import { LanguageContext } from '../contexts/languagecontext';

export default function AddNewPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const navigate = useNavigate();

  const { language, translations } = useContext(LanguageContext);
  const t = translations[language]; 
  const handleSave = () => {
    if (!title.trim() && !body.trim()) {
      alert(t.alertEmpty);
      return;
    }

    addNote({ title, body });
    navigate('/');
  };

  return (
    <div className='add-new-page__input'>
      <input
        className='add-new-page__input__title'
        type='text'
        placeholder={t.addNoteTitlePlaceholder}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className='add-new-page__input__body'
        placeholder={t.addNoteBodyPlaceholder}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <div className='add-new-page__action'>
        <button className='action' onClick={handleSave} title={t.saveNote}>
          <span className='material-symbols-outlined'>check</span>
        </button>

        <Link to='/' className='action' title={t.cancel}>
          <span className='material-symbols-outlined'>close</span>
        </Link>
      </div>
    </div>
  );
}
