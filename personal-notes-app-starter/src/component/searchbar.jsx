import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/languagecontext';

export default function SearchBar({ keyword, setKeyword }) {
  const { language } = useContext(LanguageContext);

  return (
    <div className='search-bar'>
      <input
        type='text'
        placeholder={
          language === 'id'
            ? 'Cari berdasarkan judul ...'
            : 'Search by title ...'
        }
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
    </div>
  );
}
