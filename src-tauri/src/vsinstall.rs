use async_zip::error::ZipError;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("HTTP Error {status_code:?}: {response_body:?} ")]
    HTTPError {
        status_code: u16,
        response_body: String,
    },
    #[error(transparent)]
    ReqwestError(#[from] reqwest::Error),
    #[error(transparent)]
    IO(#[from] std::io::Error),
    #[error(transparent)]
    ZipError(#[from] ZipError),
}

// we must manually implement serde::Serialize
impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
