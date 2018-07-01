const _baseUrl = "https://free.currencyconverterapi.com/api/v5";

export class CurrencyConverterApi {
  
  static fetchCurrencies() {
    const url = `${_baseUrl}/countries`
    return fetch(url).then(res => res.json());
  }

  static getRate(rateName) {
    const url = `${_baseUrl}/convert?q=${rateName}&compact=ultra`;
    return fetch(url).then(res => res.json());
  }
}