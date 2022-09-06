/*
 * Erlang helpers
 *   Author: Ramalingeshwar Vedagiri
 *   Date: 2022-08-29
 */
"use strict";
//import "..\\..\\Library\\js\\Rama\\stat_function.js";
const ERLANG_MAX_ITERS = 20;
const ERLANG_PRECISION = 0.05;
const ERLANG_DEBUG = true;

// Returns workload
function erlang_traffic_intensity(volume, aht_secs) {
    return volume * aht_secs / 3600;
}

function erlang_log(msg) {
    if (ERLANG_DEBUG)
        console.log(msg);
}


function erlang_calc_numerator(traffic_intensity, agents) {
    let x = traffic_intensity ** agents / factorial(agents);
    x *= agents / Math.max(1, agents - traffic_intensity);
    return x;
}

function erlang_probability(traffic_intensity, agents) {
    let x = erlang_calc_numerator(traffic_intensity, agents);
    let sum = 0;
    for (let i = 0; i < agents; ++i) {
        sum += traffic_intensity ** i / factorial(i);
    }
    erlang_log("x = " + x +
        " y = " + sum);
    return x / (sum + x);
}

function erlang_service_level(agents, volume, aht_secs, thres_secs, interval_dur) {
/*
    console.log(agents);
    console.log(volume);
    console.log(aht_secs);
    console.log(thres_secs);
    */
    let erlang = erlang_traffic_intensity(volume, aht_secs) / interval_dur;
    let power = (agents - erlang) * (thres_secs / aht_secs);
    let p = erlang_probability(erlang, agents);

    erlang_log("erlang = " + erlang +
        " power = " + power +
        " prob = " + p)
        " result = " + (1 - (p * Math.E ** -power));
    return 1 - (p * Math.E ** -power);
}

function erlang_average_speed_of_answer(agents, volume, aht_secs, thres_secs) {
    let ti = erlang_traffic_intensity(volume, aht_secs);
    let p = erlang_probability(agents, volume, aht_secs, thres_secs);
    return (p * aht_secs) / (agents - ti);
}

function match_fp(lhs, rhs, precision) {
    return Math.abs(rhs - lhs) <= precision;
}


// TODO: Fractional agents not yet fully suppported
/*
 pass an object with = {
    volume: ,
    aht_secs: ,
    service_level: ,
    thres_secs:,

    // Optional
    interval_dur:,
    precision: ,
    max_iters: ,
    agent_step: ,
 }
 */
function erlang_agents(args) {
    if (!args.interval_dur)
        args.interval_dur = 1;
    if (!args.precision)
        args.precision = ERLANG_PRECISION;
    if (!args.max_iters)
        args.max_iters = ERLANG_MAX_ITERS
    if (!args.agent_step)
        args.agent_step = 1;

    let traffic_intensity = erlang_traffic_intensity(args.volume, args.aht_secs);
    let agents = Math.round(traffic_intensity / args.interval_dur);
    let worst_diff = 1;

    erlang_log(args);

    for (let i = 0; i < args.max_iters; ++i) {
        erlang_log(args);
        let sl = erlang_service_level(agents, args.volume, args.aht_secs, args.thres_secs, args.interval_dur);
        let diff = Math.abs(args.service_level - sl);
        erlang_log("erlang_agents() - match with agents " + agents + " diff " + diff + " worst_diff " + worst_diff + " sl " + sl + " agents " + agents);
        if (diff > worst_diff) {
            erlang_log("erlang_agents() - found a worse match");
            return agents;
        }
        if (diff < args.precision) {
            erlang_log("erlang_agents() - match with diff " + diff);
            return agents;
        }
        worst_diff = Math.min(diff, worst_diff);
        agents += args.agent_step;
    }
    return agents;
}