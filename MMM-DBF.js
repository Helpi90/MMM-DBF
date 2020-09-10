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
        showArrivalTime: false,
        showRealTime: false,
        onlyArrivalTime: false,
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
            base_url+="&show_realtime=1"
        }
        if (this.config.onlyArrivalTime) {
            base_url+= "&admode=dep"
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
        setInterval(function () {
            self.updateDom();
        }, this.config.updateInterval);
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
    },

    /**
     * @description Create App Frame
     * 
     * @returns {HTMLIframeElement}
     */
    getDom: function () {
        var iframe = document.createElement("IFRAME");
        iframe.style = "border:0";
        iframe.width = this.config.width;
        iframe.height = this.config.height;
        iframe.src =  this.gennerateUrl();
        return iframe;
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
            console.log(payload);
            this.updateDom();
        }
    },
});
