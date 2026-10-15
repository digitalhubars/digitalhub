// The workspace owner: the only account that becomes admin by itself (after confirming
// its email). Keep in step with isOwner() in firestore.rules.
export const OWNER_EMAILS = ['digitalhubars@gmail.com'];

export const isOwnerEmail = (email) => OWNER_EMAILS.includes(String(email || '').trim().toLowerCase());
