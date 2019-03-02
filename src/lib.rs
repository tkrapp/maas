extern crate cfg_if;
extern crate regex;
extern crate js_sys;
extern crate rand;
extern crate serde_json;
extern crate web_sys;
extern crate wasm_bindgen;

#[macro_use]
extern crate lazy_static;

mod utils;

use std::collections::{BTreeMap, HashMap, HashSet};
use std::sync::Mutex;
use cfg_if::cfg_if;
use rand::prelude::*;
use rand::distributions::{WeightedIndex};
use wasm_bindgen::prelude::*;

type Markov = HashMap<String, BTreeMap<String, usize>>;

lazy_static! {
    static ref MARKOV: Mutex<Markov> = Mutex::new(Markov::new());
}

cfg_if! {
    // When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
    // allocator.
    if #[cfg(feature = "wee_alloc")] {
        extern crate wee_alloc;
        #[global_allocator]
        static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
    }
}

#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = Math)]
    fn random() -> f32;

    #[wasm_bindgen(js_namespace = MAASConsole)]
    fn log(message: &JsValue);
}

// A macro to provide `println!(..)`-style syntax for `console.log` logging.
macro_rules! log {
    ( $( $t:tt )* ) => {
        log(&format!( $( $t )* ).into());
    }
}

macro_rules! hset {
    ( $( $x:expr ),* ) => {
        {
            let mut temp_set = HashSet::new();
            $(
                temp_set.extend($x);
            )*
            temp_set
        }
    };
}

fn parse_text(text: &str) -> Vec<String> {
    console_error_panic_hook::set_once();

    log!("start parse_text");

    log!("initialize regex");
    let re: regex::Regex = regex::Regex::new(r"(\w+(?:[-']\w+)?|[\.,;!&\?])").unwrap();

    log!("parse text");
    let words = re.captures_iter(text)
                  .map(|cap| format!("{}", &cap[0]))
                  .collect::<Vec<String>>();

    log!("done parse_text");
    words
}

fn calculate_markov(initial_state: String, states: Vec<String>) -> Markov {
    log!("start calculate_markov");
    let mut markov: Markov = Markov::new();
    let mut previous_state: String = initial_state;

    for state in states.iter() {
        let item = markov
                .entry(previous_state.clone())
                .or_insert(BTreeMap::new());
        let item = item.entry(state.clone()).or_insert(0);

        *item += 1;

        previous_state = state.clone();
    }

    log!("done calculate_markov");
    markov
}

#[wasm_bindgen]
pub fn get_markov_from_text(text: &str) {
    log!("start get_markov_from_text");
    let markov = calculate_markov(".".to_string(), parse_text(text));

    log!("fill global markov chain with new data");
    let mut global_markov = MARKOV.lock().unwrap();
    global_markov.clear();
    global_markov.extend(markov);

    log!("done get_markov_from_text");
}

#[allow(unused)]
#[wasm_bindgen]
pub fn generate_text(min_length: usize) -> String {
    console_error_panic_hook::set_once();

    let mut seed: [u8; 32] = [0; 32];
    (0..32).map(| idx | {
        seed[idx] = (random() * 100.0) as u8;
    }).collect::<Vec<()>>();

    let punctuation =
        hset!(".,?!".to_string().chars().map(|chr| chr.to_string()));
    let linefeed_after =
        hset!(".?!".to_string().chars().map(|chr| chr.to_string()));
    let mut words: Vec<String> = Vec::new();
    let mut rng = StdRng::from_seed(seed);
    let global_markov = MARKOV.lock().unwrap();

    if global_markov.len() == 0 {
        log!("No Markov chain loaded");

        return "".to_string();
    }

    let mut previous_word: String = if global_markov.contains_key(&".".to_string()) {
        ".".to_string()
    } else {
        global_markov.keys().nth(0).unwrap().clone()
    };
    let mut word: String;

    while words.len() < min_length
        || (
            words.len() >= min_length
            && linefeed_after.contains(&previous_word) == false
        ) {
        let next_words: Vec<String> = global_markov
                .get(&previous_word).unwrap()
                .keys()
                .map(| word | {
                    word.clone()
                })
                .collect();
        let weights = global_markov.get(&previous_word).unwrap().values();
        let choices = WeightedIndex::new(weights).unwrap();
        let choice = choices.sample(&mut rng);
        word = next_words[choice].clone();

        words.push(word.clone());

        previous_word = word;
    }

    words
        .iter()
        .map(| word | {
            let postfix = if linefeed_after.contains(word) {
                "\n"
            } else {
                ""
            };
            let prefix = if punctuation.contains(word) {
                ""
            } else {
                " "
            };

            format!("{}{}{}", prefix, word, postfix)
        })
        .collect::<Vec<String>>()
        .join("")
}
