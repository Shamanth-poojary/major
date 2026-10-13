// seed/generate-seed.js
// Usage: node seed/generate-seed.js   ->  writes seed/seed.sql
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { escape: q } = require('mysql2');

const PASSWORD = 'Owner@123';
const DOMAIN = 'seed.wanderlust.test';

// [location label, latitude, longitude]
const owners = [
  { username: 'aarav_heritage', business_name: 'Aarav Heritage Stays', business_type: 'hotel_owner',
    phone: '+91 98450 10001', country: 'India', price: [3500, 12000],
    bio: 'Family-run heritage hotels across Rajasthan.',
    places: [['Jaipur, Rajasthan', 26.9124, 75.7873], ['Udaipur, Rajasthan', 24.5854, 73.7125],
             ['Jodhpur, Rajasthan', 26.2389, 73.0243], ['Pushkar, Rajasthan', 26.4897, 74.5511],
             ['Jaisalmer, Rajasthan', 26.9157, 70.9083]] },
  { username: 'coorg_escapes', business_name: 'Coorg Escapes', business_type: 'property_owner',
    phone: '+91 98450 10002', country: 'India', price: [2500, 9000],
    bio: 'Plantation homestays and hill cottages in the Western Ghats.',
    places: [['Madikeri, Karnataka', 12.4244, 75.7382], ['Sakleshpur, Karnataka', 12.9419, 75.7845],
             ['Chikmagalur, Karnataka', 13.3161, 75.7720], ['Kalpetta, Kerala', 11.6103, 76.0830],
             ['Ooty, Tamil Nadu', 11.4102, 76.6950]] },
  { username: 'goa_getaways', business_name: 'Goa Getaways', business_type: 'property_owner',
    phone: '+91 98450 10003', country: 'India', price: [4000, 15000],
    bio: 'Beach villas and private pool houses in Goa.',
    places: [['Anjuna, Goa', 15.5736, 73.7413], ['Palolem, Goa', 15.0100, 74.0232],
             ['Candolim, Goa', 15.5180, 73.7620], ['Panaji, Goa', 15.4909, 73.8278],
             ['Morjim, Goa', 15.6310, 73.7390]] },
  { username: 'tuscany_villas', business_name: 'Tuscany Villas Co.', business_type: 'property_owner',
    phone: '+39 055 555 0104', country: 'Italy', price: [150, 600],
    bio: 'Countryside villas and farmhouses in Tuscany.',
    places: [['Florence, Tuscany', 43.7696, 11.2558], ['Siena, Tuscany', 43.3188, 11.3308],
             ['Montepulciano, Tuscany', 43.0985, 11.7832], ['San Gimignano, Tuscany', 43.4677, 11.0432],
             ['Lucca, Tuscany', 43.8429, 10.5027]] },
  { username: 'bali_retreats', business_name: 'Bali Retreats', business_type: 'hotel_owner',
    phone: '+62 361 555 0105', country: 'Indonesia', price: [60, 350],
    bio: 'Boutique resorts and yoga retreats across Bali.',
    places: [['Ubud, Bali', -8.5069, 115.2625], ['Canggu, Bali', -8.6478, 115.1385],
             ['Seminyak, Bali', -8.6913, 115.1682], ['Uluwatu, Bali', -8.8291, 115.0849],
             ['Sidemen, Bali', -8.4838, 115.4560]] },
  { username: 'alpine_lodges', business_name: 'Alpine Lodges', business_type: 'hotel_owner',
    phone: '+41 27 555 0106', country: 'Switzerland', price: [180, 700],
    bio: 'Mountain lodges and ski chalets in the Swiss Alps.',
    places: [['Zermatt, Valais', 46.0207, 7.7491], ['Interlaken, Bern', 46.6863, 7.8632],
             ['Grindelwald, Bern', 46.6244, 8.0411], ['Lucerne, Lucerne', 47.0502, 8.3093],
             ['St. Moritz, Graubunden', 46.4908, 9.8355]] },
  { username: 'paris_venues', business_name: 'Paris Venues & Salons', business_type: 'venue_owner',
    phone: '+33 1 55 50 0107', country: 'France', price: [400, 3000],
    bio: 'Historic salons, courtyards and rooftop venues in France.',
    places: [['Le Marais, Paris', 48.8566, 2.3522], ['Montmartre, Paris', 48.8867, 2.3431],
             ['Versailles, Ile-de-France', 48.8014, 2.1301], ['Lyon, Auvergne-Rhone-Alpes', 45.7640, 4.8357],
             ['Bordeaux, Nouvelle-Aquitaine', 44.8378, -0.5792]] },
  { username: 'dubai_events', business_name: 'Dubai Event Co.', business_type: 'event_planner',
    phone: '+971 4 555 0108', country: 'United Arab Emirates', price: [1500, 9000],
    bio: 'End-to-end planners for weddings and corporate events in the UAE.',
    places: [['Dubai Marina, Dubai', 25.0805, 55.1403], ['Palm Jumeirah, Dubai', 25.1124, 55.1390],
             ['Downtown Dubai, Dubai', 25.1972, 55.2744], ['Abu Dhabi, Abu Dhabi', 24.4539, 54.3773],
             ['Sharjah, Sharjah', 25.3463, 55.4209]] },
  { username: 'kerala_backwaters', business_name: 'Kerala Backwater Homes', business_type: 'property_owner',
    phone: '+91 98450 10009', country: 'India', price: [2800, 11000],
    bio: 'Houseboats, heritage homes and tea-estate bungalows in Kerala.',
    places: [['Alleppey, Kerala', 9.4981, 76.3388], ['Kumarakom, Kerala', 9.6177, 76.4300],
             ['Munnar, Kerala', 10.0889, 77.0595], ['Kochi, Kerala', 9.9312, 76.2673],
             ['Varkala, Kerala', 8.7379, 76.7163]] },
  { username: 'nyc_loft_venues', business_name: 'NYC Loft Venues', business_type: 'venue_owner',
    phone: '+1 212 555 0110', country: 'United States', price: [300, 2500],
    bio: 'Lofts, studios and event spaces across New York.',
    places: [['Brooklyn, New York', 40.6782, -73.9442], ['Manhattan, New York', 40.7831, -73.9712],
             ['Queens, New York', 40.7282, -73.7949], ['Hudson, New York', 42.2529, -73.7910],
             ['Asbury Park, New Jersey', 40.2204, -74.0121]] },
];

const TEMPLATES = {
  hotel_owner: {
    kinds: ['Boutique Suite', 'Heritage Room', 'Deluxe Suite', 'Courtyard Room', 'Skyline Penthouse'],
    blurb: 'A comfortable stay with daily breakfast, fast Wi-Fi, air conditioning and a 24/7 front desk.',
  },
  property_owner: {
    kinds: ['Private Villa', 'Cozy Cottage', 'Garden Bungalow', 'Family Homestay', 'Hillside Retreat'],
    blurb: 'An entire property for your group with a fully equipped kitchen, parking and a private outdoor area.',
  },
  venue_owner: {
    kinds: ['Rooftop Terrace', 'Banquet Hall', 'Garden Lawn', 'Studio Loft', 'Conference Hall'],
    blurb: 'A flexible event space with sound and lighting support, catering access and room for large guest lists.',
  },
  event_planner: {
    kinds: ['Wedding Package', 'Corporate Offsite Package', 'Birthday Celebration Package',
            'Gala Evening Package', 'Engagement Party Package'],
    blurb: 'A planner-managed package covering venue coordination, decor, vendors and on-day management.',
  },
};

const ADJ = ['Serene', 'Charming', 'Elegant', 'Sunlit', 'Secluded', 'Lively', 'Modern', 'Rustic'];
const roundTo = (n, step) => Math.round(n / step) * step;

(async () => {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const out = [];

  out.push('USE wanderlust;', 'START TRANSACTION;', '');
  out.push('-- Cleanup of previous seed run (listings first: owner FK is ON DELETE RESTRICT)');
  out.push(`DELETE FROM listings WHERE owner_id IN (SELECT user_id FROM users WHERE email LIKE '%@${DOMAIN}');`);
  out.push(`DELETE FROM users WHERE email LIKE '%@${DOMAIN}';`, '');

  owners.forEach((o, oi) => {
    const t = TEMPLATES[o.business_type];
    const email = `${o.username}@${DOMAIN}`;

    out.push(`-- ${o.business_name}`);
    out.push(
      'INSERT INTO users (username, email, password_hash, role, phone, bio) VALUES (' +
      [o.username, email, hash, 'owner', o.phone, o.bio].map(q).join(', ') + ');'
    );
    out.push('SET @uid = LAST_INSERT_ID();');
    out.push(
      'INSERT INTO owner_profile (owner_id, business_name, business_type, phone, verification_status, verified_at) VALUES (' +
      `@uid, ${q(o.business_name)}, ${q(o.business_type)}, ${q(o.phone)}, 'approved', NOW());`
    );

    const rows = o.places.map(([loc, lat, lng], j) => {
      const city = loc.split(',')[0];
      const title = `${ADJ[(oi + j) % ADJ.length]} ${t.kinds[j]} in ${city}`;
      const description = `${title}. ${t.blurb} Located in ${loc}, ${o.country}, close to local attractions, ` +
        `dining and transport. Hosted by ${o.business_name}.`;
      const [min, max] = o.price;
      const price = roundTo(min + ((max - min) * j) / (o.places.length - 1), min >= 1000 ? 50 : 5);
      const image = `https://picsum.photos/seed/wanderlust-${o.username}-${j + 1}/1200/800`;
      return '(' + ['@uid', q(title), q(description), price.toFixed(2), q(loc), q(o.country), lat, lng, q(image)].join(', ') + ')';
    });

    out.push('INSERT INTO listings (owner_id, title, description, price, location, country, latitude, longitude, image_url) VALUES');
    out.push(rows.join(',\n') + ';', '');
  });

  out.push('COMMIT;');
  fs.writeFileSync(path.join(__dirname, 'seed.sql'), out.join('\n'));
  console.log('Wrote seed/seed.sql (10 owners, 50 listings)');
})();
