const hapi = require('@hapi/hapi');
const routes = require('./routes');

const init = async () => {
  const server = hapi.server({
    port: 9000,
    host: 'localhost'
  });
  await server.start();
  console.log(`Server berjalan di ${server.info.uri}`);
  server.route(routes);
};
init();