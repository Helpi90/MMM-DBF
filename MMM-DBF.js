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
        scrollAfter: 0,
        hideLowDelay: false,
        withoutDestination: '',
        onlyDestination: '',
        train: '',
        height:"600px",
        width:"400px",
        setTableWidth: "",
        timeOption: "time+countdown", // time+countdown or countdown
        showDelayMsg: false
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
            if (!this.dataRequest.error) {
                if (this.config.setTableWidth) {
                    tableWrapper.style.width = this.config.setTableWidth;
                }
                let departures = this.dataRequest["departures"]
                let tableHead= this.createTableHeader(departures);
                tableWrapper.appendChild(tableHead);   
                this.createTableContent(departures, tableWrapper); 
            } else {
                Log.error(this.dataRequest.error);
            }
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
        let destinations = destinationConfig.split(",")
        for (let index = 0; index < destinations.length; index++) {
            if (train['destination'] === destinations[index]) {
                return true;
            }
        }
        return false;
    },

    /**
     * @description Check if train is in list config.train
     * @param {Object} train 
     */
    checkTrain: function(train) {
        let trains = this.config.train.split(",")
        let trainName = train["train"].split(" ")[0]+train["train"].split(" ")[1];
        for (let i = 0; i < trains.length; i++) {
            if(trainName.includes(trains[i])) {
                return true;
            }
        }
        return false;
    },

    /**
	 * @description Checks time and return day/hour/mins
	 * @param {int} time - Remaining time
	 */
	convertTime: function (scheduledTime) {
		let time = this.calculateTime(scheduledTime);
		if (time >= 3600) {
            let strTime = (Math.floor(time / 3600)).toString();
            return "+" + strTime + " " + this.translate("HOUR");
		}
		if (time >= 60) {
			let strTime = (Math.floor(time / 60)).toString();
			return strTime + " " + this.translate("MINUTE");
        } else {
            return this.translate("NOW");
        }
	},

    /**
     * @description Calculate remaining time
     * @param {int:int} scheduledTime 
     */
    calculateTime: function(scheduledTime) {
        let d = new Date();
        let time = scheduledTime.split(":");
        let dateTrain = new Date(d.getFullYear(),d.getMonth(),d.getDate(),time[0],time[1])
        let newStamp = new Date().getTime();
        return Math.round((dateTrain.getTime()-newStamp)/1000);;
    },

    /**
     * @description Check msg exists
     * @param {Object[]} departures 
     */
    checkMsgExist: function(departures) {
        for (let index = 0; index < this.getSize(departures); index++) {
            if (departures[index] !== undefined && departures[index]["messages"]["delay"].length > 0) {
                return true;
            }
        }
        return false;
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

        if (this.config.showDelayMsg && this.checkMsgExist(departures)) {
            tableHeadValues.push(this.translate("DELAYMSG"));
        }

        for (let thCounter = 0; thCounter < tableHeadValues.length; thCounter++) {
            let tableHeadSetup = document.createElement("th");
            if (thCounter === 5) {
                tableHeadSetup.style.textAlign = "Left";
            }
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
        let count = 0;
        for (let index = 0; index < size; index++) {
            let obj = departures[index];
            let trWrapper = document.createElement("tr");
            trWrapper.className = 'tr';
            this.checkMsgExist(obj);
            // Check train
            if (this.config.train !== "" && !this.checkTrain(obj)) {
                if (size+1 <= departures.length) {
                    size+=1;
                    continue;
                } else if(size === departures.length) {
                    continue;
                }
            }
            
            if (this.config.withoutDestination !== "" && this.checkDestination(obj,this.config.withoutDestination)) {
                if (size+1 <= departures.length) {
                    size+=1;
                    continue;
                } else if (size === departures.length) {
                    continue;
                }
            }
            
            if (this.config.onlyDestination !== "" &&  !this.checkDestination(obj,this.config.onlyDestination)) {
                if (size+1 <= departures.length) {
                    size+=1;
                    continue;
                } else if (size === departures.length) {
                    continue;
                }
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

            let time;
            if (this.config.onlyArrivalTime) {
                time = obj.scheduledArrival;
            }else {
                time = obj.scheduledDeparture;
            }

            let remainingTime = this.convertTime(time);
            switch (this.config.timeOption) {
                case "time+countdown":
                    tdValues.push(time+ " ("+ remainingTime + ")");
                    break;
                case "countdown":
                    tdValues.push(remainingTime);
                    break;
                default:
                    tdValues.push(time);
                    break;
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

            if (this.config.showDelayMsg && this.checkMsgExist(departures) && obj.delayDeparture > 0 )  {
                if (obj["messages"]["delay"].length > 0) {
                    tdValues.push(obj["messages"]["delay"][0].text);
                }
            }

            count++;
            for (let c = 0; c < tdValues.length; c++) {
                let tdWrapper = document.createElement("td");
                if (tdValues[c].length > this.config.scrollAfter && this.config.scrollAfter > 0) {
                    tdWrapper.innerHTML = '<marquee scrollamount="3" >' + tdValues[c] + '<marquee>';
                } else {
                    tdWrapper.innerHTML = tdValues[c];
                }

                if (c === this.getColDelay()) {
                    tdWrapper.className = 'delay';
                }
                if (c === this.getColDelay() + 1) {
                    tdWrapper.className = 'delay';
                    tdWrapper.style.width = "200px";
                    tdWrapper.style.textAlign = "Left";
                    //tdWrapper.innerHTML = '<marquee scrollamount="3" >' + tdValues[c] + '<marquee>';
                }
                trWrapper.appendChild(tdWrapper);
            }
            tableWrapper.appendChild(trWrapper);
        }
        if (count === 0) {
            let trWrapper = document.createElement("tr");
            trWrapper.className = 'tr';
            let tdWrapper = document.createElement("td");

            if (this.config.onlyDestination !== "" && this.config.train !== "") {
                tdWrapper.innerHTML = "Destination or train not found";
                Log.error("Destination or train not found");
            }
            else if (this.config.onlyDestination !== "") { 
                tdWrapper.innerHTML = "Destination not found";
                Log.error("Destination not found");
            } else if (this.config.train !== "") {
                tdWrapper.innerHTML = "Train not found";
                Log.error("Train not found");
            }

            trWrapper.appendChild(tdWrapper);
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
