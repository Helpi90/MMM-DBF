# MMM-DBF (Deutsche Bahn Frontend)

This is a module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/).

It displays the next departure times and delays (with details) of trains from any city and station in Germany.

## App Theme

<p float="left">
  <img src="dbfApp_wide.png" width="40%" />
  <img src="dbfApp_dark.png" width="40%" />
</p>

## App Detail (after click on a train)

<p float="left">
  <img src="dbfApp_high.png" width="40%" />
  <img src="dbfApp_detail.png" width="40%" />
</p>

## Table

<img src="dbfTable.png" width="40%" />

## Installing the module

Clone this repository in yours `~/MagicMirror/modules/`:

`git clone https://github.com/Helpi90/MMM-DBF`

To use this module, add the following configuration block to the modules array in the `config/config.js` file:

```js
let config = {
  modules: [
    {
      module: "MMM-DBF",
      position: "top_right",
      config: {
        showApp: false,
        station: "Düsseldorf Hbf",
        height: "600px",
        width: "400px",
        timeOption: "time+countdown"
      }
    }
  ]
};
```

## Configuration options for App and table

| **Option**        | **Default**        | **Description**                                                                           |
| ----------------- | ------------------ | ----------------------------------------------------------------------------------------- |
| `station`         | `"Düsseldorf Hbf"` | _Required_ <br/>German Station Name [(Check possible name)](https://dbf.finalrewind.org/) |
| `updateInterval`  | `60000`            | _Optional_ <br/>How often should the data be fetched.                                     |
| `platform`        | `""`               | _Optional_ <br/> Only show platform. Supports multiple strings, separated by comma (",")  |
| `via`             | `""`               | _Optional_ <br/> Only show routs via. Supports multiple strings, separated by comma (",") |
| `onlyArrivalTime` | `false`            | _Optional_ <br/> Boolean to show only ArrivalTime (at Station)                            |
| `hideLowDelay`    | `false`            | _Optional_ <br/> Boolean to hide delay smaller 5 min                                      |

<br/>

## Configuration options only for App view

| **Option**        | **Default** | **Description**                                                                  |
| ----------------- | ----------- | -------------------------------------------------------------------------------- |
| `showApp`         | `false`     | _Required_ <br/> Activate app view                                               |
| `height`          | `"600px"`   | _Optional_ <br/> The height of the App                                           |
| `width`           | `"400px"`   | _Optional_ <br/> The width of the App                                            |
| `showArrivalTime` | `false`     | _Optional_ <br/> Boolean to show arrival time too.                               |
| `showRealTime`    | `false`     | _Optional_ <br/> Boolean to show real-time information instead of timetable data |

<br/>

## Configuration options only for table view

| **Option**           | **Default** | **Description**                                                                                                                           |
| -------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `numberOfResults`    | `10`        | _Optional_ <br/> Number of results to be displayed                                                                                        |
| `withoutDestination` | `""`        | _Optional_ <br/> Show results without destination. Supports multiple strings, separated by comma (","). (e.g. "Duisburg Hbf,Venlo" )      |
| `onlyDestination`    | `""`        | _Optional_ <br/> Only show results wit destination. Supports multiple strings, separated by comma (","). (e.g. "Duisburg Hbf,Venlo" )     |
| `train`              | `""`        | _Optional_ <br/> Only show trains that start with the given string. Supports multiple strings, separated by comma (","). (e.g. "RB33,S" ) |
| `setTableWidth`      | `""`        | _Optional_ <br/> Sets the width of the table in pixel (e.g. "400px" )                                                                     |
| `timeOption`         | `"time"`    | _Optional_ <br/> Changes the type of time <br/> (Options : `time` , `time+countdown` and `countdown`)                                     |
| `showDelayMsg`       | `false`     | _Optional_ <br/> Boolean to show delay massages or not.                                                                                   |
