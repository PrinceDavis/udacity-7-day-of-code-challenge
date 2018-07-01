import idb from "idb";
export const openDatabase = () => {
  if(!navigator.serviceWorker) return Promise.resolve();

  return idb.open("tg-currency-convertr", 1, upgradeDb => {
    const currencyStore = upgradeDb.createObjectStore("countries", {keyPath: "id"})

    currencyStore.createIndex("by-id", "id");
  });
}

export const convertObjToArray = obj => {
  const array = [];
  Object.keys(obj).forEach(key => {
    array.push(obj[key]);
  });
  return array;
}

export const calculateRate = (rate, amount) => {
  const total = rate * amount;
  return Math.round(total * 100) / 100;
}

export const getCountryFromIP = () => {
  const apiKey = "b723884e14638e04eed21a72b2fb19735517eb3713a6285ba8247cc0";
  return fetch(`https://api.ipdata.co/?api-key=${apiKey}`).then(res => res.json());
}