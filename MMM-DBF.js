/* global Module */

/* Magic Mirror
 * Module: MMM-DBF
 *
 * By Marc Helpenstein <helpi9007@gmail.com>
 * MIT Licensed.
 */

Module.register("MMM-DBF", {
    defaults: {
        updateInterval: 60000, // 1 minute
        retryDelay: 30000, // 30 seconds
        station: "Düsseldorf Hbf",
        platform: '',
        via: '',
        showApp: false,
        showArrivalTime: false,
        showRealTime: false,
        onlyArrivalTime: false,
        numberOfResults: 10,
        hideLowDelay: false,
        withoutDestination: '',
        onlyDestination: 'Venlo,Essen Hbf',
        train: '',
        height:"600px",
		width:"400px",
    },

    requiresVersion: "2.1.0",
    
    /**
     * @description Helper function to generate API url
     * 
     * @returns {String} url
     */
    gennerateUrl: function() {
        let base_url = "https://dbf.finalrewind.org/";
        base_url+= this.config.station + "?platforms=" + this.config.platform + "&via=" + this.config.via +"&hide_opts=1";
        if (this.config.showArrivalTime) {
            base_url+="&detailed=1";
        }
        if (this.config.showRealTime) {
            base_url+="&show_realtime=1";
        }
        if (this.config.onlyArrivalTime) {
            base_url+= "&admode=dep";
        }else {
            base_url+= "&admode=dep";
        }
        if (this.config.hideLowDelay) {
            base_url+= "&hidelowdelay=1"
        }
        return base_url;
    },

    /**
     * @description Calls updateIterval
     */
    start: function () {
        let self = this;
        let dataRequest = null;
        let dataNotification = null;

        //Flag for check if module is loaded
        this.loaded = false;
        // Schedule update timer.
        this.getData();
        console.log(this.gennerateUrl());
    },

    /**
     * @description Gets data from dbf.finalrewind.org
     */
    getData: function () {
        let self = this;

        let urlApi = this.gennerateUrl()+"&mode=json&version=3";
        let retry = true;

        let dataRequest = new XMLHttpRequest();
        dataRequest.open("GET", urlApi, true);
        dataRequest.onreadystatechange = function () {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    self.processData(JSON.parse(this.response));
                } else if (this.status === 401) {
                    self.updateDom(self.config.animationSpeed);
                    Log.error(self.name, this.status);
                    retry = false;
                } else {
                    Log.error(self.name, "Could not load data.");
                }
                if (retry) {
                    self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
                }
            }
        };
        dataRequest.send();
    },

    /**
     * @description Schedule next update.
     * @param {int} delay - Milliseconds before next update.
     */
    scheduleUpdate: function (delay) {
        let self = this;
        let nextLoad = this.config.updateInterval;
        if (typeof delay !== "undefined" && delay >= 0) {
            nextLoad = delay;
        }
        setTimeout(function () {
            self.getData();
        }, nextLoad);
        if (!this.config.showApp) {
            this.updateDom();
        }
    },

    /**
     * @description Create App Frame or HTML table
     * 
     * @returns {HTMLIframeElement}
     */
    getDom: function () {
        if (this.config.showApp) {
            let iframe = document.createElement("IFRAME");
            iframe.style = "border:0";
            iframe.width = this.config.width;
            iframe.height = this.config.height;
            iframe.src =  this.gennerateUrl();
            return iframe;
        }
        let tableWrapper = document.createElement("table");
        tableWrapper.className = "small mmm-dbf-table";
        if (this.dataRequest) {
            let departures = this.dataRequest["departures"]
            let tableHead= this.createTableHeader(departures);
            tableWrapper.appendChild(tableHead);   
            this.createTableContent(departures, tableWrapper); 
        }
        return tableWrapper;
    },

    /**
     * @description Get the size for showing entrys
     * @param {Object[]} departures 
     */
    getSize: function(departures) {
        if (departures.length < this.config.numberOfResults) {
            return departures.length;
        }else {
            return this.config.numberOfResults;
        }
    },

    /**
     * @description Check delay exist
     * @param {Object[]} departures 
     */
    checkDelayExist: function(departures){
        for (let index = 0; index < this.getSize(departures); index++) {
            if (departures[index]["delayDeparture"]) {
                if (this.config.hideLowDelay && departures[index]["delayDeparture"] >= 5) {
                    return true;
                }
                if (!this.config.hideLowDelay) {
                    return true;
                }
            }
        }
        return false;
    },

    /**
     * @description Get col number
     */
    getColDelay: function() {
        if (this.config.via !== "") {
            return 5;
        }else {
            return 4;
        }
    },

    /**
     * @param {Object} train 
     */
    getViaFromRoute: function(train) {
        let viaConfigList = this.config.via.split(",");
        let route = train["via"];
        for (let i = 0; i < route.length; i++) {
            const city = route[i];
            for (let j = 0; j < viaConfigList.length; j++) {
                if(city.includes(viaConfigList[j])) {
                    return viaConfigList[j];
                }
            }
        }
    },

    /**
     * @description Check if destination is in list config.withoutDestination
     * @param {Object} train 
     */
    checkDestination: function(train,destinationConfig) {
        if(destinationConfig !== ""){
            let destinations = destinationConfig.split(",")
            for (let index = 0; index < destinations.length; index++) {
                if (train['destination'] === destinations[index]) {
                    return true;
                }
            }
        }
        return false;
    },

    /**
     * @description Check if train is in list config.train
     * @param {Object} train 
     */
    // TODOOOOO
    checkTrain: function(train) {
        if (this.config.train !== '') {
            let trains = this.config.train.split(",")
            let trainName = train["train"].split(" ")[0]+train["train"].split(" ")[1];
            for (let i = 0; i < trains.length; i++) {
                if(trainName.includes(trains[i])) {
                    return true;
                }
            }
            return false;
        }
        return true;
    },

    /**
     * @description Creates the header for the Table
     */
    createTableHeader: function (departures) {
        let tableHead = document.createElement("tr");
        tableHead.className = 'border-bottom';

        let tableHeadValues = [
            this.translate("TRAIN"),
            this.translate('TRACK'),
            this.translate('DESTINATION'),
        ];

        if (this.config.via !== "") {
            tableHeadValues.push(this.translate('VIA'));
        }
        if (!this.config.onlyArrivalTime) {
            tableHeadValues.push(this.translate('DEPARTURE'));
        } else {
            tableHeadValues.push(this.translate('ARRIVAL'));
        }
        
        if(this.checkDelayExist(departures)){
            let delayClockIcon = '<i class="fa fa-clock-o"></i>';
            tableHeadValues.push(delayClockIcon);
        }

        for (let thCounter = 0; thCounter < tableHeadValues.length; thCounter++) {
            let tableHeadSetup = document.createElement("th");
            tableHeadSetup.innerHTML = tableHeadValues[thCounter];
            tableHead.appendChild(tableHeadSetup);
        }
        return tableHead;
    },

    /**
     * @param usableResults
     * @param tableWrapper
     * @returns {HTMLTableRowElement}
     */
    createTableContent: function (departures, tableWrapper) {
        let self = this;
        let size = this.getSize(departures);
        let foundTrain = false;
        let foundDestination = false;
        for (let index = 0; index < size; index++) {
            let obj = departures[index];
            //console.log(obj);

            let trWrapper = document.createElement("tr");
            trWrapper.className = 'tr';

            // Check train
            if (!this.checkTrain(obj)) {
                if (size+1 <= departures.length) {
                    size+=1;
                    continue;
                } else if(size === departures.length) {
                    continue;
                }
                
            }else {
                foundTrain = true;
            }

            if (foundTrain === false && this.config.train !== "") {
                let tdWrapper = document.createElement("td");
                tdWrapper.innerHTML = "Train not found";
                trWrapper.appendChild(tdWrapper);
                tableWrapper.appendChild(trWrapper);
                console.log("Train not found");
                return;
            }
            
            if (this.checkDestination(obj,this.config.withoutDestination)) {
                if (size+1 <= departures.length) {
                    size+=1;
                    continue;
                } else if (size === departures.length) {
                    continue;
                }
            }

            if (!this.checkDestination(obj,this.config.onlyDestination)) {
                if (size+1 <= departures.length) {
                    size+=1;
                    continue;
                } else if (size === departures.length) {
                    continue;
                }
            }else {
                foundDestination = true;
            }

            if (foundDestination === false && this.config.onlyDestination !== "") {
                let tdWrapper = document.createElement("td");
                tdWrapper.innerHTML = "Destination not found";
                trWrapper.appendChild(tdWrapper);
                tableWrapper.appendChild(trWrapper);
                console.log("Destination not found");
                return;
            }

            let tdValues = [
                obj.train,
                obj.platform,
                obj.destination,
            ];

            if (this.config.via !== "") {
                let via = this.getViaFromRoute(obj);
                if(via === undefined) {
                    continue;
                }else {
                    tdValues.push(this.getViaFromRoute(obj));
                }
            }

            if (this.config.onlyArrivalTime) {
                tdValues.push(obj.scheduledArrival);
            }else {
                tdValues.push(obj.scheduledDeparture);
            }
            
            if(this.checkDelayExist(departures)){
                if(obj.delayDeparture > 0 && !this.config.hideLowDelay){
                    let delay = ' +' + obj.delayDeparture;
                    tdValues.push(delay);
                }
                else if (obj.delayDeparture >= 5) {
                    let delay = ' +' + obj.delayDeparture;
                    tdValues.push(delay);
                }
            }

            for (let c = 0; c < tdValues.length; c++) {
                let tdWrapper = document.createElement("td");

                tdWrapper.innerHTML = tdValues[c];

                if (c === this.getColDelay()) {
                    tdWrapper.className = 'delay';
                }
                trWrapper.appendChild(tdWrapper);
            }
            tableWrapper.appendChild(trWrapper);
        }
    },

    /**
     * @description Define required styles.
     * @returns {[string,string]}
     */
    getStyles: function () {
        return ["MMM-DBF.css", "font-awesome.css"];
    },

    /**
     * @description Load translations files
     * @returns {{en: string, de: string}}
     */
    getTranslations: function () {
        return {
            en: "translations/en.json",
            de: "translations/de.json"
        };
    },
    /**
     * @description Update data and send notification to node_helper
     * @param {*} data 
     */
    processData: function (data) {
        this.dataRequest = data;

        if (this.loaded === false) {
            this.updateDom(this.config.animationSpeed);
        }
        this.loaded = true;

        // the data if load
        // send notification to helper
        this.sendSocketNotification("MMM-DBF-NOTIFICATION_TEST", "data");
    },
    
    /**
     * @description Handle notification
     * @param {*} notification 
     * @param {*} payload 
     */
    socketNotificationReceived: function (notification, payload) {
        if (notification === "MMM-DBF-NOTIFICATION_TEST") {
            // set dataNotification
            this.dataNotification = payload;
            //this.updateDom();
        }
    },
});
