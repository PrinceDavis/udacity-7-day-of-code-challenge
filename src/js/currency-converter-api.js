const _baseUrl = "https://free.currencyconverterapi.com/api/v5";

export class CurrencyConverterApi {
  
  static fetchCurrencies() {
    console.log("making web request");
    const url = `${_baseUrl}/currencies`
    return fetch(url).then(res => res.json());
  }

  static getRate(from, to) {
    const query = `${from}_${to}`;
    const url = `${_baseUrl}/convert?q=${query}&compact=ultra`;
    return fetch(url).then(res => res.json());
  }
}