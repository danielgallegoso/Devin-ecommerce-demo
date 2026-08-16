import mongoose from 'mongoose';
import app from './app';
import config from './config';

const mongodbUrl = config.MONGODB_URL;
mongoose
  .connect(mongodbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .catch((error) => console.log(error.reason));

app.listen(config.PORT, () => {
  console.log('Server started at http://localhost:5000');
});
