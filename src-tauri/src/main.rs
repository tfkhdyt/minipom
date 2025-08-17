// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(not(target_os = "linux"))]
use notify_rust::Notification;

use rodio::{Decoder, OutputStreamBuilder, Sink};
use std::{fs::File, io::BufReader, sync::Mutex};
use tauri::{path::BaseDirectory, Manager};

// Audio cache to avoid reloading audio files
struct AudioCache {
    button_press_path: Option<String>,
    transition_path: Option<String>,
}

impl AudioCache {
    fn new() -> Self {
        Self {
            button_press_path: None,
            transition_path: None,
        }
    }

    fn get_button_press_path(&mut self, handle: &tauri::AppHandle) -> String {
        if let Some(ref path) = self.button_press_path {
            return path.clone();
        }

        let resource_path = handle
            .path()
            .resolve("audio/button-press.wav", BaseDirectory::Resource)
            .expect("failed to resolve resource")
            .to_string_lossy()
            .to_string();

        self.button_press_path = Some(resource_path.clone());
        resource_path
    }

    fn get_transition_path(&mut self, handle: &tauri::AppHandle) -> String {
        if let Some(ref path) = self.transition_path {
            return path.clone();
        }

        let resource_path = handle
            .path()
            .resolve("audio/alarm-kitchen.mp3", BaseDirectory::Resource)
            .expect("failed to resolve resource")
            .to_string_lossy()
            .to_string();

        self.transition_path = Some(resource_path.clone());
        resource_path
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .manage(Mutex::new(AudioCache::new()))
        .invoke_handler(tauri::generate_handler![
            play_transition_audio,
            play_button_press,
            send_notification
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command(async)]
fn play_button_press(handle: tauri::AppHandle, state: tauri::State<'_, Mutex<AudioCache>>) {
    let mut cache = state.lock().unwrap();
    let resource_path = cache.get_button_press_path(&handle);

    let stream_handle = OutputStreamBuilder::open_default_stream().unwrap();
    let sink = Sink::connect_new(&stream_handle.mixer());
    let file = File::open(&resource_path).unwrap();
    sink.append(Decoder::new(BufReader::new(file)).unwrap());
    sink.sleep_until_end();
}

#[tauri::command(async)]
fn play_transition_audio(handle: tauri::AppHandle, state: tauri::State<'_, Mutex<AudioCache>>) {
    let mut cache = state.lock().unwrap();
    let resource_path = cache.get_transition_path(&handle);

    let stream_handle = OutputStreamBuilder::open_default_stream().unwrap();
    let sink = Sink::connect_new(&stream_handle.mixer());
    let file = File::open(&resource_path).unwrap();
    sink.append(Decoder::new(BufReader::new(file)).unwrap());
    sink.sleep_until_end();
}

#[tauri::command(async)]
fn send_notification(title: &str, body: Option<&str>) {
    #[cfg(target_os = "linux")]
    {
        let output = std::process::Command::new("notify-send")
            .arg(title)
            .args(body.iter())
            .output()
            .expect("Failed to execute notify-send command");

        if !output.status.success() {
            eprintln!(
                "Failed to send notification: {}",
                String::from_utf8_lossy(&output.stderr)
            );
        }
    }

    #[cfg(not(target_os = "linux"))]
    {
        let mut builder = Notification::new();
        builder.summary(title);
        if let Some(body_text) = body {
            builder.body(body_text);
        }
        builder.show().expect("Failed to show notification");
    }
}
