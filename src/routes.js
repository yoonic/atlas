import {buildRoutes} from './core/routeHelpers';
import config from './config';

import accountRoutes from './resources/account/routes';
import cartRoutes from './resources/carts/routes';
import checkoutRoutes from './resources/checkouts/routes';
import collectionRoutes from './resources/collections/routes';
import contentRoutes from './resources/contents/routes';
import fileRoutes from './resources/files/routes';
import orderRoutes from './resources/orders/routes';
import productRoutes from './resources/products/routes';
import userRoutes from './resources/users/routes';

const routePrefix = config.app.routePrefix || '';

export default buildRoutes({
    [`${routePrefix}/v1/account`]: accountRoutes,
    [`${routePrefix}/v1/carts`]: cartRoutes,
    [`${routePrefix}/v1/checkouts`]: checkoutRoutes,
    [`${routePrefix}/v1/collections`]: collectionRoutes,
    [`${routePrefix}/v1/contents`]: contentRoutes,
    [`${routePrefix}/v1/files`]: fileRoutes,
    [`${routePrefix}/v1/orders`]: orderRoutes,
    [`${routePrefix}/v1/products`]: productRoutes,
    [`${routePrefix}/v1/users`]: userRoutes
});
