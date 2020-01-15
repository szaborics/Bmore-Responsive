import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import requestId from 'express-request-id';
import morgan from 'morgan';

import models, {sequelize} from './models';
import routes from './routes';
import utils from './utils';

const app = express();

// Third-party middleware
app.use(requestId());
app.use(morgan('tiny'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Custom middleware
app.use(async (req, res, next) => {
	req.context = {
		models,
		me: await models.User.findByLogin('goku')
	};
	next();
});

// Helper endpoints
app.get('/', (req, res) => res.send(`For instructions on use, please visit ${process.env.npm_package_homepage}`));
app.use('/_healthcheck', (_req, res) => {
	res.status(200).json({
		uptime: utils.formatTime(process.uptime()),
		environment: process.env.NODE_ENV || 'n/a',
		version: process.env.npm_package_version || 'n/a',
		userId: _req.context.me.id,
		requestId: _req.id
	});
});

// Routes
app.use('/user', routes.user);

// Starting Express and PostgreSQL
sequelize.sync({force: process.env.ERASE_DATABASE}).then(async () => {
	if (process.env.ERASE_DATABASE) {
		utils.seedUsers();
	}

	app.listen(process.env.PORT || 3000, () => {
		console.log(`Bmore Responsive listening on port ${process.env.PORT || 3000}!`);
		if (process.env.PORT > 9000) {
			console.log('IT\'S OVER 9000!');
		}
	});
});

export default app;
