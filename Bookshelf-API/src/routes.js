const { AddBookHandler, GetAllBooksHandler, GetBookByIdHandler, EditBookByIdHandler, DeletBookByIdHandler } = require('./handler');

const routes = [
  {
    method: 'post',
    path:'/books',
    handler: AddBookHandler,
  },
  {
    method:'get',
    path: '/books',
    handler: GetAllBooksHandler,
  },
  {
    method: 'get',
    path: '/books/{bookId}',
    handler:GetBookByIdHandler,
  },
  {
    method:'put',
    path: '/books/{bookId}',
    handler: EditBookByIdHandler,
  },
  {
    method:'delete',
    path: '/books/{bookId}',
    handler: DeletBookByIdHandler,
  },
];
module.exports = routes;

