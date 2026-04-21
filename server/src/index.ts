import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { authRouter } from './routes/auth.routes';
import { playersRouter } from './routes/players.routes';
import { clansRouter } from './routes/clans.routes';
import { cardsRouter } from './routes/cards.routes';
import { leaderboardRouter } from './routes/leaderboard.routes';
import { savedPlayersRouter } from './routes/savedPlayers.routes';
import { errorHandler } from './middleware/errorHandler.middleware';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', app: 'ClashPulse API' } });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/players', playersRouter);
app.use('/api/v1/clans', clansRouter);
app.use('/api/v1/cards', cardsRouter);
app.use('/api/v1/leaderboard', leaderboardRouter);
app.use('/api/v1/user/saved-players', savedPlayersRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`ClashPulse API listening on port ${PORT}`);
});

export default app;
