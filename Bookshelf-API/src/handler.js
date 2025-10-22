const { nanoid } = require('nanoid');
const books = require('./books');

const AddBookHandler = (Request, h) => {
  const { name, year, author, summary, publisher, pageCount, readPage, reading } = Request.payload;
  let { finished } = Request.payload;
  finished = false;
  const id = nanoid(15);
  const insertedAt = new Date().toISOString();
  const updatedAt = insertedAt;

  if (pageCount === readPage){
    finished = true;
  }
  if (!name){
    const response = h.response({
      status:'fail',
      message:'Gagal menambahkan buku. Mohon isi nama buku',
    }).code(400);
    return response;
  }
  if (readPage > pageCount){
    const response = h.response({
      status: 'fail',
      message: 'Gagal menambahkan buku. readPage tidak boleh lebih besar dari pageCount',
    }).code(400);
    return response;
  }
  const newBook = {
    id,
    name,
    year,
    author,
    summary,
    publisher,
    pageCount,
    readPage,
    finished,
    reading,
    insertedAt,
    updatedAt,
  };

  books.push(newBook);

  return h.response({
    status:'success',
    message:'Buku berhasil ditambahkan',
    data:{
      bookId:newBook.id
    }
  }).code(201);
};

const GetAllBooksHandler = (request, h) => {
  const { name, reading, finished } = request.query;

  let filteredBooks = [...books];

  if (name){
    filteredBooks = filteredBooks.filter((book) =>book.name && book.name.toLowerCase().includes(name.toLowerCase()));
  }
  if (reading!== undefined){
    const isreading = reading ==='1';
    filteredBooks = filteredBooks.filter((books)=>books.reading === isreading);
  }
  if (finished!== undefined){
    const isfinished = finished ==='1';
    filteredBooks = filteredBooks.filter((books)=> books.finished === isfinished);
  }

  const response = h.response({
    status:'success',
    data:{
      books:filteredBooks.map((book)=> ({
        id:book.id,
        name:book.name,
        publisher:book.publisher
      }))
    }
  }).code(200);
  return response;
};

const GetBookByIdHandler = (request, h) => {
  const { bookId } = request.params;
  const book = books.find((book)=> book.id === bookId);

  if (book === undefined){
    const response = h.response({
      status:'fail',
      message:'Buku tidak ditemukan',
    }).code(404);
    return response;
  }
  const response =h.response({
    status:'success',
    data:{
      book
    }
  }).code(200);
  return response;
};

const EditBookByIdHandler = (request, h) =>{
  const { bookId } = request.params;
  const { name, year, author, summary, publisher, pageCount, readPage, reading } = request.payload;
  let finished = false;
  const updatedAt = new Date().toISOString();

  if (pageCount === readPage){
    finished = true;
  }
  if (!name){
    const response = h.response({
      status:'fail',
      message:'Gagal memperbarui buku. Mohon isi nama buku',
    }).code(400);
    return response;
  }
  if (readPage >pageCount){
    const response = h.response({
      status:'fail',
      message:'Gagal memperbarui buku. readPage tidak boleh lebih besar dari pageCount',
    }).code(400);
    return response;
  }

  const index =books.findIndex((book) => book.id === bookId);

  if (index === -1){
    const response = h.response({
      status:'fail',
      message:'Gagal memperbarui buku. Id tidak ditemukan',
    }).code(404);
    return response;
  }

  books[index]= {
    ...books[index],
    name,
    year,
    author,
    summary,
    publisher,
    pageCount,
    readPage,
    finished,
    reading,
    updatedAt,
  };

  const response = h.response({
    status:'success',
    message:'Buku berhasil diperbarui',
  }).code(200);
  return response;
};

const DeletBookByIdHandler = (request, h) =>{
  const { bookId } = request.params;
  const bookIndex =books.findIndex((book) => book.id === bookId);

  if (bookIndex !== -1){
    books.splice(bookIndex, 1);

    const response =  h.response({
      status:'success',
      message:'Buku berhasil dihapus',
    });response.code(200);
    return response;
  }

  const response=  h.response({
    status:'fail',
    message:'Buku gagal dihapus. Id tidak ditemukan',
  });response.code(404);
  return response;

};

module.exports = { AddBookHandler, GetAllBooksHandler, GetBookByIdHandler, EditBookByIdHandler, DeletBookByIdHandler };



