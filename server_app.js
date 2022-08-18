/**
 * Date: 2022-08-07
 * Author: Rama Vedagiri
 * Description:
 *    Basic Node.js server for saving files to disk
 **/

const HTTP = require('http');
const PATH = require('path');
const EVENTS = require('events');
const FS = require('fs');
const SD = require('string_decoder');
const { ReadableByteStreamController } = require('stream/web');
//const XL = require('excel4node');
//const express = require('express');

//let app = express();
// Process application/x-www-form-urlencoded
//app.use(bodyParser.urlencoded({extended: true}));
// Process application/json
//app.use(bodyParser.json());

const hostname = '127.0.0.1';
const port = 3000;

const server = HTTP.createServer((req, res) => {

  console.log("req.method = " + JSON.stringify(req.method));
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
  res.setHeader('Access-Control-Max-Age', 2592000); // 30 days
  if (req.method === "GET") {
    let paramString = req.url.slice(1);
    let params = new URLSearchParams(paramString);
    console.log("handling GET request");
    res.writeHead(200, {"Content-Type": "text/plain"});
    if (params.get('action') === 'read') {
      let filename = __dirname + '\\' + params.get('filename');
      console.log("reading filename " + filename);
      FS.readFile(filename, 'UTF-8', function (err, data) {
        if (err) {
          console.log('Error in reading file');
          return;
        }
        console.log('File read complete');
        res.write(data);
        res.end();
      });

    }
    //res.end();
  } else if (req.method === "POST") {
    let body = "";
    let decoder = new SD.StringDecoder('utf-8');

    console.log("handling POST request");

    req.on('data', function (chunk) {
      console.log("got => " + JSON.stringify(chunk));
      body += decoder.write(chunk);
    });

    req.on('end', function(data) {
      body += decoder.end();
      res.statusCode = 200;
      res.setHeader('content-type', 'text/plain');
      console.log("got POST data end");
      console.log(body);
      process_post_request(JSON.parse(body));
    });
  }

});

function process_post_request(request) {
  if (request.action === 'save') {
    //create_excel_test();
    FS.writeFile(request.data.filename, request.data.content, function(err) {
      if (err) {
        console.log("save request: writing " + request.data.filename + " to disk failed");
        console.log(err);
      } else {
        console.log("file " + request.data.filename + " written successfully");
      }
    });
  }
}

function create_excel_test() {
  let wb = XL.Workbook();
  let ws = wb.addWorksheet('Sheet 1');
  let styleHeader = wb.createStyle({
    font: {
      color: '#FF0800',
      size: 14
    },
    numberFormat: '0.00'
  });
  let styleNormal = wb.createSyle({
    font: {
      color: '#000000',
      size: 12
    },
  });

  ws.cell(1, 1).string('Name').style(styleHeader);
  ws.cell(2, 1).string('Rama').style(styleNormal);
  wb.write(__dirname + "test.xlsx");
}

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});
