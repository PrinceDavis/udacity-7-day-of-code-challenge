import { openDatabase, convertObjToArray, calculateRate, getCountryFromIP } from "./utils";
import { CurrencyConverterApi } from "./currency-converter-api";

/* To Do */

// Should I be reaching out to the dom all the time?
// clean up bad method naming

export class App {

  constructor(container) {
    this._dbPromise = openDatabase();
    this._registerServiceWorker();
    this._cacheCurrencies().then(() => {
      this._setupDomHooks(container);
      this._populateView();
      this._performDefaultLookup();
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
      const tx = db.transaction("countries", "readwrite");
      const store = tx.objectStore("countries");
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

  _getCurrencies(id) {
    return this._dbPromise.then(db => {
      const index = db.transaction("countries").objectStore("countries").index("by-id");
      if(id) {
        return index.get(id);
      }
      return index.getAll();
    });
  }

  _populateView() {
    this._getCurrencies().then(countries => {
      for(const country of countries) {
        this._srcCurrency.options[this._srcCurrency.options.length] = new Option(country.currencyName, country.currencyId);

        this._tgtCurrency.options[this._tgtCurrency.options.length] = new Option(country.currencyName, country.currencyId);
      }
    })
  }

  _convertEventHandler(event) {
    let toConvertFromTgt = false;
    const srcCurrency = this._srcCurrency.options[this._srcCurrency.selectedIndex].value;
    const tgtCurrency = this._tgtCurrency.options[this._tgtCurrency.selectedIndex].value;
    let rateName =`${srcCurrency}_${tgtCurrency}`;
    let amountToUse = this._srcCurrencyAmount.value;
    if(event.target.id == "tgt-currency-amount") {
      toConvertFromTgt = true;
      rateName = `${tgtCurrency}_${srcCurrency}`;
      amountToUse = this._tgtCurrencyAmount.value;
    }
    
    CurrencyConverterApi.getRate(rateName).then(rate => {
      const total = calculateRate(rate[rateName], amountToUse);
      if(toConvertFromTgt){
        this._srcCurrencyAmount.value = total;

        this._srcCurrencyAmountInfo.textContent = event.target.value;
        this._srcCurrencyNameInfo.textContent = this._tgtCurrency.options[this._tgtCurrency.selectedIndex].text;

        this._tgtCurrencyAmountInfo.textContent = total;
        this._tgtCurrencyNameInfo.textContent = this._srcCurrency.options[this._srcCurrency.selectedIndex].text;;
      }else {
        this._tgtCurrencyAmount.value = total;

        this._srcCurrencyAmountInfo.textContent = event.target.value;
        this._srcCurrencyNameInfo.textContent = this._srcCurrency.options[this._srcCurrency.selectedIndex].text;

        this._tgtCurrencyAmountInfo.textContent = total;
        this._tgtCurrencyNameInfo.textContent = this._tgtCurrency.options[this._tgtCurrency.selectedIndex].text;;
      }
    });
  }

  _setupDomHooks(container) {

    this._srcCurrency = container.querySelector("#src-currency");
    this._tgtCurrency = container.querySelector("#tgt-currancy");
    this._srcCurrencyAmount = container.querySelector("#src-currency-amount");
    this._tgtCurrencyAmount = container.querySelector("#tgt-currency-amount");
    this._srcCurrencyAmountInfo = container.querySelector("#info-src-amount");
    this._srcCurrencyNameInfo = container.querySelector("#info-src-currency");
    this._tgtCurrencyAmountInfo = container.querySelector("#info-tgt-amount");
    this._tgtCurrencyNameInfo = container.querySelector("#info-tgt-currency");

    this._srcCurrency.onchange = this._convertEventHandler.bind(this);
    this._tgtCurrency.onchange = this._convertEventHandler.bind(this);
    this._srcCurrencyAmount.onchange = this._convertEventHandler.bind(this);
    this._tgtCurrencyAmount.onchange = this._convertEventHandler.bind(this);
  }

  async _performDefaultLookup() {
    try {
      const countryFromIP = await getCountryFromIP();

      const [defaultCountry, comparisonCountry] = await Promise.all([
        this._getCurrencies("US"),
        this._getCurrencies(countryFromIP.country_code) // is id the same as countryCode?
      ]);

      const options = this._srcCurrency.options;

      // set select option of from and to elements to default currencies
      for(let i = 0; i < options.length; i++) {
        if(options[i].text === defaultCountry.currencyName) {
          this._srcCurrency.options[i].selected = true;
        }
        if(options[i].text === comparisonCountry.currencyName) {
          this._tgtCurrency.options[i].selected = true;
        }
      }

      // get rate for default currencies
      const rateName = `${defaultCountry.currencyId}_${comparisonCountry.currencyId}`;
      const rate = await CurrencyConverterApi.getRate(rateName);
      //convert rate and display for user
      const total = calculateRate(rate[rateName], 1);
      this._tgtCurrencyAmount.value = total;
      this._srcCurrencyAmount.value = 1;

      this._srcCurrencyAmountInfo.textContent = 1;
      this._srcCurrencyNameInfo.textContent = defaultCountry.currencyName;
      this._tgtCurrencyAmountInfo.textContent = total;
      this._tgtCurrencyNameInfo.textContent = comparisonCountry.currencyName;

    } catch (error) {
      throw error;
    }
  }
}


