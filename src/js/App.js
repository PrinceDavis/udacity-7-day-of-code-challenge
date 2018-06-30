import { CurrencyConverterApi } from "./currency-converter-api";
import idb from "idb";

// Should I be reaching out to the dom all the time?

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

  constructor(container) {
    this._setupDomHooks(container);

    this._dbPromise = openDatabase();
    this._registerServiceWorker();

    this._cacheCurrencies().then(() => {
      this._populateView();
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

  _populateView() {
    const fromSelect = this._fromSelect;
    const toSelect = this._toSelect;
    this._getCurrencies().then(currencies => {
      for(const currency of currencies) {
        fromSelect.options[fromSelect.options.length] = new Option(currency.currencyName, currency.id);
        toSelect.options[toSelect.options.length] = new Option(currency.currencyName, currency.id);
      }
    })
  }

  _setupDomHooks(container) {

    this._fromSelect = container.querySelector("#from");
    this._toSelect = container.querySelector("#to");
    this._convertButton = container.querySelector("#button");
    this._fromInput = container.querySelector("#fromInput");
    this._toInput = container.querySelector("#toInput");

    this._convertButton.addEventListener("click", this._convertEventHandler.bind(this));
    this._fromInput.onchange = this._convertEventHandler.bind(this);
    this._toInput.onchange = this._convertEventHandler.bind(this);
  }

  _getCurrencies() {
    return this._dbPromise.then(db => {
      const index = db.transaction("currency").objectStore("currency").index("by-id");
      return index.getAll();
    });
  }

  _convertEventHandler() {
    const fromCurrency = this._fromSelect.options[this._fromSelect.selectedIndex].value;
    const toCurrency = this._toSelect.options[this._toSelect.selectedIndex].value;
    const fromAmount = this._fromInput.value;
    const toAmount = this._toInput.value;
    let fromAmountToUse = 0;

    if(!fromCurrency || !toCurrency ) {
      alert("Opps! I am having a hard time figuring out what you  me to do");
      return;
    }

    if(
      (!fromAmount && !toAmount) || (isNaN(fromAmount) && isNaN(toAmount)) || (isNaN(fromAmount) && !toAmount) || (!fromAmount && isNaN(toAmount))
    ) {
      alert("Opps! I am having a hard time figuring out what you want me to do");
      return;
    }

    fromAmountToUse = (!fromAmount || isNaN(fromAmount)) ? toAmount : fromAmount;
    CurrencyConverterApi.getRate(fromCurrency, toCurrency).then(rate => {
      console.log(rate);
    })
  }
}


