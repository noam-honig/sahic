import express from 'express';
import sslRedirect from 'heroku-ssl-redirect';
import swaggerUi from 'swagger-ui-express';
import helmet from 'helmet';
import { expressjwt } from 'express-jwt';
import compression from 'compression';
import { api } from './api';
import { getJwtSecret } from '../app/users/SignInController';
import fs from 'fs';
import { gql } from '../app/home/getGraphQL';
import { HomeController } from '../app/home/home.controller';

async function startup() {
  const app = express();
  app.use(sslRedirect());
  app.use(
    expressjwt({
      secret: getJwtSecret(),
      credentialsRequired: false,
      algorithms: ['HS256'],
    })
  );
  app.use(compression());
  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );

  app.use(api);
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(api.openApiDoc({ title: 'remult-react-todo' }))
  );

  app.use(express.static('dist/angular-starter-project'));
  app.get('/links/:id', async (req, res) => {
    try {
      const result = await HomeController.getLinks(+req.params.id);

      sendIndex(res, 'סח"י קישורים - ' + result.name);
    } catch (err: any) {
      res.status(500).json(err.message);
    }
  });
  app.get('/a/:id', async (req, res) => {
    try {
      const result = await gql(
        `#graphql
query ($id: ID!) {
    boards(ids: [$id]) {
        id
        name
    }
}
    `,
        { id: req.params.id }
      );

      sendIndex(res, 'סח"י מי בא? ' + result.boards[0].name);
    } catch (err: any) {
      res.status(500).json(err.message);
    }
  });
  app.use('/*', async (req, res) => {
    sendIndex(res);
  });
  let port = process.env['PORT'] || 3002;
  app.listen(port);

  function sendIndex(res: express.Response, title?: string) {
    try {
      let index = fs
        .readFileSync(
          process.cwd() + '/dist/angular-starter-project/index.html'
        )
        .toString();
      if (title)
        index = index.replace(
          "מערכת צ'יפים סחי",
          `${title.replace(/"/g, '&quot;')}`
        );
      res.send(index);
    } catch (err) {
      res.sendStatus(500);
    }
  }
}
startup();
