import { AsyncLocalStorage } from "async_hooks";

const shopContext = new AsyncLocalStorage();

export const getShopId = () => {
  return shopContext.getStore();
};

export const runWithShopContext = (shopId, callback) => {
  return shopContext.run(shopId, callback);
};
