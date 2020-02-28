// ==UserScript==
// @name         HB Magaza Urun Arama
// @namespace    https://github.com/mustmercan/HBUrunArama
// @version      0.1
// @description  HB Toplu Ürün Arama
// @author       mustmercan
// @match        *merchant.hepsiburada.com/#ProductListing*
// @grant        none
// ==/UserScript==




class HBProductSerch
{
    constructor()
    {
        this.$=window.$;
        console.log("HB Product Search Create");
    }
}

(function() {
    var hbSearch=new HBProductSerch();
})();