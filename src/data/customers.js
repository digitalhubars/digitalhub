import { stores } from './stores';

const firstNames = ['Maya', 'Jordan', 'Ana', 'Ben', 'Lena', 'Omar', 'Grace', 'Diego', 'Hannah', 'Sofia', 'Noah', 'Aisha', 'Leo', 'Chloe', 'Ravi', 'Emma', 'Tariq', 'Zoe', 'Felix', 'Ines', 'Marcus', 'Yuki', 'Hugo', 'Amara', 'Owen', 'Lucia', 'Kofi', 'Elena', 'Sami', 'Nina'];
const lastNames = ['Thompson', 'Ellis', 'Ruiz', 'Carter', 'Fischer', 'Haddad', 'Kim', 'Morales', 'Wright', 'Rossi', 'Bennett', 'Khan', 'Moreau', 'Nguyen', 'Iyer', 'Clarke', 'Aziz', 'Brooks', 'Weber', 'Santos', 'Reed', 'Tanaka', 'Laurent', 'Okafor', 'Hughes', 'Ferrari', 'Mensah', 'Popescu', 'Nasser', 'Larsen'];

// Five customers per store. Order totals are derived later from synced orders.
export const customers = stores.flatMap((store, storeIndex) =>
  Array.from({ length: 5 }, (_, i) => {
    const n = storeIndex * 5 + i;
    const name = `${firstNames[n % firstNames.length]} ${lastNames[(n * 7 + Math.floor(n / 30) * 3) % lastNames.length]}`;
    return {
      id: `cu_${String(n + 1).padStart(2, '0')}`,
      storeId: store.id,
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
    };
  }),
);
