import { CurrencyConverterApi } from "./currency-converter-api";
import idb from "idb";

const openDatabase = () => {
  if(!navigator.serviceWorker) return Promise.resolve();

  return idb.open("tg-currency-convertr", 1, upgradeDb => {
    const currencyStore = upgradeDb.createObjectStore("currency", {keyPath: "id"})

    currencyStore.createIndex("by-id", "id");
  });
}

const convertObjToArray = obj => {
  const array = [];
  Object.keys(obj).forEach(key => {
    array.push(obj[key]);
  });
  return array;
}

export class App {

  constructor() {
    this._dbPromise = openDatabase();
    this._registerServiceWorker();
    this._cacheCurrencies().then(() => {
      console.log("content cached");
    });
  }

  _registerServiceWorker() {
    if(!navigator.serviceWorker) return;
    navigator.serviceWorker.register("../../sw.js").then(() => {
    });
  }

  async _cacheCurrencies() {
    // no point checking for update to currency if there is no network
    if(!navigator.onLine) return;
    try {
      const networkData = convertObjToArray(
        (await CurrencyConverterApi.fetchCurrencies()).results
      )
      const db = await this._dbPromise;
      const tx = db.transaction("currency", "readwrite");
      const store = tx.objectStore("currency");
      const index = store.index("by-id");
      const currencies = await index.getAll();

      if(!(networkData.length > currencies.length)) return;
      networkData.forEach(data => {
        store.put(data);
      });
    } catch (error) {
      throw error;
    }

  }

  _convertEventHandler(event) {
    CurrencyConverterApi.getRate()
  }
}