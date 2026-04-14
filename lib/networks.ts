export type NetworkId =
  | 'instagram' | 'x' | 'tiktok' | 'youtube' | 'twitch'
  | 'bluesky' | 'threads' | 'discord' | 'kick' | 'reddit'
  | 'bereal' | 'substack' | 'mastodon' | 'letterboxd'

export type Network = {
  id: NetworkId
  label: string
  buildUrl: (handle: string) => string
  main: boolean   // true = shown in primary grid; false = shown in "More"
}

export const NETWORKS: Network[] = [
  { id: 'instagram', label: 'Instagram',  buildUrl: (h) => `https://instagram.com/${h}`,       main: true },
  { id: 'x',         label: 'X / Twitter', buildUrl: (h) => `https://x.com/${h}`,              main: true },
  { id: 'tiktok',    label: 'TikTok',     buildUrl: (h) => `https://tiktok.com/@${h}`,          main: true },
  { id: 'youtube',   label: 'YouTube',    buildUrl: (h) => `https://youtube.com/@${h}`,         main: true },
  { id: 'twitch',    label: 'Twitch',     buildUrl: (h) => `https://twitch.tv/${h}`,            main: true },
  { id: 'bluesky',   label: 'Bluesky',    buildUrl: (h) => `https://bsky.app/profile/${h}`,     main: false },
  { id: 'threads',   label: 'Threads',    buildUrl: (h) => `https://threads.net/@${h}`,         main: false },
  { id: 'discord',   label: 'Discord',    buildUrl: (h) => `https://discord.com/users/${h}`,    main: false },
  { id: 'kick',      label: 'Kick',       buildUrl: (h) => `https://kick.com/${h}`,             main: false },
  { id: 'reddit',    label: 'Reddit',     buildUrl: (h) => `https://reddit.com/u/${h}`,         main: false },
  { id: 'bereal',    label: 'BeReal',     buildUrl: (h) => `https://bere.al/${h}`,              main: false },
  { id: 'substack',  label: 'Substack',   buildUrl: (h) => `https://${h}.substack.com`,         main: false },
  { id: 'mastodon',  label: 'Mastodon',   buildUrl: (h) => `https://mastodon.social/@${h}`,     main: false },
  { id: 'letterboxd',label: 'Letterboxd', buildUrl: (h) => `https://letterboxd.com/${h}`,       main: false },
]

export const NETWORKS_MAP: Record<NetworkId, Network> = Object.fromEntries(
  NETWORKS.map((n) => [n.id, n])
) as Record<NetworkId, Network>

export const VALID_NETWORK_IDS: string[] = NETWORKS.map((n) => n.id)
