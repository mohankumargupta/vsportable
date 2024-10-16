use async_zip::tokio::read::seek::ZipFileReader;
use futures_util::StreamExt;
use reqwest;
use serde::Serialize;
use std::{
    fs::{self},
    path::{Path, PathBuf},
};
use thiserror::Error;
use tokio::{
    fs::{create_dir_all, read_dir, remove_dir_all, remove_file, File, OpenOptions},
    io::{AsyncWriteExt, BufReader, BufWriter},
};
//use tokio_util::compat::TokioAsyncWriteCompatExt;
use tokio_util::compat::FuturesAsyncReadCompatExt;

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
        .map_err(ReqwestError)?;

    //let total = response.content_length().unwrap_or(0);
    let mut file = BufWriter::new(File::create(file_path).await?);
    let mut stream = response.bytes_stream();

    //let mut downloaded_bytes = 0;
    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(ReqwestError)?;
        file.write_all(&chunk).await?;
        //downloaded_bytes += chunk.len() as u64;
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

async fn unzip<P: AsRef<Path>>(zip_file: P, out_dir: P) -> Result<(), vsinstall::Error> {
    let mut file = BufReader::new(File::open(zip_file).await?);
    let mut zip = ZipFileReader::with_tokio(&mut file).await?;
    let zipinfo = zip.file();
    let entries = zipinfo.entries();
    let entries_vec = entries.to_vec();
    for (index, entry) in entries_vec.into_iter().enumerate() {
        if entry.dir()? {
            continue;
        }
        let filename = entry
            .filename()
            .clone()
            .into_string()
            .unwrap_or(String::from(""));
        println!("{filename}");
        let path = out_dir.as_ref().join(filename);
        let parent = path
            .parent()
            .expect("A file entry should have parent directories");
        if !parent.is_dir() {
            create_dir_all(parent)
                .await
                .expect("Failed to create parent directories");
        }

        let mut writer = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&path)
            .await
            .expect("Failed to create extracted file");

        let entry_reader = zip
            .reader_without_entry(index)
            .await
            .expect("Failed to read ZipEntry");

        tokio::io::copy(&mut entry_reader.compat(), &mut writer).await?;

        //futures_lite::io::copy(&mut entry_reader, &mut writer)
        //    .await
        //    .expect("Failed to copy to extracted file");
    }
    Ok(())
}

async fn delete_file<P: AsRef<Path>>(path: P) -> Result<(), vsinstall::Error> {
    remove_file(path).await?;
    Ok(())
}

async fn _vsinstall(dest_path: &PathBuf) -> Result<(), vsinstall::Error> {
    let vscode_zip = dest_path.join("vscode.zip");
    let url = "https://update.code.visualstudio.com/latest/win32-x64-archive/stable";
    download(url, &vscode_zip).await?;
    let _ = unzip(&vscode_zip, dest_path).await?;
    delete_file(&vscode_zip).await?;
    Ok(())
}

#[tauri::command]
async fn vsinstall(folder: String) -> Result<(), vsinstall::Error> {
    let dest_dir = dirs::download_dir().unwrap().join(folder);
    let data = dest_dir.join("data").join("tmp");
    create_dir_all(&data).await?;
    _vsinstall(&dest_dir).await?;
    Ok(())
}

async fn _vsupdate(dest_dir: &PathBuf) -> Result<(), vsinstall::Error> {
    let mut read_dir = read_dir(dest_dir).await?;

    while let Some(entry) = read_dir.next_entry().await? {
        let path = entry.path();

        let file_name = path.file_name().unwrap().to_str().unwrap();

        if file_name == "data" {
            continue;
        }

        if path.is_dir() {
            remove_dir_all(&path).await?;
        } else {
            remove_file(&path).await?;
        }
    }

    Ok(())
}

#[tauri::command]
async fn vsupdate(folder: String) -> Result<(), vsinstall::Error> {
    let dest_dir = dirs::download_dir().unwrap().join(folder.clone());
    //let data = dest_dir.join("data").join("tmp");
    println!("{}", folder.clone());
    _vsupdate(&dest_dir).await?;
    //_vsinstall(&dest_dir).await?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            folder_exists,
            vsinstall,
            vsupdate
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
