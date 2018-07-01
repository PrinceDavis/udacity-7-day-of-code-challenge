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
    const fromSelect = this._fromSelect;
    const toSelect = this._toSelect;
    this._getCurrencies().then(currencies => {
      for(const currency of currencies) {
        fromSelect.options[fromSelect.options.length] = new Option(currency.currencyName, currency.currencyId);
        toSelect.options[toSelect.options.length] = new Option(currency.currencyName, currency.currencyId);
      }
    })
  }

  _convertEventHandler() {
    const fromCurrency = this._fromSelect.options[this._fromSelect.selectedIndex].value;
    const toCurrency = this._toSelect.options[this._toSelect.selectedIndex].value;
    const fromAmount = this._fromInput.value;
    const toAmount = this._toInput.value;
    let fromCurrencyIsLead = false;
    let toCurrencyIsLead = false;
    let rateName
    let amountToUse;

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
  
    if(!fromAmount || isNaN(fromAmount)) {
      toCurrencyIsLead = true;
      amountToUse  = toAmount;
      rateName = `${toCurrency}_${fromCurrency}`;
    }else {
      fromCurrencyIsLead = true;
      amountToUse = fromAmount
      rateName = `${fromCurrency}_${toCurrency}`;
    }
    CurrencyConverterApi.getRate(rateName).then(rate => {
      const total = calculateRate(rate[rateName], amountToUse);
      if(toCurrencyIsLead) {
        this._fromInput.value = total;
      }else {
        this._toInput.value = total;
      }
    })
  }

  _setupDomHooks(container) {

    this._fromSelect = container.querySelector("#from");
    this._toSelect = container.querySelector("#to");
    this._convertButton = container.querySelector("#button");
    this._fromInput = container.querySelector("#fromInput");
    this._toInput = container.querySelector("#toInput");
    this._srcCurrencyAmountInfo = container.querySelector("#info-src-amount");
    this._srcCurrencyNameInfo = container.querySelector("#info-src-currency");
    this._tgtCurrencyAmountInfo = container.querySelector("#info-tgt-amount");
    this._tgtCurrencyNameInfo = container.querySelector("#info-tgt-currency");

    this._convertButton.addEventListener("click", this._convertEventHandler.bind(this));
    this._fromInput.onchange = this._convertEventHandler.bind(this);
    this._toInput.onchange = this._convertEventHandler.bind(this);

  }

  async _performDefaultLookup() {
    try {
      const countryFromIP = await getCountryFromIP();

      const [defaultCountry, comparisonCountry] = await Promise.all([
        this._getCurrencies("US"),
        this._getCurrencies(countryFromIP.countryCode) // is id the same as countryCode?
      ]);

      const options = this._fromSelect.options;

      // set select option of from and to elements to default currencies
      for(let i = 0; i < options.length; i++) {
        if(options[i].text === defaultCountry.currencyName) {
          this._fromSelect.options[i].selected = true;
        }
        if(options[i].text === comparisonCountry.currencyName) {
          this._toSelect.options[i].selected = true;
        }
      }

      // get rate for default currencies
      const rateName = `${defaultCountry.currencyId}_${comparisonCountry.currencyId}`;
      const rate = await CurrencyConverterApi.getRate(rateName);
      //convert rate and display for user
      const total = calculateRate(rate[rateName], 1);
      this._toInput.value = total;
      this._fromInput.value = 1;

      this._srcCurrencyAmountInfo.textContent = 1;
      this._srcCurrencyNameInfo.textContent = defaultCountry.currencyName;
      this._tgtCurrencyAmountInfo.textContent = total;
      this._tgtCurrencyNameInfo.textContent = comparisonCountry.currencyName;

    } catch (error) {
      throw error;
    }
  }
}


