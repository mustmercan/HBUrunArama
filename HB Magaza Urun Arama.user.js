// ==UserScript==
// @name         HB Magaza Urun Arama
// @namespace    https://github.com/mustmercan/HBUrunArama
// @version      0.8
// @description  HB Toplu Ürün Arama
// @author       mustmercan
// @match        *merchant.hepsiburada.com*
// @include      *merchant.hepsiburada.com*
// @grant        none
// @require http://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==





class HBProductSerch {

    constructor(create) {
        this.SearchListKey = "Searchlist";
        this.$ = $;
        this.localStorageHelper = new LocalStorageHelper();
        
        this.container=this.$("body").append("<div id='HBProductSerch'/>").find("#HBProductSerch");
        this.importText=this.container.append(`<p><textarea id="importText" rows="20" cols="50"></textarea></p>`).find("#importText");
        this.importButton=this.container.append(`<p><button id="importButton">İçe Aktar</button><p>`).find("#importButton").on("click",(e)=>{e.preventDefault();this.importData();});
        this.startButton=this.container.append(`<p><button id="startButton">Ara</button><p>`).find("#startButton").on("click",(e)=>{e.preventDefault();this.startSearch();});;
        this.resultContainer=this.container.append(`<div id="resultContainer"></div>`).find("#resultContainer");



        console.log("HB Product Search Create",create);

       this.refreshTable();
    }

    importData=()=>{
        let data=this.importText.val();
        if(data)
        {
            let datas=data.split("\n");
            let list=[]
            for (let index = 0; index < datas.length; index++) {
                const d = datas[index];
                if(d)
                {
                    list.push({ "searchData": d.trim()})
                }
            }
            this.localStorageHelper.setLocalData(this.SearchListKey,list);
        }
        this.refreshTable();
    }

    getSearchList = () => this.localStorageHelper.getLocalData(this.SearchListKey);

    startSearch = async () => {        
        let list = this.getSearchList();
        this.refreshTable(list);
        if (this.getSearchList() && list.length > 0) {
            for (let index = 0; index < list.length; index++) {
                let element = list[index];
                if (!element.status || element.status <= 0) {
                    try {
                        element.status = 1;
                        this.refreshTable(list);
                        let detail = await this.waitAndSearch(element.searchData);
                        element.detail = detail;
                        element.status = 2;
                    } catch (error) {
                        element.status = -1;
                        element.error = error;
                    }
                    this.localStorageHelper.setLocalData(this.SearchListKey, list);
                    this.refreshTable(list);

                }

            }
            console.log(list);
            this.refreshTable();
        }
    }

    refreshTable=(list)=>
    {
        this.resultContainer.html(this.getTable(list));
    }

    waitAndSearch = async (searchData) => {
        let waitSecond = this.getRndInteger(1005, 3169);
        console.log(`${searchData} Wait ${waitSecond}`)
        return new Promise((resolve, reject) => {
            window.setTimeout(async () => {
                try {
                    console.log(`${searchData} searchAndDetail`);
                    resolve(await this.searchAndDetail(searchData));
                } catch (error) {
                    reject(error);
                }
            }, waitSecond);

        });
    }



    getToken = () => this.localStorageHelper.getLocalData('token:productcatalog');

    searchProduct = async (searchData) => {
        return new Promise((resolve, reject) => {
            this.$.ajax({
                type: 'GET',
                url: 'https://pim.hepsiburada.com/products/search/' + searchData,
                headers: {
                    "Accept": "application/hal+json",
                    "Accept-Language": "tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3",
                    "Authorization": "Token " + this.getToken(),
                    "Content-Type": "application/hal+json",
                },
            }).done(function (data) {
                resolve(data);
            });


        });
    }

    productDetail = async (productHref) => {
        return new Promise((resolve, reject) => {
            this.$.ajax({
                type: 'GET',
                url: 'https://pim.hepsiburada.com' + productHref,
                headers: {
                    "Accept": "application/hal+json",
                    "Accept-Language": "tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3",
                    "Authorization": "Token " + this.getToken(),
                    "Content-Type": "application/hal+json",
                },
            }).done(function (data) {
                resolve(data);
            });


        });
    }

    searchAndDetail = async (searchData) => {
        return new Promise((resolve, reject) => {
            let response = [];
            this.searchProduct(searchData).then(async (data) => {
                if (data && data._links && data._links.product) {
                    if (Array.isArray(data._links.product)) {
                        for (let index = 0; index < data._links.product.length; index++) {
                            const element = data._links.product[index];
                            let detail = await this.productDetail(element.href);
                            response.push(detail);
                        }
                    }
                    else {
                        let detail = await this.productDetail(data._links.product.href);
                        response.push(detail);
                    }
                }
                resolve(response);


            })

        })


    }

    getRndInteger = (min, max) => {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    getTable = (list) => {
        list = list?list: this.getSearchList();
        
        let tbody="";
        for (let index = 0; index < list.length; index++) {
            const searchItem = list[index];
            if (searchItem) {
                let status = "Aranmadı";
                if (searchItem.status) {
                    switch (searchItem.status) {
                        case 1:
                            status = "Aranıyor"
                            break;
                        case 2:
                            status = "Tamamlandı"
                            break;
                        case -1:
                            status = "Hata Aldı"
                            break;

                        default:
                            break;
                    }
                }
                let row = "";

                if (searchItem.detail) {
                    for (let i = 0; i < searchItem.detail.length; i++) {
                        row = `<tr>`;
                        row += `<td>${searchItem.searchData}</td>`;
                        row += `<td>${status}</td>`;
                        const detail = searchItem.detail[i];
                        row += `<td>${detail.name}</td>`;
                        row += `<td>${detail.sku}</td>`;
                        row += `<td>${detail.ean}</td>`;
                        row += `<td>${detail.currentMinimumSalePrice? detail.currentMinimumSalePrice.amount:-1}</td>`;
                        row += `<td>${detail.currentMinimumSalePrice?detail.currentMinimumSalePrice.currency:"-"}</td>`;
                        row += "</tr>";
                        tbody+=(row);
                    }
                }
                else {
                    row = `<tr>`;
                    row += `<td>${searchItem.searchData}</td>`;
                    row += `<td>${status}</td>`;
                    row += `<td></td>`;
                    row += `<td></td>`;
                    row += `<td></td>`;
                    row += `<td></td>`;
                    row += "</tr>";
                    tbody+=(row);

                }

               
            }

        }
        let $table = $(`<table id="resultTable"><theaad>
        <tr>
        <th>Aranan</th>
        <th>Durum</th>
        <th>Ad</th>
        <th>SKU</th>
        <th>EAN</th>
        <th>En Düşük Fiyat</th>
        <th>Birim</th>
        </tr>
        </thead>
        <tbody>${tbody}</tbody>
        </table>`);
        return $table;
    }

}

class LocalStorageHelper {

    DataChangeTypes = { "SET": 1, "REMOVE": 2 }
    ChangeDataEventName = "LocalStorageHelper_ChangeData"
    constructor() {
        console.log("LocalStorageHelper")
    }

    setLocalData = (key, data) => {
        if (key) {
            let response = window.localStorage.setItem(key, JSON.stringify(data));
            this.changeData(this.DataChangeTypes.SET, key, data);
            return response;
        }
    }

    getLocalData = (key) => {
        let data = undefined;
        if (key) {

            try {
                let stringData = window.localStorage.getItem(key);
                if (stringData) {
                    try {
                        data = JSON.parse(stringData);
                    } catch (error) {
                        return stringData;
                    }
                }
            } catch (error) {
                console.warn(key, error);
            }
        }
        return data;
    }

    removeData = (key) => {
        let response = window.localStorage.removeItem(key);
        this.changeData(this.DataChangeTypes.REMOVE, key);
        return response;
    }

    changeData = (type, key, data) => {
        let event = new CustomEvent(this.ChangeDataEventName, {
            bubbles: true,
            key: key,
            type: type,
            data: data
        });
        document.body.dispatchEvent(event);
    }

}

var hbSearch=undefined;
(function() {
    if(!hbSearch)
    {
        hbSearch = new HBProductSerch("load");       
    }
   
})();