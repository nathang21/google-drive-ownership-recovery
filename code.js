/**
 * Recursively transfers ownership of everything inside a specific folder, including sub folders. 
 * Works best when used on the folder which is automatically created by Google Workspace upon deletion + transfer of a user. 
 * Will gracefullly handle execution limits and keep track of progress, and spin up child tasks until complete. 
 *
 * HOW TO USE
 * 1. Open https://script.new while logged in as a Google Workspace Super Admin. 
 * 2. Paste this code; File ▸ Project Settings ▸ Enable Google Drive API.
 * 3. Replace DOMAIN with your domain, and edit config as desired, primarily CURRENT_OWNER, NEW_OWNER, and FOLDER_ID.
 * 4. Run restoreToOriginalOwner() once, accept the OAuth consent, and watch the log.
 */
/**
 * --------- CONFIG ---------
 */
const FOLDER_ID      = 'iD';                   // root folder
const CURRENT_OWNER  = 'admin@domain.com';     // source user
const NEW_OWNER      = 'original@domain.com';  // target user
const QUEUE_KEY      = 'QUEUE_ORIGINAL';       // Set to unique if running mutiple recoveries in parallel to avoid conflict
const WORK_WINDOW    = 5 * 60 * 1000;          // 5-min slices
const LOG_EVERY      = 100;                    // heartbeat
const MAX_LOGS       = 20;

function restoreToOriginalOwner() {
  const props = PropertiesService.getScriptProperties();
  let queue   = JSON.parse(props.getProperty(QUEUE_KEY) || '[]');
  if (queue.length === 0) queue.push(FOLDER_ID);              // first run

  const start = Date.now();
  let handled = 0, logged = 0;

  /* ---------- MAIN LOOP ---------- */
  while (queue.length && (Date.now() - start) < WORK_WINDOW) {
    const id = queue.pop();
    const {obj, isFolder} = getDriveItem(id);
    if (!obj) { Logger.log('Cannot access %s – skipped.', id); continue; }

    // Change owner when original@ owns the item
    if (obj.getOwner &&
        obj.getOwner().getEmail() === CURRENT_OWNER) {
      try { obj.setOwner(NEW_OWNER); }
      catch (e) { Logger.log('Skip %s – %s', id, e.message); }
    }

    // If it’s a folder, push its children onto the queue
    if (isFolder) enqueueChildren(obj, queue);

    handled++;

    // Heartbeat every LOG_EVERY items
    if (handled % LOG_EVERY === 0 && logged < MAX_LOGS) {
      Logger.log('Processed %s items this slice; %s left in queue.',
                 handled, queue.length);
      logged++;
    }
  }
  /* ---------- END LOOP ---------- */

  Logger.log('Slice processed %s items; %s left.', handled, queue.length);

  if (queue.length) {                                   // schedule next slice
    props.setProperty(QUEUE_KEY, JSON.stringify(queue));
    ScriptApp.newTrigger('restoreToOriginalOwner')
             .timeBased()
             .after(30 * 1000)                          // 30 seconds
             .create();
  } else {                                              // finished
    props.deleteProperty(QUEUE_KEY);
    Logger.log('Transfer complete.');
  }
}

/* ---------- helpers ---------- */

function getDriveItem(id) {
  try {                                                 // folder first
    return {obj: DriveApp.getFolderById(id), isFolder: true};
  } catch (_) {}
  try {                                                 // file fallback
    const file = DriveApp.getFileById(id);
    const isFolder = file.getMimeType() === MimeType.FOLDER;
    return {obj: isFolder ? DriveApp.getFolderById(id) : file, isFolder};
  } catch (_) { return {obj: null, isFolder: false}; }
}

function enqueueChildren(folder, queue) {
  const subs = folder.getFolders();
  while (subs.hasNext())  queue.push(subs.next().getId());
  const files = folder.getFiles();
  while (files.hasNext()) queue.push(files.next().getId());
}
