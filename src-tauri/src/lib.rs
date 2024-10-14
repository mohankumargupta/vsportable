use futures_util::TryStreamExt;
use reqwest;
use serde::Serialize;
use std::{
    fs::{self},
    path::PathBuf,
};
use thiserror::Error;
use tokio::fs::File;
use tokio::io::{AsyncWriteExt, BufWriter}; // For easier error handling
                                           /*
                                           fn list_folders(path: PathBuf) -> Result<Vec<String>, io::Error> {
                                               fs::read_dir(path)?
                                                   .filter_map(|entry| {
                                                       entry.ok().and_then(|e| {
                                                           let path = e.path();
                                                           if path.is_dir() {
                                                               path.file_name()
                                                                   .and_then(|name| name.to_str().map(|s| s.to_string()))
                                                           } else {
                                                               None
                                                           }
                                                       })
                                                   })
                                                   .collect::<Result<Vec<_>, _>>()
                                                   .map_err(|_| io::Error::new(io::ErrorKind::Other, "Failed to read directories"))
                                           }
                                           */

mod vsinstall;
use vsinstall::Error::ReqwestError;

fn list_folders(path: PathBuf) -> Result<Vec<String>, std::io::Error> {
    let mut folders = Vec::new();

    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let path = entry.path();

        // Check if it's a directory
        if path.is_dir() {
            if let Some(folder_name) = path.file_name() {
                if let Some(folder_name_str) = folder_name.to_str() {
                    if folder_name_str.starts_with("vscode-") {
                        folders.push(folder_name_str.to_string());
                    }
                }
            }
        }
    }

    Ok(folders)
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(_name: &str) -> Vec<String> {
    let cmd_args = std::env::args();

    let first = cmd_args.skip(1).next();
    if first.is_some() {
        let firstarg = first.unwrap();
        println!("{:?}", firstarg);
    }
    //println!("{}", first);

    if let Some(download_dir) = dirs::download_dir() {
        //println!("Downloads directory: {:?}", download_dir);
        //let dir = read_dir(download_dir);
        let vscode_folders = list_folders(download_dir);
        match vscode_folders {
            Ok(folders) => {
                println!("{:?}", folders);
                return folders;
            }
            Err(_e) => {
                return Vec::new();
            }
        }
    }
    Vec::new()
}

#[tauri::command]
fn folder_exists(folder: String) -> bool {
    dirs::download_dir().map_or(false, |download_dir| download_dir.join(folder).exists())
}

/*
#[derive(Debug)]
struct HttpError {
    status_code: u16,
    response_body: String,
}
*/

/*



impl std::fmt::Display for HttpError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "HTTP error: status code {}: {}",
            self.status_code, self.response_body
        )
    }
}

impl Error for HttpError {}

*/

#[derive(Debug, Serialize, Error)]
pub enum DownloadError {
    #[error("HTTP error: status code {status_code}: {response_body}")]
    HttpError {
        status_code: u16,
        response_body: String,
    },
    #[error("IO error: {0}")]
    IoError(String),
    #[error("Request error: {0}")]
    RequestError(String),
    #[error("Other error: {0}")]
    Other(String),
}

impl From<std::io::Error> for DownloadError {
    fn from(error: std::io::Error) -> Self {
        DownloadError::IoError(error.to_string())
    }
}

impl From<reqwest::Error> for DownloadError {
    fn from(error: reqwest::Error) -> Self {
        if let Some(status) = error.status() {
            DownloadError::HttpError {
                status_code: status.as_u16(),
                response_body: error.to_string(),
            }
        } else {
            DownloadError::RequestError(error.to_string())
        }
    }
}

//on_progress: Channel<ProgressPayload>,

async fn download(url: &str, file_path: &PathBuf) -> Result<(), vsinstall::Error> {
    let client = reqwest::Client::new();

    let response = client
        .get(url)
        .send()
        .await?
        .error_for_status()
        .map_err(ReqwestError)
        // .map_err(|err| ReqwestError {
        //     status_code: err.status().unwrap_or_default().as_u16(),
        //     response_body: err.to_string(),
        //})
        ?;

    let total = response.content_length().unwrap_or(0);

    let mut file = BufWriter::new(File::create(file_path).await?);
    let mut stream = response.bytes_stream();

    let mut downloaded_bytes = 0;
    while let Some(chunk) = stream.try_next().await? {
        file.write_all(&chunk).await?;
        downloaded_bytes += chunk.len() as u64;
        /*
        on_progress.send(ProgressPayload {
            progress: downloaded_bytes,
            total,
            percentage: (downloaded_bytes as f64 / total as f64) * 100.0,
        }).await?;
        */
    }

    file.flush().await?;

    Ok(())
}

#[tauri::command]
async fn vsinstall(folder: String) -> Result<(), vsinstall::Error> {
    let newfolder = dirs::download_dir().unwrap().join(folder);
    let result = fs::create_dir(newfolder.clone()).is_ok();
    let vscode_zip = newfolder.join("vscode.zip");
    let url = "https://update.code.visualstudio.com/latest/win32-x64-archive/stable";
    download(url, &vscode_zip).await?;
    //println!("{:?} - {}", newfolder, result);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, folder_exists, vsinstall])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/*
use std::fs;
use std::path::PathBuf;
use std::io::BufWriter;
use std::fs::File;
use std::fmt;
use futures_util::TryStreamExt;
use reqwest;
use serde::Serialize;
use thiserror::Error; // For easier error handling
use tauri;

#[derive(Debug, Serialize, Error)]
pub enum DownloadError {
    #[error("HTTP error: status code {status_code}: {response_body}")]
    HttpError {
        status_code: u16,
        response_body: String,
    },
    #[error("IO error: {0}")]
    IoError(String),
    #[error("Request error: {0}")]
    RequestError(String),
    #[error("Other error: {0}")]
    Other(String),
}

impl From<std::io::Error> for DownloadError {
    fn from(error: std::io::Error) -> Self {
        DownloadError::IoError(error.to_string())
    }
}

impl From<reqwest::Error> for DownloadError {
    fn from(error: reqwest::Error) -> Self {
        if let Some(status) = error.status() {
            DownloadError::HttpError {
                status_code: status.as_u16(),
                response_body: error.to_string(),
            }
        } else {
            DownloadError::RequestError(error.to_string())
        }
    }
}

async fn download(url: &str, file_path: &PathBuf) -> Result<(), DownloadError> {
    let client = reqwest::Client::new();

    let response = client
        .get(url)
        .send()
        .await?
        .error_for_status()?;

    let total = response.content_length().unwrap_or(0);

    let mut file = BufWriter::new(File::create(file_path)?);
    let mut stream = response.bytes_stream();

    let mut downloaded_bytes = 0;
    while let Some(chunk) = stream.try_next().await.map_err(DownloadError::from)? {
        file.write_all(&chunk)?;
        downloaded_bytes += chunk.len() as u64;

        // Uncomment and handle progress if needed
        /*
        on_progress.send(ProgressPayload {
            progress: downloaded_bytes,
            total,
            percentage: (downloaded_bytes as f64 / total as f64) * 100.0,
        }).await?;
        */
    }

    file.flush()?;

    Ok(())
}

#[tauri::command]
async fn vsinstall(folder: String) -> Result<bool, DownloadError> {
    let newfolder = dirs::download_dir().unwrap().join(folder);
    let result = fs::create_dir(newfolder.clone()).is_ok();
    let vscode_zip = newfolder.join("vscode.zip");
    let url = "https://update.code.visualstudio.com/latest/win32-x64-archive/stable";

    download(url, &vscode_zip).await?;

    Ok(result)
}


*/
