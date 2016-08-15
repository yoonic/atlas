import Bunyan from 'bunyan';
import config from './config';

export default Bunyan.createLogger({
    name: 'atlas',
    streams: config.logs.streams
});
