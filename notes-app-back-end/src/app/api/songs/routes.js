const { deleteNoteByIdHandler } = require('./app/api/songs/handler');
const { editNoteByIdHandler } = require('./app/api/songs/handler');
const { getNoteByIdHandler } = require('./app/api/songs/handler');
const { addNoteHandler, getAllNotesHandler } = require('./app/api/songs/handler');

const routes = [
  {
    method: 'POST',
    path: '/notes',
    handler: addNoteHandler,
  },
  {
    method: 'GET',
    path: '/notes',
    handler: getAllNotesHandler,
  },
  {
    method: 'GET',
    path: '/notes/{id}',
    handler: getNoteByIdHandler,
  },
  {
    method: 'PUT',
    path: '/notes/{id}',
    handler: editNoteByIdHandler,
  },
  {
    method: 'DELETE',
    path: '/notes/{id}',
    handler: deleteNoteByIdHandler,
  },
];

module.exports = routes;
