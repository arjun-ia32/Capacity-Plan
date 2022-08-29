/*
 * Erlang helpers
 *   Author: Ramalingeshwar Vedagiri
 *   Date: 2022-08-29
 */
"use strict";
//import "..\\..\\Library\\js\\Rama\\stat_function.js";
const ERLANG_MAX_ITERS = 100;
const ERLANG_PRECISION = 0.05;

// Returns workload
function erlang_traffic_intensity(volume, aht_secs) {
    return volume * aht_secs / 3600;
}

function erlang_calc_numerator(traffic_intensity, agents) {
    let x = traffic_intensity ** agents / factorial(agents);
    x *= agents / (agents - traffic_intensity);
    return x;
}

function erlang_probability(traffic_intensity, agents) {
    let x = erlang_calc_numerator(traffic_intensity, agents);
    let sum = 0;
    for (let i = 0; i < agents; ++i) {
        sum += traffic_intensity ** i / factorial(i);
    }
    return x / (sum + x);
}

function erlang_service_level(agents, volume, aht_secs, thres_secs) {
    let traffic_intensity = erlang_traffic_intensity(volume, aht_secs);
    let power = (agents - traffic_intensity) * (thres_secs / aht_secs);
    let p = erlang_probability(traffic_intensity, agents);
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

function erlang_agents(interval_dur, volume, aht_secs, service_level, thres_secs) {
    let traffic_intensity = erlang_traffic_intensity(volume, aht_secs);
    let agents = traffic_intensity / interval_dur;
    let agent_step = 1;
    let worst_diff = 1;
    let diff;
    for (let i = 0; i < ERLANG_MAX_ITERS; ++i) {
        let sl = erlang_service_level(agents, volume, aht_secs, thres_secs);
        diff = Math.abs(service_level - sl);
        if (diff > worst_diff) {
            console.log("erlang_agents() - found a worse match");
            return agents;
        }
        if (diff < ERLANG_PRECISION) {
            return agents;
        }
        worst_diff = Math.min(diff, worst_diff);
        agents += agent_step;
    }
    return agents;
}
