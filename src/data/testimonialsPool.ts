// Pool of testimonials (English + Pidgin) with Nigerian names.
// A subset is shown and rotated every 12 hours based on a deterministic seed.

export type Testimonial = {
  name: string;
  role: string;
  initials: string;
  rating: number;
  content: string;
};

export const TESTIMONIALS_POOL: Testimonial[] = [
  // English
  { name: "Chinedu Okafor", role: "Daily Player • Lagos", initials: "CO", rating: 5, content: "LootBoxx don change my weekend plans! I play spin-the-wheel and trivia every evening, and I've cashed out twice already. Withdrawals on Saturday were smooth." },
  { name: "Aisha Bello", role: "Top Winner • Abuja", initials: "AB", rating: 5, content: "I activated with ₦7,000 and within two weeks I'd recovered it and more. The raffle draws are my favourite — won ₦25,000 last month. Legit platform!" },
  { name: "Tunde Adebayo", role: "Referrer • Ibadan", initials: "TA", rating: 5, content: "The referral system is sweet. Every five people that join through my link, I get a milestone bonus. I've made more from referrals than from games sef." },
  { name: "Ngozi Eze", role: "Trivia Champion • Enugu", initials: "NE", rating: 4, content: "I love the trivia quiz — questions are challenging but fair. Wish there were more categories, but the points add up fast and converting to cash is easy." },
  { name: "Emeka Nwosu", role: "Raffle Enthusiast • Port Harcourt", initials: "EN", rating: 5, content: "Three raffle wins in two months! The platform feels fair and the WhatsApp support replied fast when I had a question about my coupon renewal." },
  { name: "Funke Adeyemi", role: "VIP Member • Lagos", initials: "FA", rating: 4, content: "Variety of games keeps me coming back. From slots to roulette to instant scratch cards. Payouts hit my GTBank account same evening on weekend withdrawal window." },
  { name: "Ibrahim Suleiman", role: "Weekend Player • Kano", initials: "IS", rating: 5, content: "I only play Friday nights and weekends, but the daily reminders keep me engaged. Won ₦12,000 on lucky slots last Saturday — straight to my account." },
  { name: "Blessing Okoro", role: "New Player • Benin City", initials: "BO", rating: 4, content: "Signed up two weeks ago. The ₦7,000 activation felt steep at first but the welcome bonus and points convinced me. Already up ₦4,500. No regrets." },
  { name: "Yetunde Bakare", role: "Lucky Spinner • Abeokuta", initials: "YB", rating: 5, content: "The spin-the-wheel feature is so addictive. I won ₦8,000 on my third spin of the week. Customer service responded to my withdrawal question in minutes." },
  { name: "Kelechi Onyeka", role: "Crash Player • Owerri", initials: "KO", rating: 5, content: "Crash game na real test of nerves. I cashed out at 4.2x last week — turned ₦1,000 into ₦4,200. The graphics are clean and gameplay is smooth." },
  { name: "Adaeze Obi", role: "Coupon Member • Awka", initials: "AO", rating: 5, content: "Renewed my coupon three times now. The weekly bonus alone covers part of the renewal. Best decision I made this year for my entertainment budget." },
  { name: "Sani Mohammed", role: "Sports Player • Kaduna", initials: "SM", rating: 4, content: "I focus on sports prediction and dice. Wins are consistent, payouts on time. Just dey wish say withdrawal window go reach weekday small." },

  // Pidgin
  { name: "Chioma Nnaji", role: "Daily Hustler • Aba", initials: "CN", rating: 5, content: "Omo, this app na correct one o! I dey play lucky slots every morning before work, my pocket don dey sweet small small. ₦3,500 enter last weekend sharp sharp." },
  { name: "Bukola Ogundimu", role: "Spin Lover • Lagos", initials: "BO", rating: 5, content: "Mehn, the spin wheel no be here! I spin on Tuesday, ₦5,000 land for my Opay. No long story, no wahala. LootBoxx don show me say winning real." },
  { name: "Segun Olayemi", role: "Crash Boss • Akure", initials: "SO", rating: 5, content: "Crash game dey humble person but if you sabi cash out early, money go enter. I take ₦2k, comot ₦9k. Na strategy o, no be luck alone." },
  { name: "Hauwa Mohammed", role: "Referrer • Sokoto", initials: "HM", rating: 5, content: "I don refer like 12 of my friends. Every time person activate, points dey land, cash too. Na the easiest side hustle wey I dey enjoy this year." },
  { name: "Obinna Eze", role: "Trivia King • Onitsha", initials: "OE", rating: 4, content: "Trivia na my own thing. I sabi book small, so e dey easy collect points. Just make sure say you no rush answer — read am well well first." },
  { name: "Damilola Ajayi", role: "Newbie • Ilorin", initials: "DA", rating: 5, content: "I just join two weeks ago, I no believe say money fit enter account weekend. My guy talk am I no gree, until I see am with my eye. LootBoxx legit die!" },
  { name: "Patience Udo", role: "Raffle Queen • Uyo", initials: "PU", rating: 5, content: "Raffle ticket na ₦200 small thing, but the prize fit shock you. Last month I carry ₦15,000 wey I no expect at all. Thank God for this platform abeg." },
  { name: "Kabiru Lawal", role: "Weekend Warrior • Ilorin", initials: "KL", rating: 4, content: "Friday to Sunday na my play time. I dey budget ₦5k, sometimes I lose, sometimes I cash out double. Withdrawal window 6-7pm na the only thing wey I no like." },
  { name: "Amarachi Okeke", role: "Slots Babe • Asaba", initials: "AO", rating: 5, content: "If you never play lucky slots, you never start! The reels dey roll fine fine, and when bonus enter, ah! Money go just dey land like rain for harmattan." },
  { name: "Femi Akintola", role: "Roulette Pro • Lagos", initials: "FA", rating: 5, content: "Roulette na my favourite. I dey put on red red, sometimes black, na strategy. Up to 30k profit this month alone. LootBoxx dey try abeg." },
  { name: "Zainab Ibrahim", role: "Daily Player • Maiduguri", initials: "ZI", rating: 4, content: "Every morning na to claim my daily bonus first. Free 100 points wey I go take play scratch card. Sometimes ₦500 enter, sometimes more. Na free money o!" },
  { name: "Uchenna Eke", role: "Big Winner • Nsukka", initials: "UE", rating: 5, content: "I cash out ₦40,000 last weekend! No be jokes! I scream tire, my wife think say something happen. LootBoxx don put smile for my face for real." },
  { name: "Olumide Sowemimo", role: "Mines Expert • Lagos", initials: "OS", rating: 5, content: "Mines game dey teach person patience. I take small small, ₦500 enter ₦3,500. If you sabi wetin you dey do, money no go finish for that game." },
  { name: "Rukayat Bello", role: "Coupon Holder • Ibadan", initials: "RB", rating: 5, content: "I renew my coupon every week without fail. The benefits plenty pass the wahala. Weekly bonus, daily points, na correct value for money." },
  { name: "Chiamaka Nwafor", role: "Plinko Lover • Enugu", initials: "CN", rating: 4, content: "Plinko na my chill game. After work, I just sit down dey drop ball. Sometimes ₦1,000 turn ₦4,500. The animation sef dey calm person mind." },
  { name: "Tobi Adeyinka", role: "Referrer • Lagos", initials: "TA", rating: 5, content: "My WhatsApp status na my advert wall. I don bring like 20 people, every one wey activate, ₦200 enter my balance. Easy money, na so I dey see am." },
  { name: "Halima Yusuf", role: "Wheel Spinner • Jos", initials: "HY", rating: 5, content: "Spin wheel dey shock me. I spin Monday, jackpot land — ₦10k! I no fit believe, I refresh page like 5 times before I sure say na real." },
  { name: "Chukwuemeka Anyanwu", role: "Dice King • Aba", initials: "CA", rating: 5, content: "Dice na my speciality. Roll over 50, I dey win consistent. Last week alone na ₦18,000 net profit. LootBoxx don become my second source of income." },
];

// Returns a deterministic 12-hour rotating slice of testimonials.
export function getRotatedTestimonials(count = 8, now = new Date()): Testimonial[] {
  const slot = Math.floor(now.getTime() / (12 * 60 * 60 * 1000));
  const start = slot % TESTIMONIALS_POOL.length;
  const out: Testimonial[] = [];
  for (let i = 0; i < count; i++) {
    out.push(TESTIMONIALS_POOL[(start + i) % TESTIMONIALS_POOL.length]);
  }
  return out;
}
