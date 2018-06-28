import idb from "idb";

export class App {

  constructor() {
    this._registerServiceWorker();
  }
  _registerServiceWorker() {
    if(!navigator.serviceWorker) return;
    navigator.serviceWorker.register("../../../sw.js").then(reg => {
      console.log("service worker installed");
    });
  }
}