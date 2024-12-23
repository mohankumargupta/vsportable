use async_zip::tokio::read::seek::ZipFileReader;
use futures_util::StreamExt;
use reqwest;
use serde::Serialize;
use std::{
    fs::{self},
    path::{Path, PathBuf},
};
use tauri::AppHandle;
use tauri::Emitter;
use thiserror::Error;
use tokio::{
    fs::{create_dir_all, read_dir, remove_dir_all, remove_file, File, OpenOptions},
    io::{AsyncWriteExt, BufReader, BufWriter},
    process::Command,
    time::{sleep, Duration, Instant},
};
//use tokio_util::compat::TokioAsyncWriteCompatExt;
use tokio_util::compat::FuturesAsyncReadCompatExt;
use walkdir::WalkDir;

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
fn folder_exists(folder: String, location: String) -> bool {
    PathBuf::from(location).join(folder).exists()
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

/*
#[derive(Debug, Copy, Clone, PartialEq, Serialize)]
enum InstallSteps {
    //DownloadVSCode = 1,
    //UnzipVSCode = 2,
    CreateDataDirectory = 3,
}
*/

/*
#[derive(Debug, Copy, Clone, PartialEq, Serialize)]
enum UpdateSteps {
    DeleteExistingVSCode = 1,
    DownloadVSCode,
    UnzipVSCode,
}
*/

/*
impl UpdateSteps {
    fn step(&self) -> u8 {
        *self as u8
    }

    fn all_steps() -> &'static [(UpdateSteps, &'static str)] {
        &[
            (
                UpdateSteps::DeleteExistingVSCode,
                "Deleting Existing VSCode",
            ),
            (UpdateSteps::DownloadVSCode, "Downloading VSCode"),
            (UpdateSteps::UnzipVSCode, "Unzipping VSCode"),
        ]
    }

    fn total() -> usize {
        UpdateSteps::all_steps().len()
    }
}

*/

#[derive(Debug, Copy, Clone, Serialize)]
struct ProgressBar {
    progress: u8,
    current_step: &'static str,
}

impl ProgressBar {
    fn new(title: &'static str) -> Self {
        Self {
            progress: 0,
            current_step: title,
        }
    }
}

/*
impl InstallSteps {
    fn all_steps() -> &'static [(InstallSteps, &'static str)] {
        &[
            (InstallSteps::DownloadVSCode, "Downloading VSCode"),
            (InstallSteps::UnzipVSCode, "Unzipping VSCode"),
            (
                InstallSteps::CreateDataDirectory,
                "Create data/tmp directory",
            ),
        ]
    }

    fn total() -> usize {
        InstallSteps::all_steps().len()
    }
}
*/

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

async fn download<F>(url: &str, file_path: &PathBuf, emit: F) -> Result<(), vsinstall::Error>
where
    F: Fn(&ProgressBar),
{
    let client = reqwest::Client::new();

    let response = client
        .get(url)
        .send()
        .await?
        .error_for_status()
        .map_err(ReqwestError)?;

    let total = response.content_length().unwrap_or(0);
    let mut file = BufWriter::new(File::create(file_path).await?);
    let mut stream = response.bytes_stream();
    let mut last_now = Instant::now();
    let mut downloaded_bytes = 0;
    let mut progress = ProgressBar::new("Downloading");
    emit(&progress);

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(ReqwestError)?;
        file.write_all(&chunk).await?;
        downloaded_bytes += chunk.len() as u64;
        let now = Instant::now();
        if now.duration_since(last_now) >= Duration::from_millis(1000) {
            let percentage = (downloaded_bytes as f64 / total as f64) * 100.0;
            progress.progress = percentage as u8;
            emit(&progress);
            //println!(
            //    "percentage: {percentage} downloaded_bytes: {downloaded_bytes} total: {total}"
            //);
            last_now = now;
        }
        /*
        on_progress.send(ProgressPayload {
            progress: downloaded_bytes,
            total,
            percentage: (downloaded_bytes as f64 / total as f64) * 100.0,
        }).await?;
        */
    }

    file.flush().await?;
    progress.progress = 100;
    emit(&progress);
    sleep(Duration::from_millis(1000)).await;
    Ok(())
}

async fn unzip<P: AsRef<Path>, F>(zip_file: P, out_dir: P, emit: F) -> Result<(), vsinstall::Error>
where
    F: Fn(&ProgressBar),
{
    let mut file = BufReader::new(File::open(zip_file).await?);
    let mut zip = ZipFileReader::with_tokio(&mut file).await?;
    let zipinfo = zip.file();
    let entries = zipinfo.entries();
    let entries_vec = entries.to_vec();
    let entries_vec_clone = entries_vec.clone();
    let total = entries_vec_clone
        .into_iter()
        .filter_map(|entry| match entry.dir() {
            Ok(is_dir) => {
                if !is_dir {
                    Some(entry)
                } else {
                    None
                }
            }
            Err(_) => None,
        })
        .count();
    let mut file_count = 0;
    let mut progress = ProgressBar::new("Unzipping");
    emit(&progress);
    //let mut last_now = Instant::now();

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
        file_count = file_count + 1;
        let percentage = (file_count as f64 / total as f64) * 100.0;
        progress.progress = percentage as u8;
        emit(&progress);
        //println!(
        //    "percentage: {percentage} downloaded_bytes: {downloaded_bytes} total: {total}"
        //);
        //last_now = now;

        //futures_lite::io::copy(&mut entry_reader, &mut writer)
        //    .await
        //    .expect("Failed to copy to extracted file");
    }

    println!("File count: {file_count}");
    println!("Done unzipping.");
    sleep(Duration::from_millis(1000)).await;
    Ok(())
}

async fn delete_file<P: AsRef<Path>>(path: P) -> Result<(), vsinstall::Error> {
    remove_file(path).await?;
    Ok(())
}

async fn _vsinstall<F>(dest_path: &PathBuf, emit: F) -> Result<(), vsinstall::Error>
where
    F: Fn(&ProgressBar),
{
    let vscode_zip = dest_path.join("vscode.zip");
    let url = "https://update.code.visualstudio.com/latest/win32-x64-archive/stable";
    download(url, &vscode_zip, &emit).await?;
    let _ = unzip(&vscode_zip, dest_path, &emit).await?;
    delete_file(&vscode_zip).await?;
    Ok(())
}

async fn count_files(dest_dir: &PathBuf) -> usize {
    let walker = WalkDir::new(dest_dir);
    let count = walker
        .into_iter()
        .filter_map(|dir_entry| dir_entry.ok())
        .filter(|entry| entry.file_type().is_file())
        .filter(|entry| !entry.path().to_str().unwrap_or("").contains("data"))
        .count();
    //.inspect(|f| println!("{:?}", f.path().to_str().unwrap_or("")))
    count
}

/*
fn emit<F>(f: F, progress: u8, message: String)
where
    F: Fn(u8, String),
{
    f(progress, message);
}
*/

async fn _vsupdate<F>(dest_dir: &PathBuf, _emit: F) -> Result<(), vsinstall::Error>
where
    F: Fn(&ProgressBar),
{
    let initial_file_count = count_files(dest_dir).await;
    println!("{initial_file_count}");
    /*
    let progress = ProgressBar {
        current_step: InstallSteps::CreateDataDirectory,
        progress: 0,
    };
    emit(&progress);
    */
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

        let file_count = count_files(dest_dir).await;
        println!("{file_count}");
    }

    Ok(())
}

#[tauri::command]
async fn vsinstall(
    app: AppHandle,
    folder: String,
    location: String,
) -> Result<(), vsinstall::Error> {
    let dest_dir = PathBuf::from(location).join(folder);
    let data = dest_dir.join("data").join("tmp");
    create_dir_all(&data).await?;
    _vsinstall(&dest_dir, |&p| app.emit("progress", p).unwrap()).await?;
    app.emit("done", ()).unwrap();
    Ok(())
}

#[tauri::command]
async fn vsupdate(app: AppHandle, folder: String) -> Result<(), vsinstall::Error> {
    let dest_dir = dirs::download_dir().unwrap().join(folder.clone());
    //let data = dest_dir.join("data").join("tmp");
    println!("{}", folder.clone());
    _vsupdate(&dest_dir, |&p| app.emit("progress", p).unwrap()).await?;
    _vsinstall(&dest_dir, |&p| app.emit("progress", p).unwrap()).await?;
    Ok(())
}

#[tauri::command]
async fn launch_vsportable(folder: String) -> Result<(), vsinstall::Error> {
    let working_dir = dirs::download_dir().unwrap().join(folder.clone());
    let code_binary = working_dir.join("Code.exe");
    let mut command = Command::new(code_binary);
    command.current_dir(working_dir);
    let detached_process_flag: u32 = 8;
    command.creation_flags(detached_process_flag);
    command.spawn()?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            folder_exists,
            vsinstall,
            vsupdate,
            launch_vsportable
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
