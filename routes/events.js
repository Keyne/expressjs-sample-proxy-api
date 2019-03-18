var express = require('express');
var router = express.Router();
const https = require('https');

var data = '';
var response = [];
var timeline = [];

function findCustomData(arr, key) {
  for(var jj=0; jj<arr.length; jj++) {
    if (arr[jj].key === key) {
      console.log('----------- found', key, arr);
      return arr[jj].value;
    }
  }
  return false;
}

function compareTime(a, b) {
  var date1 = Date.parse(a.timestamp);
  var date2 = Date.parse(b.timestamp);
  console.log('------------- ############### timecompare', date1, date2, a, b);
  return date1 < date2;
}

/* GET users listing. */
router.get('/', function(req, res, next) {

  https.get('https://storage.googleapis.com/dito-questions/events.json', function (resp) {


    // A chunk of data has been recieved.
    resp.on('data', function (chunk) {
      data += chunk;
    });

    resp.on('end', function () {
      response = JSON.parse(data).events;
      for(var i=0; i<response.length; i++) {
        function push(kk, store_name) {
          console.log('------------- push');
          timeline.push({
            "timestamp": response[kk].timestamp,
            "revenue": 0,
            "transaction_id": findCustomData(response[kk].custom_data, 'transaction_id'),
            "store_name": store_name,
            "products": []
          });
        }

        var store_name = findCustomData(response[i].custom_data, 'store_name');

        if(store_name) {
          push(i, store_name);
        }
      }

      if(!timeline.length) {
        return res.json({timeline: []});
      }

      console.log("############# ------- SECOND ------- ###############");
      for (i=0; i<response.length; i++) {
        console.log('###################');
        var product_name = findCustomData(response[i].custom_data, 'product_name');
        var product_price = findCustomData(response[i].custom_data, 'product_price');
        if(product_name) {
          console.log('-----------------', product_name);
          for(var l=0; l<timeline.length; l++) {
            console.log('################### timeline', findCustomData(response[i].custom_data, 'transaction_id'), timeline[l].transaction_id);
            if (timeline[l].transaction_id === findCustomData(response[i].custom_data, 'transaction_id')) {
              console.log('----------------- timeline: ', product_price);
              timeline[l].revenue += product_price;
              timeline[l].products.push({
                "name": product_name,
                "price": product_price
              });
            }
          }
        }
      }
      res.json({"timeline": timeline.sort(compareTime)});
    });

  })

});

module.exports = router;
