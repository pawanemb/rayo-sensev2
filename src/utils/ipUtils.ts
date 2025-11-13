export interface IPDetails {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  timezone: string;
  isLocal: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
  org?: string;
  postal?: string;
}

// Cache for IP lookups to avoid repeated API calls
const ipCache = new Map<string, IPDetails | null>();

export async function getIPDetails(ip: string): Promise<IPDetails | null> {
  if (!ip) return null;

  // Check cache first
  if (ipCache.has(ip)) {
    return ipCache.get(ip) || null;
  }

  try {
    const response = await fetch(`/api/ip-lookup?ip=${encodeURIComponent(ip)}`);
    
    if (!response.ok) {
      ipCache.set(ip, null);
      return null;
    }

    const details: IPDetails = await response.json();
    ipCache.set(ip, details);
    return details;
  } catch (error) {
    console.error('Error fetching IP details:', error);
    ipCache.set(ip, null);
    return null;
  }
}

// Synchronous version that returns cached data or a placeholder
export function getIPDetailsSync(ip: string): IPDetails | null {
  if (!ip) return null;

  // Return cached data if available
  if (ipCache.has(ip)) {
    return ipCache.get(ip) || null;
  }

  // Check for obvious local IPs synchronously
  if (isLocalIPSync(ip)) {
    const localDetails: IPDetails = {
      country: 'Local Network',
      countryCode: 'LOCAL',
      region: 'Private Network',
      city: 'Local Machine',
      timezone: 'System Local',
      isLocal: true
    };
    ipCache.set(ip, localDetails);
    return localDetails;
  }

  // Return a placeholder for unknown IPs to prevent loading states
  const placeholder: IPDetails = {
    country: 'Loading...',
    countryCode: 'XX',
    region: 'Loading...',
    city: 'Loading...',
    timezone: 'Loading...',
    isLocal: false
  };
  
  return placeholder;
}

function isLocalIPSync(ip: string): boolean {
  // Check for common local/private IP ranges
  const localPatterns = [
    /^127\./, // Loopback
    /^192\.168\./, // Private Class C
    /^10\./, // Private Class A
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
    /^::1$/, // IPv6 loopback
    /^fe80:/, // IPv6 link-local
    /^fc00:/, // IPv6 unique local
    /^fd00:/, // IPv6 unique local
  ];

  return localPatterns.some(pattern => pattern.test(ip));
}

export function formatIPDetails(details: IPDetails | null): string {
  if (!details) return 'Unknown';
  
  if (details.isLocal) {
    return 'Local Network';
  }

  const parts = [];
  if (details.city && details.city !== 'Unknown') parts.push(details.city);
  if (details.region && details.region !== 'Unknown') parts.push(details.region);
  if (details.country && details.country !== 'Unknown') parts.push(details.country);
  
  return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
}

export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode === 'LOCAL' || countryCode === 'XX') return '🌐';
  
  // Convert country code to flag emoji only
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    
    return String.fromCodePoint(...codePoints);
  } catch (error) {
    return '🌐'; // Fallback if flag conversion fails
  }
}