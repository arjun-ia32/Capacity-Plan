/*
 * Capacity Plan app - js handlers
 *   Author: Ramalingeshwar Vedagiri
 *   Date: 2022-08-18
 */
"use strict";

let DATA = { table: [] };
let CSV_PRIMRARY_DATABASE_FILENAME = 'csv\\billable_hc.csv';
let CSV_RAMP_FILENAME = 'csv\\ramp_plan.csv';
let CSV_HIRING_CONFIG = 'csv\\hiring_config.csv';
let PRECISION = 2;
let HOT_CONFIG_LIST = [];

/*
**************************************************************************************
* Code for GET and POST requsts sent to the client
**************************************************************************************
*/
const DIR_PATH = 'C:\\Users\\Sun\\Documents\\JavaScript\\Projects\\Capacity Plan\\';
const SERVER_URL = 'http://127.0.0.1:3000'; //localhost

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
    xhr_post.open('POST', SERVER_URL);
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
    //console.log("send_get_request() was successfully called.");
    let xhr_get = new XMLHttpRequest();
    xhr_get.onreadystatechange = function() {
        //console.log("GET onreadystatechange readyState = " + xhr_get.readyState + " status = " + xhr_get.status);
        if (xhr_get.readyState === 4 && xhr_get.status === 200) {
            callback(xhr_get.responseText);
        }
    };
    xhr_get.open('GET', SERVER_URL + '?action='+ data.action + '&filename=' + data.data.filename, true);
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
  read_csv_file_with_path(CSV_PRIMRARY_DATABASE_FILENAME, function(csv_data) {
    read_csv_file_with_path(CSV_RAMP_FILENAME, function(csv_ramp_data) {
      read_csv_file_with_path(CSV_HIRING_CONFIG, function(csv_hiring_config_data) {
        create_overall_lob(csv_data);
        handle_csv_data(csv_data, csv_ramp_data, csv_hiring_config_data);
      });
    });
  });
}

function read_csv_file_with_path(filepath, callback) {
  //const filepath = CSV_PRIMRARY_DATABASE_FILENAME;
  let get_req_data = {
    action: 'read',
    data: {
      filename: filepath
    }
  };

  xmlhttp_get_request(get_req_data, function(csv_text) {
    console.log("read_csv_file() succeeded " + filepath);
    let csv_data = Papa.parse(csv_text, {
      header: true,
      skipEmptyLines: true
    });
    console.log(csv_data);
    callback(csv_data.data);
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
      "Over/Under": { "calc": "sum" },
      "SL %": { "calc": "avg" },
      "SL Thres Secs": { "calc": "avg" },
      "New Hire": { "calc": "sum" },
      "FTE Weekly Hrs": { "calc": "avg" },
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
            //if (prop === 'HC Billable') {
            //  console.log('added ' + num + ' from lob ' + csv_data[i+j*nrows]['Subprocess'] + ' total ' + csv_data[new_idx][prop]);
            //}
          }
          if (calc_map[prop].calc === 'avg') {
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

function handle_csv_data(csv_data, ramp_data, hiring_config_data) {
  let hot_container = document.getElementById("hot_test");
  let lob_list_container = document.getElementById("lob_list");
  let select_lob_container = document.getElementById("select-lob");

  document.getElementById("account-header").innerText = csv_data[0]['Account'];

  console.log("handle_csv_data()");
  select_lob_container.innerHTML = "";

  // Populate LOB list
  for (let i = 0; i < csv_data.unique_lob_list.length; i++) {
    let opt = document.createElement('option');
    opt.value = csv_data.unique_lob_list[i];
    opt.appendChild(document.createTextNode(csv_data.unique_lob_list[i]));
    select_lob_container.appendChild(opt);
    console.log("handle_csv_data(): lob: " + csv_data.unique_lob_list[i]);
    let config = create_hot_config_data(csv_data, ramp_data, hiring_config_data, opt.value);
    config.lob = csv_data.unique_lob_list[i];
    HOT_CONFIG_LIST.push(config);
  }

  let on_lob_change = () => {
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
          console.log("row " + row + " (" + config.transposed.table[row]['metric'] + ") with property " + prop + " changed from " + oldValue + " to " + newValue);
          let metric = config.transposed.table[row]['metric'];
          if (typeof config.transposed.has_dependents[metric] !== 'undefined') {
            console.log('Found dependents for ' + metric);
            console.log(config.transposed.has_dependents[metric]);

            let single_row = {};
            config.transposed.table.forEach((row, idx) => {
                  single_row[config.transposed.table[idx]['metric']] = row[prop];
            });
            //console.log("single_row is below:");
            //console.log(single_row);
            let new_table = [single_row];
            config.transposed.has_dependents[metric].forEach((dependent) => {
              //let dependent = config.transposed.has_dependents[metric][0];
              new_table = new_table.map(config.transposed.callbacks[dependent]);
              //console.log("new_table with calculated value:");
              //console.log(new_table);
              console.log("Setting config.transposed.table[" + config.transposed.row_mapping[dependent] + "][" + prop + "] = " + new_table[0]);
              console.log(config.transposed.callbacks[dependent]);
              config.transposed.table[config.transposed.row_mapping[dependent]][prop] = new_table[0]; // internal table
              hot.setDataAtRowProp(config.transposed.row_mapping[dependent], prop, new_table[0]); // HTML Display table
            });
          }
          config.transposed.table[row][prop] = newValue; // internal table
          //hot.setDataAtRowProp(ou, prop, config.transposed.table[ou][prop]); // HTML table for the user
        });
      }
    }
  }

  select_lob_container.addEventListener('change', on_lob_change);
  on_lob_change();
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
      filename: DIR_PATH + CSV_PRIMRARY_DATABASE_FILENAME,
      content: Papa.unparse(double_trans.table),
    }
  });
}

function save_csv_file() {
  save_table(HOT_CONFIG_LIST);
}

function metrics_to_display(billing_type) {
  let display_metrics = ['Account', 'Subprocess', 'HC Billable', 'HC New Hires', 'Planned Occupancy %', 'Planned OOO Shrinkage', 'Planned IO Shrinkage', 'HC Tenured', 'FTE Required Gross', 'HC Production', 'Over/Under'];
  if (billing_type === 'Transaction') {
    display_metrics = display_metrics.concat(['Volume', 'AHT']);
  } else if (billing_type === 'Transaction_Erlang') {
    display_metrics = display_metrics.concat(['Volume', 'AHT', 'SL %', 'SL Thres Secs']);
  }
  
  return display_metrics;
}

function rows_to_hide(transposed, billing_type) {
  let to_display = metrics_to_display(billing_type);
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
  data.callbacks[new_header] = calc_func;
  if (typeof data.has_dependents === 'undefined')
    data.has_dependents = {};
  for (let i = 0; i < sources.length; ++i) {
    if (typeof data.has_dependents[sources[i]] === 'undefined')
      data.has_dependents[sources[i]] = [];
    data.has_dependents[sources[i]].push(new_header);
  }
}

function check_if_we_can_add_new_batches(data, current_month) {
  //let ou = data.table[current_month]['Over/Under'];
  let lob = data.table[current_month]['Subprocess'];
  let min_ou = data.table[Math.min(data.table.length, current_month + data.ramp.max_months)]['Over/Under'];
  if (min_ou >= 0) {
    console.log("check_if_we_can_add_new_batches(): return min_ou >= 0" +
    " lob = " + lob +
    " min_ou " + min_ou +
    " ramp.max_months = " + data.ramp.max_months);
      return; // Over unders are in positive
  }
  min_ou = Math.round(Math.abs(min_ou));
  if (min_ou < data.hiring.config['Min Batch Size']) {
    console.log("check_if_we_can_add_new_batches(): return min_ou < Min Batch Size" +
    " lob = " + lob +
    " min_ou " + min_ou +
    " min batch size = " + data.hiring.config['Min Batch Size'] + 
    " ramp.max_months = " + data.ramp.max_months);
    return; // Cannot hire small batches
  }

  let max_hiring = data.hiring.config['Max HC Hiring Size'];
  let hc_plot_now = Math.min(min_ou, max_hiring);
  let hc_carry_over = Math.max(0, min_ou - hc_plot_now);

  console.log("check_if_we_can_add_new_batches(): lob = " + lob +
    " min_ou " + min_ou +
    " ramp.max_months = " + data.ramp.max_months +
    " min batch size = " + data.hiring.config['Min Batch Size'] + 
    " hc_plot_now = " + hc_plot_now + 
    " hc_carry_over = " + hc_carry_over);
}

function create_hot_config_data(csv_data, ramp_data, hiring_config_data, lob) {
  let data = {
    table: csv_data,
    ramp: {},
    hiring: {},
    callbacks: {},
    header_text_list: { date: 'Month', billable_hc: 'Billable HC', actual_hc: 'Actual HC', over_under: 'Over/Under' },
    has_dependents: {},
  };

  data.table = data.table.filter((row, index) => row['Subprocess'] === lob);
  data.ramp.table = ramp_data.filter((row, index) => row['Subprocess'] === lob);
  data.ramp.max_months = data.ramp.table.length / 4;
  console.log(hiring_config_data);
  data.hiring.config = hiring_config_data.filter((row, index) => row['Subprocess'] === lob)[0];
  console.log(data.hiring.config + " lob = " + lob);

  let billing_type = data.table[0]['Billing Type'];
  if (billing_type === 'Transaction') {
    add_calculation(data, 'HC Billable', ['Volume', 'AHT'],
      (row) => row["HC Billable"] = parseFloat((parseFloat(row['Volume']) * parseFloat(row['AHT']) / 3600) / parseFloat(row['FTE Weekly Hrs'])).toFixed(PRECISION));
  } else if (billing_type === 'Transaction_Erlang') {
    add_calculation(data, 'HC Billable', ['Volume', 'AHT', 'SL %', 'SL Thres Secs'],
      (row) => row["HC Billable"] = parseFloat(erlang_agents({
        volume: parseFloat(row['Volume']),
        aht_secs: parseFloat(row['AHT']),
        service_level: parseFloat(row['SL %']) / 100,
        thres_secs: parseFloat(row['SL Thres Secs']),
        interval_dur: parseFloat(row['FTE Weekly Hrs']),
      })).toFixed(PRECISION));
  }

  add_calculation(data, 'FTE Required Gross', ['HC Billable', 'Planned OOO Shrinkage', 'Planned Occupancy %'],
    (row) => row["FTE Required Gross"] = parseFloat(parseFloat(row["HC Billable"]) / (1 - parseFloat(row["Planned OOO Shrinkage"]) / 100) / (parseFloat(row["Planned Occupancy %"]) / 100)).toFixed(PRECISION));
  add_calculation(data, 'HC Production', ['HC Tenured'],                                  (row) => row["HC Production"] = parseFloat(row["HC Tenured"]));
  add_calculation(data, 'Over/Under', ['HC Production', 'FTE Required Gross'],
    (row) => row["Over/Under"] = parseFloat(parseFloat(row["HC Production"] - parseFloat(row["FTE Required Gross"]))).toFixed(PRECISION));

  if (lob !== 'Overall')
    check_if_we_can_add_new_batches(data, 0);
  let transposed = transpose_data(data, 'Date');
  transposed = rows_to_hide(transposed, billing_type);
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