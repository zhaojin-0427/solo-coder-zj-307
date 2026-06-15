import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();
const PORT = 9312;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.get('/', (_req, res) => {
  res.json({ message: '美瞳化妆场景搭配与出门清单平台 - API' });
});

app.listen(PORT, () => {
  console.log(`✅ 后端服务已启动: http://localhost:${PORT}`);
});