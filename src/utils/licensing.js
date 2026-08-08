/**
 * Validates a MoneyMate license key offline using a checksum algorithm.
 * Format: MM-XXXX-XXXX-XXXX-XXXX
 * Total length of characters: 18 (2 characters 'MM' + 16 alphanumeric characters).
 * 
 * @param {string} key 
 * @returns {boolean} True if key is valid.
 */
export function validateLicenseKey(key) {
  if (!key) return false;
  
  // Format character cleanup
  const cleaned = key.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  if (!cleaned.startsWith('MM')) return false;
  if (cleaned.length !== 18) return false;
  
  const dataPart = cleaned.substring(2, 14); // 12 characters (code)
  const checksumPart = cleaned.substring(14); // 4 characters (checksum)
  
  let hash = 0;
  for (let i = 0; i < dataPart.length; i++) {
    hash = (hash * 31 + dataPart.charCodeAt(i)) % 65535;
  }
  
  const expectedChecksum = hash.toString(16).toUpperCase().padStart(4, '0');
  return checksumPart === expectedChecksum;
}
