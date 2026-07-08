export const COMMON_TIMEZONES = [
  { id: 'Africa/Lagos', city: 'Lagos', country: 'Nigeria' },
  { id: 'Africa/Cairo', city: 'Cairo', country: 'Egypt' },
  { id: 'Africa/Johannesburg', city: 'Johannesburg', country: 'South Africa' },
  { id: 'America/New_York', city: 'New York', country: 'USA' },
  { id: 'America/Chicago', city: 'Chicago', country: 'USA' },
  { id: 'America/Denver', city: 'Denver', country: 'USA' },
  { id: 'America/Los_Angeles', city: 'Los Angeles', country: 'USA' },
  { id: 'America/Edmonton', city: 'Edmonton', country: 'Alberta' },
  { id: 'America/Toronto', city: 'Toronto', country: 'Ontario' },
  { id: 'America/Vancouver', city: 'Vancouver', country: 'British Columbia' },
  { id: 'America/Calgary', city: 'Calgary', country: 'Alberta' },
  { id: 'America/Winnipeg', city: 'Winnipeg', country: 'Manitoba' },
  { id: 'America/Halifax', city: 'Halifax', country: 'Nova Scotia' },
  { id: 'America/Montreal', city: 'Montreal', country: 'Quebec' },
  { id: 'America/Sao_Paulo', city: 'São Paulo', country: 'Brazil' },
  { id: 'America/Mexico_City', city: 'Mexico City', country: 'Mexico' },
  { id: 'America/Buenos_Aires', city: 'Buenos Aires', country: 'Argentina' },
  { id: 'America/Lima', city: 'Lima', country: 'Peru' },
  { id: 'Europe/London', city: 'London', country: 'UK' },
  { id: 'Europe/Paris', city: 'Paris', country: 'France' },
  { id: 'Europe/Berlin', city: 'Berlin', country: 'Germany' },
  { id: 'Europe/Amsterdam', city: 'Amsterdam', country: 'Netherlands' },
  { id: 'Europe/Madrid', city: 'Madrid', country: 'Spain' },
  { id: 'Europe/Rome', city: 'Rome', country: 'Italy' },
  { id: 'Europe/Moscow', city: 'Moscow', country: 'Russia' },
  { id: 'Europe/Istanbul', city: 'Istanbul', country: 'Turkey' },
  { id: 'Asia/Dubai', city: 'Dubai', country: 'UAE' },
  { id: 'Asia/Kolkata', city: 'Mumbai', country: 'India' },
  { id: 'Asia/Bangkok', city: 'Bangkok', country: 'Thailand' },
  { id: 'Asia/Shanghai', city: 'Shanghai', country: 'China' },
  { id: 'Asia/Hong_Kong', city: 'Hong Kong', country: 'China' },
  { id: 'Asia/Tokyo', city: 'Tokyo', country: 'Japan' },
  { id: 'Asia/Seoul', city: 'Seoul', country: 'South Korea' },
  { id: 'Asia/Singapore', city: 'Singapore', country: 'Singapore' },
  { id: 'Asia/Jakarta', city: 'Jakarta', country: 'Indonesia' },
  { id: 'Asia/Manila', city: 'Manila', country: 'Philippines' },
  { id: 'Australia/Sydney', city: 'Sydney', country: 'Australia' },
  { id: 'Australia/Melbourne', city: 'Melbourne', country: 'Australia' },
  { id: 'Pacific/Auckland', city: 'Auckland', country: 'New Zealand' },
  { id: 'Pacific/Honolulu', city: 'Honolulu', country: 'USA' },
];

export function getLocalTimezone() {
  const id = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const match = COMMON_TIMEZONES.find((t) => t.id === id);
  if (match) return { ...match };
  const city = id.split('/').pop()?.replace(/_/g, ' ') || id;
  return { id, city, country: '' };
}

const SEARCH_ALIASES = {
  'america/edmonton': ['edmonton', 'alberta', 'canada'],
  'america/toronto': ['toronto', 'ontario', 'canada'],
  'america/vancouver': ['vancouver', 'british columbia', 'bc', 'canada'],
  'america/calgary': ['calgary', 'alberta', 'canada'],
  'america/winnipeg': ['winnipeg', 'manitoba', 'canada'],
  'america/halifax': ['halifax', 'nova scotia', 'canada'],
  'america/montreal': ['montreal', 'quebec', 'canada'],

};

export function searchTimezones(query) {
  const q = query.toLowerCase().trim();
  if (!q) return COMMON_TIMEZONES;
  return COMMON_TIMEZONES.filter((t) => {
    const aliases = SEARCH_ALIASES[t.id.toLowerCase()] || [];
    return (
      t.city.toLowerCase().includes(q) ||
      t.country.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      aliases.some((a) => a.includes(q) || q.includes(a))
    );
  });
}