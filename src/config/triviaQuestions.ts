export interface TriviaQuestion {
  id: number;
  q: string;
  options: string[];
  answer: number; // 0-indexed
}

// 110 questions across science, history, geography, sports, tech, culture, math
export const TRIVIA_BANK: TriviaQuestion[] = [
  // GEOGRAPHY (1-15)
  { id: 1, q: "What is the capital of Nigeria?", options: ["Lagos", "Abuja", "Kano", "Port Harcourt"], answer: 1 },
  { id: 2, q: "Which African country has the most pyramids?", options: ["Egypt", "Sudan", "Ethiopia", "Libya"], answer: 1 },
  { id: 3, q: "What is the smallest country in the world by area?", options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], answer: 1 },
  { id: 4, q: "Through how many countries does the River Nile flow?", options: ["7", "9", "11", "13"], answer: 2 },
  { id: 5, q: "Which country has the longest coastline?", options: ["Russia", "Australia", "Canada", "Indonesia"], answer: 2 },
  { id: 6, q: "What is the driest continent on Earth?", options: ["Africa", "Australia", "Antarctica", "Asia"], answer: 2 },
  { id: 7, q: "Mount Kilimanjaro is located in which country?", options: ["Kenya", "Uganda", "Tanzania", "Ethiopia"], answer: 2 },
  { id: 8, q: "Which city is known as the 'Pearl of the Orient'?", options: ["Tokyo", "Manila", "Hong Kong", "Shanghai"], answer: 2 },
  { id: 9, q: "What is the largest desert in Africa?", options: ["Kalahari", "Namib", "Sahara", "Libyan"], answer: 2 },
  { id: 10, q: "Which European country has the most UNESCO World Heritage Sites?", options: ["France", "Spain", "Italy", "Germany"], answer: 2 },
  { id: 11, q: "What river runs through Baghdad?", options: ["Euphrates", "Nile", "Tigris", "Jordan"], answer: 2 },
  { id: 12, q: "Which country is known as the Land of the Rising Sun?", options: ["China", "South Korea", "Japan", "Thailand"], answer: 2 },
  { id: 13, q: "How many states does Nigeria have?", options: ["30", "33", "36", "39"], answer: 2 },
  { id: 14, q: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Brisbane"], answer: 2 },
  { id: 15, q: "Which ocean is the Mariana Trench located in?", options: ["Atlantic", "Indian", "Pacific", "Arctic"], answer: 2 },

  // SCIENCE (16-35)
  { id: 16, q: "What is the hardest natural substance on Earth?", options: ["Gold", "Iron", "Diamond", "Platinum"], answer: 2 },
  { id: 17, q: "How many bones are in the adult human body?", options: ["186", "206", "226", "246"], answer: 1 },
  { id: 18, q: "What planet has the most moons?", options: ["Jupiter", "Saturn", "Uranus", "Neptune"], answer: 1 },
  { id: 19, q: "What is the chemical symbol for potassium?", options: ["Po", "Pt", "K", "Ka"], answer: 2 },
  { id: 20, q: "What gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], answer: 2 },
  { id: 21, q: "What is the speed of light in km/s (approximately)?", options: ["150,000", "200,000", "300,000", "400,000"], answer: 2 },
  { id: 22, q: "Which element has the atomic number 1?", options: ["Helium", "Hydrogen", "Lithium", "Carbon"], answer: 1 },
  { id: 23, q: "What is the largest organ in the human body?", options: ["Liver", "Brain", "Skin", "Lungs"], answer: 2 },
  { id: 24, q: "How many chromosomes do humans have?", options: ["23", "44", "46", "48"], answer: 2 },
  { id: 25, q: "What type of animal is a komodo dragon?", options: ["Dinosaur", "Lizard", "Snake", "Crocodile"], answer: 1 },
  { id: 26, q: "What is the most abundant gas in Earth's atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Argon"], answer: 1 },
  { id: 27, q: "Which blood type is known as the universal donor?", options: ["A+", "B+", "AB+", "O-"], answer: 3 },
  { id: 28, q: "What part of the cell contains genetic material?", options: ["Cytoplasm", "Nucleus", "Ribosome", "Mitochondria"], answer: 1 },
  { id: 29, q: "How many teeth does an adult human typically have?", options: ["28", "30", "32", "34"], answer: 2 },
  { id: 30, q: "What is the boiling point of water in Celsius?", options: ["90°C", "100°C", "110°C", "120°C"], answer: 1 },
  { id: 31, q: "Which planet is closest to the Sun?", options: ["Venus", "Mercury", "Mars", "Earth"], answer: 1 },
  { id: 32, q: "What vitamin does sunlight help the body produce?", options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"], answer: 3 },
  { id: 33, q: "What is the pH of pure water?", options: ["5", "7", "9", "10"], answer: 1 },
  { id: 34, q: "Which scientist developed the theory of general relativity?", options: ["Newton", "Einstein", "Hawking", "Bohr"], answer: 1 },
  { id: 35, q: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi body"], answer: 2 },

  // HISTORY (36-55)
  { id: 36, q: "In what year did World War II end?", options: ["1943", "1944", "1945", "1946"], answer: 2 },
  { id: 37, q: "Who was the first President of the United States?", options: ["Adams", "Jefferson", "Washington", "Lincoln"], answer: 2 },
  { id: 38, q: "What year did Nigeria gain independence?", options: ["1957", "1960", "1963", "1965"], answer: 1 },
  { id: 39, q: "Which empire was ruled by Genghis Khan?", options: ["Ottoman", "Roman", "Mongol", "Persian"], answer: 2 },
  { id: 40, q: "The Berlin Wall fell in which year?", options: ["1987", "1989", "1991", "1993"], answer: 1 },
  { id: 41, q: "Who was the first woman to fly solo across the Atlantic?", options: ["Bessie Coleman", "Amelia Earhart", "Harriet Quimby", "Jacqueline Cochran"], answer: 1 },
  { id: 42, q: "What ancient wonder was located in Alexandria?", options: ["Colossus", "Lighthouse", "Hanging Gardens", "Temple of Artemis"], answer: 1 },
  { id: 43, q: "Which country was the first to grant women the right to vote?", options: ["USA", "UK", "New Zealand", "Australia"], answer: 2 },
  { id: 44, q: "The Renaissance began in which country?", options: ["France", "Spain", "Italy", "England"], answer: 2 },
  { id: 45, q: "Who discovered penicillin?", options: ["Pasteur", "Fleming", "Lister", "Koch"], answer: 1 },
  { id: 46, q: "What year was the United Nations founded?", options: ["1942", "1945", "1948", "1950"], answer: 1 },
  { id: 47, q: "Who was Nigeria's first military head of state?", options: ["Yakubu Gowon", "Aguiyi-Ironsi", "Murtala Mohammed", "Olusegun Obasanjo"], answer: 1 },
  { id: 48, q: "The French Revolution began in which year?", options: ["1776", "1789", "1799", "1804"], answer: 1 },
  { id: 49, q: "Who painted the Mona Lisa?", options: ["Picasso", "Da Vinci", "Van Gogh", "Michelangelo"], answer: 1 },
  { id: 50, q: "What was the name of the ship Darwin sailed on?", options: ["Endeavour", "Beagle", "Victory", "Mayflower"], answer: 1 },
  { id: 51, q: "Which civilization built Machu Picchu?", options: ["Aztec", "Maya", "Inca", "Olmec"], answer: 2 },
  { id: 52, q: "The Magna Carta was signed in which year?", options: ["1066", "1215", "1415", "1492"], answer: 1 },
  { id: 53, q: "Who was the first person to walk on the moon?", options: ["Buzz Aldrin", "Neil Armstrong", "John Glenn", "Yuri Gagarin"], answer: 1 },
  { id: 54, q: "The Cold War was primarily between which two superpowers?", options: ["USA & China", "USA & USSR", "UK & Germany", "France & Russia"], answer: 1 },
  { id: 55, q: "What year did apartheid officially end in South Africa?", options: ["1990", "1991", "1994", "1996"], answer: 2 },

  // TECHNOLOGY (56-70)
  { id: 56, q: "Who co-founded Apple Inc.?", options: ["Bill Gates", "Steve Jobs", "Jeff Bezos", "Mark Zuckerberg"], answer: 1 },
  { id: 57, q: "What does 'HTTP' stand for?", options: ["HyperText Transfer Protocol", "High Tech Transfer Process", "Hyper Terminal Transport Protocol", "Home Tool Transfer Platform"], answer: 0 },
  { id: 58, q: "In what year was the first iPhone released?", options: ["2005", "2006", "2007", "2008"], answer: 2 },
  { id: 59, q: "What programming language is known as the 'language of the web'?", options: ["Python", "Java", "JavaScript", "C++"], answer: 2 },
  { id: 60, q: "What does 'AI' stand for?", options: ["Auto Intelligence", "Artificial Intelligence", "Advanced Integration", "Automated Information"], answer: 1 },
  { id: 61, q: "Who is known as the father of the computer?", options: ["Alan Turing", "Charles Babbage", "John von Neumann", "Ada Lovelace"], answer: 1 },
  { id: 62, q: "What does 'USB' stand for?", options: ["Universal Serial Bus", "United System Board", "Ultra Speed Bandwidth", "Unique Storage Base"], answer: 0 },
  { id: 63, q: "Which company created the Android operating system?", options: ["Apple", "Microsoft", "Google", "Samsung"], answer: 2 },
  { id: 64, q: "What year was Bitcoin created?", options: ["2007", "2008", "2009", "2010"], answer: 2 },
  { id: 65, q: "What does 'RAM' stand for?", options: ["Random Access Memory", "Read And Modify", "Rapid Action Module", "Real Active Memory"], answer: 0 },
  { id: 66, q: "Which social media platform was founded by Mark Zuckerberg?", options: ["Twitter", "Instagram", "Facebook", "Snapchat"], answer: 2 },
  { id: 67, q: "What does 'VPN' stand for?", options: ["Virtual Private Network", "Visual Processing Node", "Verified Public Network", "Variable Protocol Network"], answer: 0 },
  { id: 68, q: "What is the most used search engine in the world?", options: ["Bing", "Yahoo", "Google", "DuckDuckGo"], answer: 2 },
  { id: 69, q: "What technology does NFC stand for?", options: ["New File Connection", "Near Field Communication", "Network Frequency Control", "Natural Flow Circuit"], answer: 1 },
  { id: 70, q: "In computing, what does 'GPU' stand for?", options: ["General Processing Unit", "Graphics Processing Unit", "Global Power Unit", "Grid Protocol Utility"], answer: 1 },

  // SPORTS (71-85)
  { id: 71, q: "How many players are on a standard football (soccer) team?", options: ["9", "10", "11", "12"], answer: 2 },
  { id: 72, q: "Which country has won the most FIFA World Cups?", options: ["Germany", "Argentina", "Italy", "Brazil"], answer: 3 },
  { id: 73, q: "In tennis, what is a score of 40-40 called?", options: ["Match point", "Deuce", "Advantage", "Break"], answer: 1 },
  { id: 74, q: "How long is a standard marathon in kilometers?", options: ["40.195", "42.195", "44.195", "46.195"], answer: 1 },
  { id: 75, q: "Which sport uses a shuttlecock?", options: ["Tennis", "Squash", "Badminton", "Table Tennis"], answer: 2 },
  { id: 76, q: "How many rings are on the Olympic flag?", options: ["3", "4", "5", "6"], answer: 2 },
  { id: 77, q: "Who holds the record for most goals in football history?", options: ["Messi", "Ronaldo", "Pelé", "Maradona"], answer: 1 },
  { id: 78, q: "Which country hosted the 2010 FIFA World Cup?", options: ["Brazil", "Germany", "South Africa", "Russia"], answer: 2 },
  { id: 79, q: "In basketball, how many points is a free throw worth?", options: ["1", "2", "3", "4"], answer: 0 },
  { id: 80, q: "What sport is played at Wimbledon?", options: ["Cricket", "Golf", "Tennis", "Rugby"], answer: 2 },
  { id: 81, q: "Which Nigerian footballer won the African Player of the Year 3 times?", options: ["Jay-Jay Okocha", "Nwankwo Kanu", "Rashidi Yekini", "Victor Osimhen"], answer: 1 },
  { id: 82, q: "How many periods are in an ice hockey game?", options: ["2", "3", "4", "5"], answer: 1 },
  { id: 83, q: "What is the maximum break in snooker?", options: ["140", "147", "155", "160"], answer: 1 },
  { id: 84, q: "Which Formula 1 driver has the most world championships?", options: ["Senna", "Schumacher", "Hamilton", "Verstappen"], answer: 2 },
  { id: 85, q: "In which sport would you perform a 'slam dunk'?", options: ["Volleyball", "Basketball", "Tennis", "Cricket"], answer: 1 },

  // CULTURE & ENTERTAINMENT (86-100)
  { id: 86, q: "What is the most spoken language in the world by native speakers?", options: ["English", "Spanish", "Mandarin", "Hindi"], answer: 2 },
  { id: 87, q: "Which planet is named after the Roman god of war?", options: ["Jupiter", "Mars", "Saturn", "Mercury"], answer: 1 },
  { id: 88, q: "Who wrote 'Romeo and Juliet'?", options: ["Dickens", "Shakespeare", "Austen", "Hemingway"], answer: 1 },
  { id: 89, q: "What is the currency of Japan?", options: ["Yuan", "Won", "Yen", "Ringgit"], answer: 2 },
  { id: 90, q: "Which Nigerian author wrote 'Things Fall Apart'?", options: ["Wole Soyinka", "Chinua Achebe", "Chimamanda Adichie", "Ben Okri"], answer: 1 },
  { id: 91, q: "What musical instrument has 88 keys?", options: ["Guitar", "Violin", "Piano", "Organ"], answer: 2 },
  { id: 92, q: "In Greek mythology, who is the king of the gods?", options: ["Poseidon", "Hades", "Zeus", "Apollo"], answer: 2 },
  { id: 93, q: "What is the hardest rock?", options: ["Granite", "Marble", "Diamond", "Obsidian"], answer: 2 },
  { id: 94, q: "Which film won the first Academy Award for Best Picture?", options: ["Wings", "The Jazz Singer", "Sunrise", "Metropolis"], answer: 0 },
  { id: 95, q: "What is the tallest building in the world (2024)?", options: ["Shanghai Tower", "Burj Khalifa", "One World Trade", "Taipei 101"], answer: 1 },
  { id: 96, q: "How many strings does a standard guitar have?", options: ["4", "5", "6", "8"], answer: 2 },
  { id: 97, q: "Which element has the chemical symbol 'Au'?", options: ["Silver", "Gold", "Aluminum", "Argon"], answer: 1 },
  { id: 98, q: "What color do you get when you mix red and blue?", options: ["Green", "Orange", "Purple", "Brown"], answer: 2 },
  { id: 99, q: "Who is the author of 'Harry Potter'?", options: ["J.R.R. Tolkien", "J.K. Rowling", "C.S. Lewis", "Roald Dahl"], answer: 1 },
  { id: 100, q: "What is the fastest land animal?", options: ["Lion", "Cheetah", "Horse", "Leopard"], answer: 1 },

  // HARDER / TRICKY (101-110)
  { id: 101, q: "What is the only metal that is liquid at room temperature?", options: ["Lead", "Mercury", "Gallium", "Cesium"], answer: 1 },
  { id: 102, q: "Which African country was never colonized?", options: ["Nigeria", "Ghana", "Ethiopia", "Kenya"], answer: 2 },
  { id: 103, q: "What is the square root of 1764?", options: ["38", "40", "42", "44"], answer: 2 },
  { id: 104, q: "Which Nigerian state is the largest by area?", options: ["Borno", "Niger", "Taraba", "Bauchi"], answer: 1 },
  { id: 105, q: "What is the half-life of Carbon-14 (approximately)?", options: ["2,700 years", "5,730 years", "8,400 years", "11,200 years"], answer: 1 },
  { id: 106, q: "Who formulated the three laws of motion?", options: ["Galileo", "Newton", "Einstein", "Kepler"], answer: 1 },
  { id: 107, q: "What percentage of the Earth's surface is covered by water?", options: ["51%", "61%", "71%", "81%"], answer: 2 },
  { id: 108, q: "Which cryptocurrency uses 'proof of stake' natively since launch?", options: ["Bitcoin", "Ethereum", "Cardano", "Litecoin"], answer: 2 },
  { id: 109, q: "What is the lightest element in the periodic table?", options: ["Helium", "Hydrogen", "Lithium", "Oxygen"], answer: 1 },
  { id: 110, q: "In binary, what is the decimal number 13?", options: ["1011", "1101", "1110", "1001"], answer: 1 },
];

const SEEN_KEY = "lootboxx_trivia_seen";

export function getSeenIds(): number[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function markSeen(ids: number[]) {
  const prev = getSeenIds();
  const merged = Array.from(new Set([...prev, ...ids]));
  // If user has seen almost all, reset to allow replay with full pool
  if (merged.length >= TRIVIA_BANK.length - 5) {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
  } else {
    localStorage.setItem(SEEN_KEY, JSON.stringify(merged));
  }
}

export function pickUniqueQuestions(count: number): TriviaQuestion[] {
  const seen = new Set(getSeenIds());
  let pool = TRIVIA_BANK.filter(q => !seen.has(q.id));
  // If not enough unseen, reset and use full bank
  if (pool.length < count) {
    localStorage.removeItem(SEEN_KEY);
    pool = [...TRIVIA_BANK];
  }
  // Shuffle and pick
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
