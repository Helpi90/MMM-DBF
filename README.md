# MMM-DBF (Deutsche Bahn Frontend)
This is a module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/).

Displays the next departure times and delays (with details) of Trains from any city and station in germany.

### App Theme

<p float="left">
  <img src="dbfApp_wide.png" width="40%" />
  <img src="dbfApp_dark.png" width="40%" /> 
</p>

### App Detail (after click on a train)
<p float="left">
  <img src="dbfApp_high.png" width="40%" />
  <img src="dbfApp_detail.png" width="40%" /> 
</p>

## Installing the module
Clone this repository in your `~/MagicMirror/modules/`:

`git clone https://github.com/Defjam121/MMM-DBF`


To use this module, add the following configuration block to the modules array in the `config/config.js` file:
```js
var config = {
    modules: [
        {
            module: 'MMM-DBF',
            position: 'top_right',
            config: {
                station: "Düsseldorf Hbf",
                height:"600px",
                width:"400px",
            }
        }
    ]
}
```

## Configuration options

| **Option** | **Default**  | **Description** |
| --- | ---  | --- |
| `station` | `"Düsseldorf Hbf"`  | *Required* <br/>German Station Name
| `updateInterval` |  `60000` |*Optional* <br/>How often should the data be fetched. 
| `platform` | `' '` | *Optional* <br/> Only show platform. Supports multiple strings, separated by comma (",")
| `via` | `' '` | *Optional* <br/> Boolean to show routs via. Supports multiple strings, separated by comma (",")
| `height` | `600px` | *Optional* <br/> The height of the App
| `width` | `400px` | *Optional* <br/> The width of the App
| `showArrivalTime` | `false` | *Optional* <br/> Boolean to show arrival time too. 
| `showRealTime` | `false` | *Optional* <br/> Boolean to show real-time information instead of timetable data
| `onlyArrivalTime` | `false` | *Optional* <br/> Boolean to show only ArrivalTime