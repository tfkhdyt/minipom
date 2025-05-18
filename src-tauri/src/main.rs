// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(not(target_os = "linux"))]
use notify_rust::Notification;

use rodio::{Decoder, OutputStream, Sink};
use std::{fs::File, io::BufReader};
use tauri::{path::BaseDirectory, Manager};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            play_transition_audio,
            play_button_press,
            send_notification
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command(async)]
fn play_button_press(handle: tauri::AppHandle) {
    let resource_path = handle
        .path()
        .resolve("audio/button-press.wav", BaseDirectory::Resource)
        .expect("failed to resolve resource");

    let (_stream, stream_handle) = OutputStream::try_default().unwrap();
    let sink = Sink::try_new(&stream_handle).unwrap();
    let file = File::open(&resource_path).unwrap();
    sink.append(Decoder::new(BufReader::new(file)).unwrap());
    sink.sleep_until_end();
}

#[tauri::command(async)]
fn play_transition_audio(handle: tauri::AppHandle) {
    let resource_path = handle
        .path()
        .resolve("audio/alarm-kitchen.mp3", BaseDirectory::Resource)
        .expect("failed to resolve resource");

    let (_stream, stream_handle) = OutputStream::try_default().unwrap();
    let sink = Sink::try_new(&stream_handle).unwrap();
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
