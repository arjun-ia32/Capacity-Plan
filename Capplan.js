/*
 * Capacity Plan app - js handlers
 *   Author: Ramalingeshwar Vedagiri
 *   Date: 2022-08-18
 */
"use strict";

let DATA = { table: [] };
let CSV_FILENAME = 'billable_hc.csv';
let PRECISION = 2;
let HOT_CONFIG_LIST = [];

/*
**************************************************************************************
* Code for GET and POST requsts sent to the client
**************************************************************************************
*/
const dir_path = 'C:\\Users\\Sun\\Documents\\JavaScript\\Projects\\Capacity Plan\\'
const server_url = 'http://127.0.0.1:3000'; //localhost

/*
* data must be in the below format:
*   data = {
*     action: 'string',
*     data: {
*       // ideally contains data specific to the action string, e.g., filename, etc.
*       filename: 'test.csv'
*       content: 'some-file-content'
*     }
*   }
*/
function xmlhttp_post_request(data) {
    //const data = { action: 'save', data: { filename: dir_path + 'test.csv', content: 'name,age\nRama,29\n' } };
    let json_string = JSON.stringify(data);

    let xhr_post = new XMLHttpRequest();
    xhr_post.open('POST', server_url);
    xhr_post.setRequestHeader('content-type', 'text/plain', true);
    xhr_post.send(json_string);
    xhr_post.onreadystatechange = function() { 
        //console.log("Got a response from the POST request -" + xhr_post.readyState);
        //console.log(xhr_post);
        if (xhr_post.readyState === XMLHttpRequest.DONE) {
            //console.log("response below");
            //console.log(xhr_post.responseText);
        }
    }
}

/*
* data must be in the below format:
*   data = {
*     action: 'string',
*     data: {
*       // ideally contains data specific to the action string, e.g., filename, etc.
*       filename: 'test.csv'
*       content: 'some-file-content'
*     }
*   }
*/
function xmlhttp_get_request(data, callback) {
    //let data = { action: 'read', data: { filename: dir_path + 'billable_hc.csv' } };
    console.log("send_get_request() was successfully called.");
    let xhr_get = new XMLHttpRequest();
    xhr_get.onreadystatechange = function() {
        //console.log("GET onreadystatechange readyState = " + xhr_get.readyState + " status = " + xhr_get.status);
        if (xhr_get.readyState === 4 && xhr_get.status === 200) {
            callback(xhr_get.responseText);
        }
    };
    xhr_get.open('GET', server_url + '?action='+ data.action + '&filename=' + data.data.filename, true);
    xhr_get.send();
}

function process_csv_content(csv_data) {
    console.log(csv_data);
}

/*
**************************************************************************************
* Code handling capacity plan HTML tables
**************************************************************************************
*/

function transpose_array_of_dicts(dict, prop, new_key) {
  let headers = dict.map((x) => x[prop]);
  let transpose = { new_dict: [], row_sequence: [], row_mapping: {}, headers: [] };
  let new_row = {};

  for (let [key, value] of Object.entries(dict[0])) {
    new_row = {};
    if (key && key !== prop) {
      new_row[new_key] = key;
      for (let i = 0; i < headers.length; ++i) {
        new_row[headers[i]] = dict[i][key];
      }
      transpose.new_dict.push(new_row);
      transpose.row_mapping[key] = transpose.row_sequence.length;
      transpose.row_sequence.push(key);
      transpose.headers = [new_key].concat(headers);
    }
  }
  return transpose;
}

function transpose_data(data, col_name, new_key = 'metric') {
    let transposed = transpose_array_of_dicts(data.table, col_name, new_key);
    let new_data = data;
    new_data.row_sequence = transposed.row_sequence;
    new_data.table = transposed.new_dict;
    new_data.headers = transposed.headers;
    new_data.row_mapping = transposed.row_mapping;
    new_data.has_dependents = data.has_dependents;
    return new_data;
}

function read_csv_file() {
  const filepath = CSV_FILENAME;
  let get_req_data = {
    action: 'read',
    data: {
      filename: filepath
    }
  };

  xmlhttp_get_request(get_req_data, function(csv_text) {
    console.log("read csv succeeded");
    let csv_data = Papa.parse(csv_text, {
      header: true
    });
    console.log(csv_data);
    create_overall_lob(csv_data.data);
    handle_csv_data(csv_data.data);
  });
}

function get_header_mapping() {
    let mapping = {
      "Date": { "calc": "none" },
      "Account": { "calc": "none" },
      "Subprocess": { "calc": "none" },
      "HC Billable": { "calc": "sum" },
      "Billing Type": { "calc": "none" },
      "HC New Hires": { "calc": "sum" },
      "AHT": { "calc": "avg" },
      "Volume": { "calc": "sum" },
      "Planned Occupancy %": { "calc": "avg" },
      "HC Known Attrition": { "calc": "sum" },
      "Baseline Attrition %": { "calc": "avg" },
      "Planned OOO Shrinkage": { "calc": "avg" },
      "Planned IO Shrinkage": { "calc": "avg" },
      "HC Tenured": { "calc": "sum" },
      "Batch 01 Ramp ID": { "calc": "sum" },
      "Batch 01 Ramp HC": { "calc": "sum" },
      "Batch 01 Ramp Week": { "calc": "sum" },
      "Batch 02 Ramp ID": { "calc": "sum" },
      "Batch 02 Ramp HC": { "calc": "sum" },
      "Batch 02 Ramp Week": { "calc": "sum" },
      "Batch 03 Ramp ID": { "calc": "sum" },
      "Batch 03 Ramp HC": { "calc": "sum" },
      "Batch 03 Ramp Week": { "calc": "sum" },
      "Batch 04 Ramp ID": { "calc": "sum" },
      "Batch 04 Ramp HC": { "calc": "sum" },
      "Batch 04 Ramp Week": { "calc": "sum" },
      "Batch 05 Ramp ID": { "calc": "sum" },
      "Batch 05 Ramp HC": { "calc": "sum" },
      "Batch 05 Ramp Week": { "calc": "sum" },
      "Batch 01 Training ID": { "calc": "sum" },
      "Batch 01 Training HC": { "calc": "sum" },
      "Batch 01 Training Week": { "calc": "sum" },
      "Batch 02 Training ID": { "calc": "sum" },
      "Batch 02 Training HC": { "calc": "sum" },
      "Batch 02 Training Week": { "calc": "sum" },
      "Batch 03 Training ID": { "calc": "sum" },
      "Batch 03 Training HC": { "calc": "sum" },
      "Batch 03 Training Week": { "calc": "sum" },
      "Batch 04 Training ID": { "calc": "sum" },
      "Batch 04 Training HC": { "calc": "sum" },
      "Batch 04 Training Week": { "calc": "sum" },
      "Batch 05 Training ID": { "calc": "sum" },
      "Batch 05 Training HC": { "calc": "sum" },
      "Batch 05 Training Week": { "calc": "sum" },
      "FTE Required Gross": { "calc": "sum" },
      "HC Production": { "calc": "sum" },
      "Over/Under": { "calc": "sum" }
  }

  return mapping;
}

function create_overall_lob(csv_data) {
  let lob_list = csv_data.map((x) => x['Subprocess']);
  csv_data.unique_lob_list = [...new Set(lob_list)].filter((x) => typeof x !== 'undefined');
  let nrows = lob_list.length / csv_data.unique_lob_list.length;
  let overall = 'Overall';
  let calc_map = get_header_mapping();

  for (let i = 0; i < nrows; ++i) {
    let new_idx = i+lob_list.length;
    //console.log(new_idx);
    csv_data[new_idx] = {};
    for (let prop in csv_data[0]) {
      if (Object.hasOwn(csv_data[0], prop)) {
        //console.log('found prop ' + prop);
        if (calc_map[prop].calc !== 'none') {
          if (typeof csv_data[new_idx][prop] === 'undefined') {
            csv_data[new_idx][prop] = 0;
          }
          //console.log('summing');

          for (let j = 0; j < csv_data.unique_lob_list.length; ++j) {
            //console.log("summing data at row " + i+j*nrows);
            let num = parseFloat(csv_data[i+j*nrows][prop]);
            if (isNaN(num)) {
              num = csv_data[i+j*nrows][prop] = 0; // change all NaN to 0
            }
            csv_data[new_idx][prop] += num;
            if (prop === 'HC Billable') {
              console.log('added ' + num + ' from lob ' + csv_data[i+j*nrows]['Subprocess'] + ' total ' + csv_data[new_idx][prop]);
            }
          }
          if (calc_map[prop].calc === 'avg' && i === 0) {
            csv_data[new_idx][prop] /= csv_data.unique_lob_list.length;
          }
        } else {
          if (prop === 'Subprocess') {
            csv_data[new_idx][prop] = overall;
          } else {
            csv_data[new_idx][prop] = csv_data[i][prop];
          }
        }
      }
    }
  }

  csv_data.unique_lob_list.push(overall);
  console.log("create_overall_lob()");
  console.log(nrows);
  console.log(lob_list.length);
  console.log(csv_data);
}

function handle_csv_data(csv_data) {
  let hot_container = document.getElementById("hot_test");
  let lob_list_container = document.getElementById("lob_list");
  let select_lob_container = document.getElementById("select-lob");

  document.getElementById("account-header").innerText = csv_data[0]['Account'];

  console.log("handle_csv_data()");
  select_lob_container.innerHTML = "";
  for (let i = 0; i < csv_data.unique_lob_list.length; i++) {
    let opt = document.createElement('option');
    opt.value = csv_data.unique_lob_list[i];
    opt.appendChild(document.createTextNode(csv_data.unique_lob_list[i]));
    select_lob_container.appendChild(opt);
    let config = create_hot_config_data(csv_data, opt.value);
    config.lob = csv_data.unique_lob_list[i];
    HOT_CONFIG_LIST.push(config);
  }

  
  select_lob_container.addEventListener('change', () => {
      let lob_name = select_lob_container.value;
      let config;
      console.log("select on lob change to " + lob_name);
      for (let i = 0; i < HOT_CONFIG_LIST.length; ++i) {
        if (HOT_CONFIG_LIST[i].lob === lob_name) {
          config = HOT_CONFIG_LIST[i];
          break;
        }
      }

      if (typeof config === 'undefined') {
        console.log("could not find lob name in HOT_CONFIG_LIST");
        throw "Could not find lob name " + lob_name;
      }

      hot_container.innerHTML = "";
      //console.log("select change, after for loop");
      //console.log(config);
      //console.log(HOT_CONFIG_LIST);
      let hot = new Handsontable(hot_container, config);
      config.afterChange_rama = (changes) => {
        if (changes) {
          changes.forEach(([row, prop, oldValue, newValue]) => {
            console.log("row " + row + " with property " + prop + " changed from " + oldValue + " to " + newValue);
            let metric = config.transposed.table[row]['metric'];
            if (typeof config.transposed.has_dependents[metric] !== 'undefined') {
              console.log('Found dependents for ' + metric);
              console.log(config.transposed.has_dependents[metric]);
            }
            config.transposed.table[row][prop] = newValue;
            if (metric === 'HC Tenured') {
              let hc_prod = config.transposed.row_mapping['HC Production'];
              config.transposed.table[hc_prod][prop] = config.transposed.table[row][prop];
            }
            if (metric === 'HC Billable' || metric === 'Planned OOO Shrinkage' || metric === 'Planned Occupancy %') {
              let occu = config.transposed.row_mapping['Planned Occupancy %'];
              let bill = config.transposed.row_mapping['HC Billable'];
              let shrink = config.transposed.row_mapping['Planned OOO Shrinkage'];
              let gross = config.transposed.row_mapping['FTE Required Gross'];
              config.transposed.table[gross][prop] = parseFloat(config.transposed.table[bill][prop] / ((100 - parseFloat(config.transposed.table[shrink][prop])) / 100) / (parseFloat(config.transposed.table[occu][prop]) / 100)).toFixed(PRECISION);
            }
            if (metric === 'HC Billable' || metric === 'Planned OOO Shrinkage' || metric === 'Planned Occupancy %' || metric === 'HC Tenured' || metric === 'HC Production' || metric === 'FTE Required Gross') {
              console.log('changing over/under');
              let ou = config.transposed.row_mapping['Over/Under'];
              let a = config.transposed.row_mapping['HC Production'];
              let b = config.transposed.row_mapping['FTE Required Gross'];
              config.transposed.table[ou][prop] = parseFloat(config.transposed.table[a][prop] - config.transposed.table[b][prop]).toFixed(PRECISION);
              hot.setDataAtRowProp(ou, prop, config.transposed.table[ou][prop]);
            }
          });
        }
      }
    });
}

function remove_calculated_properties(data) {
  for (let i = 0; i < data.table.length; ++i) {
    delete data.table[i]["FTE Required Gross"];
    delete data.table[i]["HC Production"];
    delete data.table[i]["Over/Under"];
  }
  return data;
}

function remove_overall(data) {
  console.log('remove_overall()');
  console.log(data.table);
  data.table = data.table.filter((value) => value['Subprocess'] !== 'Overall');
  return data;
}

function save_table(hot_config_list) {
  let double_trans = { table: [] };
  for (let i = 0; i < hot_config_list.length; ++i) {
    if (hot_config_list[i].lob !== 'Overall') { // Do not save overall to CSV
      let dt = transpose_data(JSON.parse(JSON.stringify(hot_config_list[i].transposed)), 'metric', 'Date');
      double_trans.table = double_trans.table.concat(remove_calculated_properties(dt).table);
    }
  }
  console.log("save table:");
  console.log(double_trans.table);
  xmlhttp_post_request({
    action: 'save',
    data: {
      filename: dir_path + CSV_FILENAME,
      content: Papa.unparse(double_trans.table),
    }
  });
}

function save_csv_file() {
  save_table(HOT_CONFIG_LIST);
}

function metrics_to_display() {
  let display_metrics = ['Account', 'Subprocess', 'HC Billable', 'HC New Hires', 'Planned Occupancy %', 'Planned OOO Shrinkage', 'Planned IO Shrinkage', 'HC Tenured', 'FTE Required Gross', 'HC Production', 'Over/Under'];
  return display_metrics;
}

function rows_to_hide(transposed) {
  let to_display = metrics_to_display();
  transposed.rows_to_hide = [];
  for (let i = 0; i < transposed.table.length; ++i) {
    if (!to_display.find((x) => x === transposed.table[i]['metric'])) {
      transposed.rows_to_hide.push(i);
    }
  }
  return transposed;
}

function add_calculation(data, new_header, sources, calc_func) {
  data.table.map(calc_func);
  if (typeof data.has_dependents === 'undefined')
    data.has_dependents = {};
  for (let i = 0; i < sources.length; ++i) {
    if (typeof data.has_dependents[sources[i]] === 'undefined')
      data.has_dependents[sources[i]] = [];
    data.has_dependents[sources[i]].push(new_header);
  }
}

function create_hot_config_data(csv_data, lob) {
  let data = {
    table: csv_data,
    header_text_list: { date: 'Month', billable_hc: 'Billable HC', actual_hc: 'Actual HC', over_under: 'Over/Under' },
    has_dependents: {},
  };

  data.table = data.table.filter((value, index) => {
    //console.log("checking " + value['Subprocess'] + ' against lob ' + lob);
    return value['Subprocess'] === lob;
  });
  //console.log('after filter()>');
  //console.log(data.table);

  add_calculation(data, 'FTE Required Gross', ['HC Billable', 'Planned OOO Shrinkage'],
    (row) => row["FTE Required Gross"] = parseFloat(parseFloat(row["HC Billable"]) / (1 - parseFloat(row["Planned OOO Shrinkage"]) / 100) / (parseFloat(row["Planned Occupancy %"]) / 100)).toFixed(PRECISION));
  add_calculation(data, 'HC Production', ['HC Tenured'],                                  (row) => row["HC Production"] = parseFloat(row["HC Tenured"]));
  add_calculation(data, 'Over/Under', ['HC Production', 'FTE Required Gross'],
    (row) => row["Over/Under"] = parseFloat(parseFloat(row["HC Production"] - parseFloat(row["FTE Required Gross"]))).toFixed(PRECISION));

  //data.table.map((row) => row["FTE Required Gross"] = parseFloat(row["HC Billable"]) / (1 - parseFloat(row["Planned OOO Shrinkage"]) / 100));
  //data.table.map((row) => row["HC Production"] = parseFloat(row["HC Tenured"]));
  //data.table.map((row) => row["Over/Under"] = parseFloat(row["HC Production"] - parseFloat(row["FTE Required Gross"])));
  let transposed = transpose_data(data, 'Date');
  transposed = rows_to_hide(transposed);
  //console.log(transposed.rows_to_hide);
  //console.log(transposed.has_dependents);

  let hot_config = {
    transposed: transposed,
    data: transposed.table,
    rowHeaders: false,
    hiddenRows: {
      rows: transposed.rows_to_hide,
    },
    afterChange_rama: () => {},
    afterChange: (changes) => { hot_config.afterChange_rama(changes) }, //work around for not being able to call the hot object from here
    colHeaders: true,
    contextMenu: true,
    height: "auto",
    colHeaders: transposed.headers,
    licenseKey: 'non-commercial-and-evaluation',
    cells(row, col) {
      let cell_properties = {};
      if (row === transposed.row_mapping['Over/Under']) {
        cell_properties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
          Handsontable.renderers.TextRenderer.apply(this, arguments);
          if (col <= 0) return;
          td.style.color = '#00AA00';
          if (parseInt(value) < 0) {
            td.style.color = 'red'; // display negative values in red
          } 
        }
      }
      return cell_properties;
    }
  }
  return hot_config;
}