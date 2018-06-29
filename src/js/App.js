import { CurrencyConverterApi } from "./currency-converter-api";
import idb from "idb";

const openDatabase = () => {
  if(!navigator.serviceWorker) return Promise.resolve();

  return idb.open("tg-currency-convertr", 1, upgradeDb => {
    const currencyStore = upgradeDb.createObjectStore("currency", {keyPath: "id"})

    currencyStore.createIndex("by-id", "id");
  });
}

export class App {

  constructor() {
    this._dbPromise = openDatabase();
    this._registerServiceWorker();
    CurrencyConverterApi.fetchCurrencies().then(data => {
      console.log(data);
    }).catch(err => console.log(err))
  }

  _registerServiceWorker() {
    if(!navigator.serviceWorker) return;
    navigator.serviceWorker.register("../../sw.js").then(() => {
    });
  }

  _convertEventHandler(event) {
    CurrencyConverterApi.getRate()
  }
}