import express from 'express';
import { userRouter,tenantRouter } from '../../../../modules/user/routes/user.routes';
import {  siteRouter } from '../../../../modules/sites/infra/http/routes';


const v1Router = express.Router();

v1Router.get('/', (req, res) => {
  return res.json({ message: "Yo! we're up" });
});

v1Router.use('/users', userRouter);
v1Router.use('/tenant', tenantRouter);
v1Router.use('/sites', siteRouter);




export { v1Router };
