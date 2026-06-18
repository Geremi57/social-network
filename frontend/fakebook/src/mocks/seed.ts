import type {
  User, Post, Comment, Group, EventItem, Notification, Conversation, Message,
} from "@/types";

const FIRST = ["Ava","Liam","Noah","Mia","Zoe","Eli","Maya","Kai","Iris","Theo","Nina","Owen","Sara","Leo","Lina","Eden","Ivan","Yara","Jude","Asha","Otto","Rumi","Sage","Tobi","Vera","Wes","Cleo","Ezra","Faye","Gus","Hana","Jia","Kade","Luca","Mila","Ngoc","Omar","Pia","Quin","Reza","Suki","Tara","Uma","Vic","Wren","Xena","Yusuf","Zara","Anya","Boyd"];
const LAST = ["Reyes","Okafor","Park","Nguyen","Cohen","Devi","Singh","Mori","Patel","Khan","Silva","Wong","Adler","Reza","Costa","Hart","Yates","Bauer","Levin","Cruz"];
const CITIES = ["Brooklyn, NY","Lisbon, PT","Berlin, DE","Tokyo, JP","Mexico City, MX","Toronto, CA","Cape Town, ZA","Bangalore, IN","Sydney, AU","Paris, FR","Stockholm, SE","Seoul, KR"];
const BIOS = [
  "Designer, gardener, occasional poet.",
  "Building tools for thought. Coffee maximalist.",
  "PM @ small studio. Loud about tiny details.",
  "Researcher of cities & soft systems.",
  "Climber, reader, dad of two.",
  "Independent illustrator. Open for commissions.",
  "Writes about music every Sunday.",
  "Trying to ship more than I tweet.",
  "Working on a novel nobody asked for.",
  "Curious about everything, expert in nothing.",
];

const seedRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};
const rng = seedRandom(42);
const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
const int = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const minsAgo = (n: number) => new Date(Date.now() - n * 60000).toISOString();

const avatar = (seed: string) => `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=c0aede,b6e3f4,ffd5dc,d1d4f9,ffdfbf`;
const cover = (seed: string) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/400`;
const photo = (seed: string) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/1000/700`;

export const users: User[] = Array.from({ length: 50 }, (_, i) => {
  const name = `${pick(FIRST)} ${pick(LAST)}`;
  const handle = name.toLowerCase().replace(/[^a-z]/g, "") + int(10, 999);
  return {
    id: `u_${i + 1}`,
    name,
    handle,
    avatar: avatar(handle),
    cover: cover(`cover-${handle}`),
    bio: pick(BIOS),
    location: pick(CITIES),
    pronouns: pick(["she/her","he/him","they/them"]),
    isPrivate: rng() < 0.18,
    isVerified: rng() < 0.12,
    followers: int(12, 9800),
    following: int(20, 1200),
    joinedAt: daysAgo(int(120, 2400)),
  };
});

// Current user
export const currentUser: User = {
  id: "u_me",
  name: "Ada Lin",
  handle: "ada",
  avatar: avatar("ada-lin"),
  cover: cover("ada-cover"),
  bio: "Product designer building Pulse. Coffee, ceramics, and long walks.",
  location: "Brooklyn, NY",
  pronouns: "she/her",
  isPrivate: false,
  isVerified: true,
  followers: 1842,
  following: 312,
  joinedAt: daysAgo(720),
};
users.unshift(currentUser);

const POST_TEXTS = [
  "Spent the morning at the farmer's market and somehow came home with three kinds of plums I've never tried.",
  "Hot take: most onboarding flows would be better if they did half as much.",
  "Finally shipped the dashboard rewrite. Three months of small decisions adding up.",
  "Tiny win: switched my keyboard layout and finally stopped fighting my pinky.",
  "Reading *Pattern Language* again. It hits differently after building a few real products.",
  "Anyone in Lisbon next week? Coffee on me ☕️",
  "Started journaling 5 minutes a night. Surprised by how often the same word comes up.",
  "The detail that sold me on this new app: error states with personality.",
  "Just realized 'good enough' is a feature, not a compromise.",
  "Walked 14k steps today and didn't open Slack once. Recommend.",
];

export const posts: Post[] = (Array.from({ length: 150 }, (_, i) => {
  const author = pick(users);
  const hasImage = rng() < 0.45;
  return {
    id: `p_${i + 1}`,
    authorId: author.id,
    createdAt: minsAgo(int(2, 60 * 24 * 14)),
    text: pick(POST_TEXTS) + (rng() < 0.3 ? " " + pick(POST_TEXTS) : ""),
    image: hasImage ? photo(`post-${i}`) : undefined,
    privacy: (rng() < 0.85 ? "public" : (rng() < 0.5 ? "followers" : "private")) as Post["privacy"],
    likes: int(0, 480),
    comments: int(0, 60),
    shares: int(0, 32),
    liked: rng() < 0.25,
    saved: rng() < 0.1,
  };
}) as Post[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const comments: Comment[] = posts.slice(0, 60).flatMap((p) => {
  const n = int(1, 5);
  return Array.from({ length: n }, (_, j) => ({
    id: `c_${p.id}_${j}`,
    postId: p.id,
    authorId: pick(users).id,
    text: pick([
      "This resonates.",
      "Saving this for later.",
      "Made me think — thank you for posting.",
      "Tell me more about the second part?",
      "Wait this is so good 👏",
      "Linking this in our team channel.",
    ]),
    createdAt: minsAgo(int(1, 600)),
    likes: int(0, 28),
  }));
});

const GROUP_NAMES = [
  ["Slow Web Club","slow-web","People who build careful software."],
  ["Brooklyn Climbers","bk-climb","Indoor & outdoor sends, weekly meetups."],
  ["Design Engineering","design-eng","Where Figma meets Git."],
  ["Indie Hackers Lisbon","ih-lisbon","Founders building in Lisbon."],
  ["Reading Together","reading","One book a month, slow and steady."],
  ["Type Lovers","typelovers","Typography in the wild."],
  ["Pottery Studio","pottery","Wheel, hand-built, and everything in between."],
  ["Open Source Maintainers","oss","The quiet half of software."],
  ["Morning Pages","morning","5 minutes, every morning."],
  ["Plant Parents","plants","Stop killing your monstera."],
  ["AI for Designers","ai-design","Practical, not hype."],
  ["Bike Commuters","bikes","Routes, gear, and weather complaints."],
  ["Indie Game Devs","indiegame","Small teams, big ideas."],
  ["Home Cooks","homecooks","Weeknight wins."],
  ["Newsletter Writers","newsletters","Audience-building without burnout."],
  ["Trail Runners","trail","Long routes, soft surfaces."],
  ["Synth Heads","synths","Modular, software, weird."],
  ["Film Photographers","film","Grain forever."],
  ["Café Workers","cafe","Best laptop spots, by city."],
  ["Side Project Sundays","sps","Show what you shipped."],
];

export const groups: Group[] = GROUP_NAMES.map(([name, handle, desc], i): Group => ({
  id: `g_${i + 1}`,
  name,
  handle,
  description: desc,
  cover: cover(`group-${handle}`),
  icon: `https://api.dicebear.com/9.x/shapes/svg?seed=${handle}`,
  members: int(120, 18400),
  online: int(2, 240),
  category: pick(["Community","Hobby","Work","Local","Learning"]),
  privacy: rng() < 0.7 ? "public" : "private",
  membership: i < 4 ? "member" : (i === 5 ? "owner" : pick(["none","none","none","pending","invited"])),
  activity: pick(["low","medium","high","high"]),
}));

export const events: EventItem[] = Array.from({ length: 25 }, (_, i) => ({
  id: `e_${i + 1}`,
  title: pick([
    "Open Studio Night",
    "Monthly Book Club",
    "Lightning Talks #12",
    "Sunrise Trail Run",
    "Design Critique",
    "Open Mic & Tea",
    "Founders Coffee",
    "Print Zine Workshop",
  ]),
  description: "A small gathering for our community. Come early, stay late.",
  cover: photo(`event-${i}`),
  startsAt: new Date(Date.now() + int(1, 30) * 86400000).toISOString(),
  endsAt: new Date(Date.now() + int(31, 60) * 86400000).toISOString(),
  location: pick([...CITIES, "Online", "Online"]),
  online: rng() < 0.4,
  groupId: pick(groups).id,
  hostId: pick(users).id,
  attendees: int(8, 320),
  going: rng() < 0.25,
})).sort((a, b) => a.startsAt.localeCompare(b.startsAt));

export const notifications: Notification[] = Array.from({ length: 100 }, (_, i) => {
  const type = pick<Notification["type"]>(["follow_request","follow_accepted","group_invite","event","like","comment","mention","message"]);
  const actor = pick(users);
  const text = ({
    follow_request: `${actor.name} requested to follow you`,
    follow_accepted: `${actor.name} accepted your follow request`,
    group_invite: `${actor.name} invited you to a group`,
    event: `${actor.name} is hosting a new event`,
    like: `${actor.name} liked your post`,
    comment: `${actor.name} commented on your post`,
    mention: `${actor.name} mentioned you in a thread`,
    message: `${actor.name} sent you a message`,
  } as const)[type];
  return {
    id: `n_${i + 1}`,
    type,
    actorId: actor.id,
    createdAt: minsAgo(int(2, 60 * 24 * 10)),
    read: rng() < 0.55,
    text,
  };
}).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

const dmTexts = [
  "Hey! Are you around this week?",
  "Sending you that link now.",
  "Did you see the latest mock?",
  "Coffee tomorrow?",
  "lol that meeting could've been a doc",
  "Thanks for the intro 🙏",
  "Just landed — let's catch up soon",
  "Sharing a draft, would love your take",
];

export const conversations: Conversation[] = (Array.from({ length: 30 }, (_, i) => {
  const isGroup = i % 6 === 0;
  const partners = isGroup
    ? [currentUser.id, ...Array.from({ length: int(3, 6) }, () => pick(users).id)]
    : [currentUser.id, pick(users).id];
  const last: Message = {
    id: `m_${i}_last`,
    conversationId: `conv_${i + 1}`,
    authorId: pick(partners),
    text: pick(dmTexts),
    createdAt: minsAgo(int(1, 60 * 24 * 4)),
    seen: rng() < 0.7,
  };
  return {
    id: `conv_${i + 1}`,
    kind: (isGroup ? "group" : "dm") as Conversation["kind"],
    participantIds: partners,
    title: isGroup ? pick(["Design Crew","Launch War Room","Weekend Crew","Book Club","Roommates"]) : undefined,
    icon: isGroup ? `https://api.dicebear.com/9.x/shapes/svg?seed=conv${i}` : undefined,
    lastMessage: last,
    unread: rng() < 0.4 ? int(1, 6) : 0,
    pinned: i < 2,
  };
}) as Conversation[]).sort((a, b) => (b.lastMessage?.createdAt ?? "").localeCompare(a.lastMessage?.createdAt ?? ""));

export const messagesByConversation: Record<string, Message[]> = Object.fromEntries(
  conversations.map((c) => {
    const count = int(8, 24);
    const msgs: Message[] = Array.from({ length: count }, (_, j) => ({
      id: `m_${c.id}_${j}`,
      conversationId: c.id,
      authorId: pick(c.participantIds),
      text: pick(dmTexts),
      createdAt: minsAgo(count * 30 - j * 30 + int(0, 20)),
      seen: true,
    }));
    if (c.lastMessage) msgs.push(c.lastMessage);
    return [c.id, msgs];
  }),
);

// Follow graph (current user perspective)
export const followGraph: Record<string, "following" | "request_sent" | "follows_you" | "mutual" | "not_following"> = {};
users.forEach((u, i) => {
  if (u.id === currentUser.id) return;
  if (i < 8) followGraph[u.id] = "mutual";
  else if (i < 16) followGraph[u.id] = "following";
  else if (i < 22) followGraph[u.id] = "follows_you";
  else if (i < 26) followGraph[u.id] = "request_sent";
  else followGraph[u.id] = "not_following";
});

export const usersById = Object.fromEntries(users.map((u) => [u.id, u]));
export const groupsById = Object.fromEntries(groups.map((g) => [g.id, g]));
