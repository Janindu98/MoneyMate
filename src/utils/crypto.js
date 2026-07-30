export function encryptData(data, key = "moneymate_key") {
  const json = JSON.stringify(data);
  let encrypted = "";
  for (let i = 0; i < json.length; i++) {
    const charCode = json.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    encrypted += String.fromCharCode(charCode);
  }
  return btoa(unescape(encodeURIComponent(encrypted)));
}

export function decryptData(encryptedStr, key = "moneymate_key") {
  try {
    const decoded = decodeURIComponent(escape(atob(encryptedStr)));
    let decrypted = "";
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      decrypted += String.fromCharCode(charCode);
    }
    return JSON.parse(decrypted);
  } catch (e) {
    throw new Error("Failed to decrypt database backup. Corrupted file or invalid key.");
  }
}
