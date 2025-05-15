/* global Log Module */

/* MagicMirror²
 * Module: MMM-DBF
 *
 * By Marc Helpenstein <helpi9007@gmail.com>
 * MIT Licensed.
 */

Module.register("MMM-DBF", {
  defaults: {
    updateInterval: 60000, // 1 minute
    station: "Düsseldorf Hbf",
    platform: "",
    via: "",
    showApp: false,
    showArrivalTime: false,
    showRealTime: false,
    onlyArrivalTime: false,
    numberOfResults: 10,
    hideLowDelay: false,
    withoutDestination: "",
    onlyDestination: "",
    train: "",
    height: "600px",
    width: "400px",
    setTableWidth: "",
    timeOption: "time", // time+countdown or countdown
    showDelayMsg: false
  },

  requiresVersion: "2.1.0",

  /**
   * @description Helper function to generate API url
   *
   * @returns {String} url
   */
  gennerateUrl() {
    let baseUrl = "https://dbf.finalrewind.org/";
    baseUrl += `${this.config.station}?platforms=${this.config.platform}&via=${this.config.via}&hide_opts=1`;
    if (this.config.showArrivalTime) {
      baseUrl += "&detailed=1";
    }
    if (this.config.showRealTime) {
      baseUrl += "&show_realtime=1";
    }
    if (this.config.onlyArrivalTime) {
      baseUrl += "&admode=dep";
    } else {
      baseUrl += "&admode=dep";
    }
    if (this.config.hideLowDelay) {
      baseUrl += "&hidelowdelay=1";
    }
    return baseUrl;
  },

  /**
   * @description Calls updateIterval
   */
  start() {
    // Flag for check if module is loaded
    this.loaded = false;
    // Schedule update timer.
    this.getData();
  },

  /**
   * @description Gets data from dbf.finalrewind.org
   */
  async getData() {
    const self = this;

    const urlApi = `${this.gennerateUrl()}&mode=json&version=3`;
    const dataRequest = await fetch(urlApi);

    if (!dataRequest.ok) {
      let message = `An error has occured: ${dataRequest.status}`;
      if (dataRequest.status === 300) {
        message += ` - Ambiguous station name.`;
      }
      throw new Error(message);
    } else {
      const data = await dataRequest.json();
      self.processData(data);
    }
  },

  /**
   * @description Schedule next update.
   * @param {int} delay - Milliseconds before next update.
   */
  scheduleUpdate(delay) {
    const self = this;
    let nextLoad = this.config.updateInterval;
    if (typeof delay !== "undefined" && delay >= 0) {
      nextLoad = delay;
    }
    setTimeout(() => {
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
  getDom() {
    if (this.config.showApp) {
      const iframe = document.createElement("IFRAME");
      iframe.style = "border:0";
      iframe.width = this.config.width;
      iframe.height = this.config.height;
      iframe.src = this.gennerateUrl();
      return iframe;
    }
    const tableWrapper = document.createElement("table");
    tableWrapper.className = "small mmm-dbf-table";
    if (this.dataRequest) {
      if (!this.dataRequest.error) {
        if (this.config.setTableWidth) {
          tableWrapper.style.width = this.config.setTableWidth;
        }
        const { departures } = this.dataRequest;
        const tableHead = this.createTableHeader(departures);
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
  getSize(departures) {
    if (departures.length < this.config.numberOfResults) {
      return departures.length;
    }
    return this.config.numberOfResults;
  },

    /**
     * @description Check delay exist
     * @param {Object[]} departures 
     */
    checkDelayExist: function (departures) {
        for (let index = 0; index < this.getSize(departures); index++) {
            if (departures[index].delayDeparture) {
                if (this.config.hideLowDelay && departures[index].delayDeparture >= 5) {
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
  getColDelay() {
    if (this.config.via !== "") {
      return 5;
    }
    return 4;
  },

  /**
   * @param {Object} train
   */
  getViaFromRoute(train) {
    const viaConfigList = this.config.via.split(",");
    const route = train.via;
    for (let i = 0; i < route.length; i += 1) {
      const city = route[i];
      for (let j = 0; j < viaConfigList.length; j += 1) {
        if (city.includes(viaConfigList[j])) {
          return viaConfigList[j];
        }
      }
    }
    return false;
  },

  /**
   * @description Check if destination is in list config.withoutDestination
   * @param {Object} train
   */
  checkDestination(train, destinationConfig) {
    const destinations = destinationConfig.split(",");
    for (let index = 0; index < destinations.length; index += 1) {
      if (train.destination === destinations[index]) {
        return true;
      }
    }
    return false;
  },

  /**
   * @description Check if train is in list config.train
   * @param {Object} train
   */
  checkTrain(train) {
    const trains = this.config.train.split(",");
    const trainName = train.train.split(" ")[0] + train.train.split(" ")[1];
    for (let i = 0; i < trains.length; i += 1) {
      if (trainName.includes(trains[i])) {
        return true;
      }
    }
    return false;
  },

  /**
   * @description Checks time and return day/hour/mins
   * @param {int} time - Remaining time
   */
  convertTime(scheduledTime) {
    const time = this.calculateTime(scheduledTime);
    if (time >= 3600) {
      const strTime = Math.floor(time / 3600).toString();
      return `+${strTime} ${this.translate("HOUR")}`;
    }
    if (time >= 60) {
      const strTime = Math.floor(time / 60).toString();
      return `${strTime} ${this.translate("MINUTE")}`;
    }
    return this.translate("NOW");
  },

  /**
   * @description Calculate remaining time
   * @param {int:int} scheduledTime
   */
  calculateTime(scheduledTime) {
    const d = new Date();
    const time = scheduledTime.split(":");
    const dateTrain = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      time[0],
      time[1]
    );
    const newStamp = new Date().getTime();
    return Math.round((dateTrain.getTime() - newStamp) / 1000);
  },

  /**
   * @description Check msg exists
   * @param {Object[]} departures
   */
  checkMsgExist(departures) {
    for (let index = 0; index < this.getSize(departures); index += 1) {
      if (
        departures[index] !== undefined &&
        departures[index].messages.delay.length > 0
      ) {
        return true;
      }
    }
    return false;
  },

  /**
   * @description Creates the header for the Table
   */
  createTableHeader(departures) {
    const tableHead = document.createElement("tr");
    tableHead.className = "border-bottom";

    const tableHeadValues = [
      this.translate("TRAIN"),
      this.translate("TRACK"),
      this.translate("DESTINATION")
    ];

    if (this.config.via !== "") {
      tableHeadValues.push(this.translate("VIA"));
    }
    if (!this.config.onlyArrivalTime) {
      tableHeadValues.push(this.translate("DEPARTURE"));
    } else {
      tableHeadValues.push(this.translate("ARRIVAL"));
    }

        if (this.checkDelayExist(departures) || this.checkCancelledExist(departures)) {
            const delayClockIcon = '<i class="fa fa-clock-o"></i>';
            tableHeadValues.push(delayClockIcon);
        }

    if (this.config.showDelayMsg && this.checkMsgExist(departures)) {
      tableHeadValues.push(this.translate("DELAYMSG"));
    }

    for (
      let thCounter = 0;
      thCounter < tableHeadValues.length;
      thCounter += 1
    ) {
      const tableHeadSetup = document.createElement("th");
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
  createTableContent(departures, tableWrapper) {
    let size = this.getSize(departures);
    let departureCount = 0;
    for (let index = 0; index < size; index += 1) {
      const obj = departures[index];
      const trWrapper = document.createElement("tr");
      trWrapper.className = "tr";
      this.checkMsgExist(obj);

      // Check train
      if (this.config.train !== "" && !this.checkTrain(obj)) {
        if (size + 1 <= departures.length) {
          size += 1;
        }
      } else if (
        this.config.withoutDestination !== "" &&
        this.checkDestination(obj, this.config.withoutDestination)
      ) {
        if (size + 1 <= departures.length) {
          size += 1;
        }
      } else if (
        this.config.onlyDestination !== "" &&
        !this.checkDestination(obj, this.config.onlyDestination)
      ) {
        if (size + 1 <= departures.length) {
          size += 1;
        }
      } else {
        const tdValues = [obj.train, obj.platform, obj.destination];
        if (this.config.via !== "") {
          const via = this.getViaFromRoute(obj);
          if (via === false) {
            tdValues.push("");
          } else {
            tdValues.push(this.getViaFromRoute(obj));
          }
        }

        let time;
        if (this.config.onlyArrivalTime) {
          time = obj.scheduledArrival;
        } else {
          time = obj.scheduledDeparture;
        }

        const remainingTime = this.convertTime(time);
        switch (this.config.timeOption) {
          case "time+countdown":
            tdValues.push(`${time} (${remainingTime})`);
            break;
          case "countdown":
            tdValues.push(remainingTime);
            break;
          default:
            tdValues.push(time);
            break;
        }

            if (this.checkDelayExist(departures) || this.checkCancelledExist(departures)) {
                if (obj.delayDeparture > 0 && !this.config.hideLowDelay) {
                    let delay = ' +' + obj.delayDeparture;
                    tdValues.push(delay);
                }
                else if (obj.delayDeparture >= 5) {
                    let delay = ' +' + obj.delayDeparture;
                    tdValues.push(delay);
                } else if (obj.isCancelled > 0) {
                    tdValues.push(this.translate("CANCELMSG"));
                }
            }

        if (
          this.config.showDelayMsg &&
          this.checkMsgExist(departures) &&
          obj.delayDeparture > 0
        ) {
          if (obj.messages.delay.length > 0) {
            tdValues.push(obj.messages.delay[0].text);
          }
        }

        departureCount += 1;
        for (let c = 0; c < tdValues.length; c += 1) {
          const tdWrapper = document.createElement("td");
          tdWrapper.innerHTML = tdValues[c];

          if (c === this.getColDelay()) {
            tdWrapper.className = "delay";
          }
          if (c === this.getColDelay() + 1) {
            tdWrapper.className = "delay";
            tdWrapper.style.width = "200px";
            tdWrapper.style.textAlign = "Left";
            // tdWrapper.innerHTML = '<marquee scrollamount="3" >' + tdValues[c] + '<marquee>';
          }
          trWrapper.appendChild(tdWrapper);
        }
        tableWrapper.appendChild(trWrapper);
      }
    }

    if (departureCount === 0) {
      const trWrapper = document.createElement("tr");
      trWrapper.className = "tr";
      const tdWrapper = document.createElement("td");

      if (this.config.onlyDestination !== "" && this.config.train !== "") {
        tdWrapper.innerHTML = "Destination or train not found";
        Log.error("Destination or train not found");
      } else if (this.config.onlyDestination !== "") {
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
  getStyles() {
    return ["MMM-DBF.css", "font-awesome.css"];
  },

  /**
   * @description Load translations files
   * @returns {{en: string, de: string}}
   */
  getTranslations() {
    return {
      en: "translations/en.json",
      de: "translations/de.json"
    };
  },
  /**
   * @description Update data and send notification to node_helper
   * @param {*} data
   */
  processData(data) {
    this.dataRequest = data;

    if (this.loaded === false) {
      this.updateDom(this.config.animationSpeed);
    }
    this.loaded = true;
  }
});
