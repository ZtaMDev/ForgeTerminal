use std::collections::HashMap;
use std::sync::Mutex;

pub struct PtyManager {
    sessions: Mutex<HashMap<String, PtyHandle>>,
}

struct PtyHandle {
    id: String,
    shell: String,
    cwd: String,
}

impl PtyManager {
    pub fn new() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
        }
    }

    pub fn add_session(&self, id: String, shell: String, cwd: String) {
        let mut sessions = self.sessions.lock().unwrap();
        sessions.insert(id.clone(), PtyHandle { id, shell, cwd });
    }

    pub fn remove_session(&self, id: &str) {
        let mut sessions = self.sessions.lock().unwrap();
        sessions.remove(id);
    }

    pub fn get_session_count(&self) -> usize {
        self.sessions.lock().unwrap().len()
    }
}
