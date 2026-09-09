// Firestore's document ID is authoritative; older profiles contain numeric or stale IDs.
export function staffRecord(documentId, data) {
  const { name, username, role, loginType } = data;
  return { id: documentId, name, username, role, ...(loginType ? { loginType } : {}) };
}
