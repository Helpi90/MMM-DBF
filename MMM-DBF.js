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
        //Flag for check if module is loaded
        this.loaded = false;
        // Schedule update timer.
        setInterval(function () {
            this.updateDom();
        }, this.config.updateInterval);
    },

    /**
     * @description Schedule next update.
     * @param {int} delay - Milliseconds before next update.
     */
    scheduleUpdate: function (delay) {
        let nextLoad = this.config.updateInterval;
        if (typeof delay !== "undefined" && delay >= 0) {
            nextLoad = delay;
        }
        setTimeout(function () {
            this.updateApp();
        }, nextLoad);
    },

    /**
     * @description Update App
     */
    updateApp: function() {
        this.src = this.vrrAppUrl();
        this.updateDom(this.config.animationSpeed);
        this.scheduleUpdate(this.config.refreshInterval);
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
});
