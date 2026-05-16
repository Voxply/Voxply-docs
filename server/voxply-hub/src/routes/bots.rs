use std::sync::Arc;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::middleware::AuthUser;
use crate::permissions;
use crate::state::AppState;

#[derive(Serialize)]
pub struct BotResponse {
    pub public_key: String,
    pub display_name: String,
    pub created_by: String,
    pub created_at: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub token: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateBotRequest {
    pub name: String,
}

pub async fn list_bots(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
) -> Result<Json<Vec<BotResponse>>, (StatusCode, String)> {
    let perms = permissions::user_permissions(&state.db, &user.public_key).await?;
    perms.require(permissions::ADMIN)?;

    let rows = sqlx::query_as::<_, BotRow>(
        "SELECT u.public_key, u.display_name, bt.created_by, u.first_seen_at as created_at
         FROM users u
         JOIN bot_tokens bt ON bt.public_key = u.public_key
         WHERE u.is_bot = 1
         ORDER BY u.first_seen_at",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("DB error: {e}")))?;

    Ok(Json(rows.into_iter().map(|r| BotResponse {
        public_key: r.public_key,
        display_name: r.display_name.unwrap_or_default(),
        created_by: r.created_by,
        created_at: r.created_at,
        token: None,
    }).collect()))
}

pub async fn create_bot(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
    Json(req): Json<CreateBotRequest>,
) -> Result<(StatusCode, Json<BotResponse>), (StatusCode, String)> {
    let perms = permissions::user_permissions(&state.db, &user.public_key).await?;
    perms.require(permissions::ADMIN)?;

    let name = req.name.trim().to_string();
    if name.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "Bot name cannot be empty".to_string()));
    }

    let public_key = format!("bot-{}", Uuid::new_v4());
    let token = hex::encode(Uuid::new_v4().as_bytes()) + &hex::encode(Uuid::new_v4().as_bytes());
    let now = crate::auth::handlers::unix_timestamp();

    sqlx::query(
        "INSERT INTO users (public_key, display_name, first_seen_at, last_seen_at, approval_status, is_bot)
         VALUES (?, ?, ?, ?, 'approved', 1)",
    )
    .bind(&public_key)
    .bind(&name)
    .bind(now)
    .bind(now)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("DB error: {e}")))?;

    sqlx::query(
        "INSERT INTO bot_tokens (token, public_key, created_by, created_at) VALUES (?, ?, ?, ?)",
    )
    .bind(&token)
    .bind(&public_key)
    .bind(&user.public_key)
    .bind(now)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("DB error: {e}")))?;

    Ok((StatusCode::CREATED, Json(BotResponse {
        public_key,
        display_name: name,
        created_by: user.public_key,
        created_at: now,
        token: Some(token),
    })))
}

pub async fn delete_bot(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
    Path(public_key): Path<String>,
) -> Result<StatusCode, (StatusCode, String)> {
    let perms = permissions::user_permissions(&state.db, &user.public_key).await?;
    perms.require(permissions::ADMIN)?;

    let is_bot: Option<i64> = sqlx::query_scalar(
        "SELECT is_bot FROM users WHERE public_key = ?",
    )
    .bind(&public_key)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("DB error: {e}")))?;

    match is_bot {
        None => return Err((StatusCode::NOT_FOUND, "Bot not found".to_string())),
        Some(0) => return Err((StatusCode::BAD_REQUEST, "Not a bot".to_string())),
        _ => {}
    }

    sqlx::query("DELETE FROM bot_tokens WHERE public_key = ?")
        .bind(&public_key)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("DB error: {e}")))?;

    sqlx::query("DELETE FROM users WHERE public_key = ?")
        .bind(&public_key)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("DB error: {e}")))?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn rotate_token(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
    Path(public_key): Path<String>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let perms = permissions::user_permissions(&state.db, &user.public_key).await?;
    perms.require(permissions::ADMIN)?;

    let is_bot: Option<i64> = sqlx::query_scalar(
        "SELECT is_bot FROM users WHERE public_key = ?",
    )
    .bind(&public_key)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("DB error: {e}")))?;

    match is_bot {
        None => return Err((StatusCode::NOT_FOUND, "Bot not found".to_string())),
        Some(0) => return Err((StatusCode::BAD_REQUEST, "Not a bot".to_string())),
        _ => {}
    }

    let new_token = hex::encode(Uuid::new_v4().as_bytes()) + &hex::encode(Uuid::new_v4().as_bytes());

    sqlx::query("UPDATE bot_tokens SET token = ? WHERE public_key = ?")
        .bind(&new_token)
        .bind(&public_key)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("DB error: {e}")))?;

    Ok(Json(serde_json::json!({ "token": new_token })))
}

#[derive(sqlx::FromRow)]
struct BotRow {
    public_key: String,
    display_name: Option<String>,
    created_by: String,
    created_at: i64,
}
