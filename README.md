# Google Drive Ownership Recovery
An AppsScript to restore the original ownership of drive files which were transferred to a new owner upon deletion of Google Workspace user. 

 * Recursively transfers ownership of everything inside a specific folder, including sub folders. 
 * Works best when used on the folder which is automatically created by Google Workspace upon deletion + transfer of a user. 
 * Will gracefullly handle execution limits and keep track of progress, and spin up child tasks until complete. 
 
## HOW TO USE
1. Open https://script.new while logged in as a Google Workspace Super Admin. 
2. Paste this code; File ▸ Project Settings ▸ Enable Google Drive API.
3. Replace DOMAIN with your domain, and edit config as desired, primarily CURRENT_OWNER, NEW_OWNER, and FOLDER_ID.
4. Run restoreToOriginalOwner() once, accept the OAuth consent, and watch the log.

##### Tags
googleworkspaceadmin, gsuiteadmin, gsuite, googleworkspace, google, workspace, gam, google admin, admin, administrator
