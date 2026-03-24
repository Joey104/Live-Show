/**
 * File: src/config/streams.ts
 * Description: Central configuration for the demo live streams list, including
 *              basic metadata and Polymarket-style markets for each room.
 */

import type { LiveMarketItem } from '../types/markets'

/**
 * StreamItem
 * Represents a single live stream with associated metadata and markets.
 */
export interface StreamItem {
  id: string
  title: string
  streamer: string
  viewers: number
  thumbnail: string
  tags: string[]
  /** High-level category: entertainment / game / music / talk… */
  category: string
  /** Polymarket-style markets specific to this stream. */
  markets: LiveMarketItem[]
  /** Nightlife / streamer video URL for the embedded player. */
  videoUrl: string
}

/**
 * makeGenericMarkets
 * Generates a pair of generic demo prediction markets for a given stream.
 * IDs are derived from the stream id to keep them globally unique.
 */
function makeGenericMarkets(streamId: string): LiveMarketItem[] {
  return [
    {
      id: `${streamId}-m1`,
      label: 'Will this room break 2k concurrent viewers during this session?',
      yesProb: 60,
      poolUsd: 7200,
    },
    {
      id: `${streamId}-m2`,
      label: 'Will chat unlock the wildest dare card before the final song?',
      yesProb: 52,
      poolUsd: 5400,
    },
  ]
}

/**
 * DEMO_STREAMS
 * Static demo streams list, including additional YouTube videos.
 * Each entry links to a real YouTube video but is used only in this
 * non-monetary demo.
 */
export const DEMO_STREAMS: StreamItem[] = [
  {
    id: 's1',
    title: 'Midnight Heat in Manila',
    streamer: 'Luna',
    viewers: 3240,
    thumbnail: 'https://img.youtube.com/vi/Gbi1hpo-mak/hqdefault.jpg',
    tags: ['Neon', 'Late Night', 'Seduction'],
    category: 'Entertainment',
    markets: [
      {
        id: 's1-m1',
        label: "Will Luna's room break 3.5k concurrent viewers tonight?",
        yesProb: 72,
        poolUsd: 18240,
      },
      {
        id: 's1-m2',
        label:
          'Will the "shot for every 100 tips" goal be reached before 1 AM?',
        yesProb: 61,
        poolUsd: 12410,
      },
      {
        id: 's1-m3',
        label:
          'Will chat trigger the "kiss the camera" dare within 20 minutes?',
        yesProb: 54,
        poolUsd: 9320,
      },
    ],
    videoUrl:
      'https://www.youtube.com/embed/Gbi1hpo-mak?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's2',
    title: 'Tropical Temptation Market',
    streamer: 'Rico',
    viewers: 1680,
    thumbnail: 'https://img.youtube.com/vi/0wqLldobJ2Q/hqdefault.jpg',
    tags: ['Market', 'Talk', 'Flirty'],
    category: 'Talk',
    markets: [
      {
        id: 's2-m1',
        label: 'Will Rico close at least 5 flirt trades in the next 30 minutes?',
        yesProb: 58,
        poolUsd: 7640,
      },
      {
        id: 's2-m2',
        label:
          'Will "Yes, I dare you" poll win over "Play it safe" in chat?',
        yesProb: 69,
        poolUsd: 6810,
      },
    ],
    videoUrl:
      'https://www.youtube.com/embed/0wqLldobJ2Q?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's3',
    title: 'Karaoke After Dark',
    streamer: 'Maya',
    viewers: 4200,
    thumbnail: 'https://img.youtube.com/vi/dwosNWOU1SE/hqdefault.jpg',
    tags: ['Karaoke', 'Party', 'Spicy'],
    category: 'Music',
    markets: [
      {
        id: 's3-m1',
        label: 'Will the crowd pick a Tagalog love song as the encore?',
        yesProb: 64,
        poolUsd: 15210,
      },
      {
        id: 's3-m2',
        label: 'Will tips spike above $7k during the high-note challenge?',
        yesProb: 49,
        poolUsd: 12190,
      },
    ],
    videoUrl:
      'https://www.youtube.com/embed/dwosNWOU1SE?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's4',
    title: 'Island Secrets Q&A',
    streamer: 'Kai',
    viewers: 980,
    thumbnail: 'https://img.youtube.com/vi/f4TUAOfEIew/hqdefault.jpg',
    tags: ['Q&A', 'Stories', 'Confessions'],
    category: 'Talk',
    markets: [
      {
        id: 's4-m1',
        label: 'Will Kai reveal at least 3 secret island stories tonight?',
        yesProb: 67,
        poolUsd: 5420,
      },
      {
        id: 's4-m2',
        label: 'Will chat vote for a "truth" over "dare" three times in a row?',
        yesProb: 45,
        poolUsd: 3980,
      },
    ],
    videoUrl:
      'https://www.youtube.com/embed/f4TUAOfEIew?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's5',
    title: 'Sunrise Tease & Chill',
    streamer: 'Tess',
    viewers: 610,
    thumbnail: 'https://img.youtube.com/vi/ObI6U2LZ_6g/hqdefault.jpg',
    tags: ['Soft', 'Morning', 'Lo-fi'],
    category: 'Entertainment',
    markets: [
      {
        id: 's5-m1',
        label:
          'Will Tess keep the stream going until the first Manila sunrise light?',
        yesProb: 52,
        poolUsd: 4210,
      },
      {
        id: 's5-m2',
        label:
          'Will lo-fi vibes stay above 200 concurrent viewers until the end?',
        yesProb: 59,
        poolUsd: 3670,
      },
    ],
    videoUrl:
      'https://www.youtube.com/embed/ObI6U2LZ_6g?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's6',
    title: 'Late Night Neon Vibes',
    streamer: 'Arnel',
    viewers: 1980,
    thumbnail: 'https://img.youtube.com/vi/MdBiyKB3AnE/hqdefault.jpg',
    tags: ['Chill', 'Neon', 'Flirt'],
    category: 'Music',
    markets: [
      {
        id: 's6-m1',
        label: 'Will Arnel hit 2.5k viewers during the neon slow-dance set?',
        yesProb: 55,
        poolUsd: 9860,
      },
      {
        id: 's6-m2',
        label: 'Will the "spin the wheel" dare land on the wildest option?',
        yesProb: 43,
        poolUsd: 7120,
      },
    ],
    videoUrl:
      'https://www.youtube.com/embed/MdBiyKB3AnE?autoplay=1&mute=1&rel=0',
  },
  // Extra streams generated from additional YouTube links
  {
    id: 's7',
    title: 'Neon Street Cruise',
    streamer: 'Aya',
    viewers: 1540,
    thumbnail: 'https://img.youtube.com/vi/leXQ5ijXrPU/hqdefault.jpg',
    tags: ['Neon', 'Chill', 'Drive'],
    category: 'Music',
    markets: makeGenericMarkets('s7'),
    videoUrl:
      'https://www.youtube.com/embed/leXQ5ijXrPU?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's8',
    title: 'Midnight Food Run',
    streamer: 'Marco',
    viewers: 1320,
    thumbnail: 'https://img.youtube.com/vi/jEu2XcqKEqs/hqdefault.jpg',
    tags: ['Street', 'Food', 'Late Night'],
    category: 'Entertainment',
    markets: makeGenericMarkets('s8'),
    videoUrl:
      'https://www.youtube.com/embed/jEu2XcqKEqs?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's9',
    title: 'City Lights Tease',
    streamer: 'Selene',
    viewers: 1890,
    thumbnail: 'https://img.youtube.com/vi/SkApZRZv_ZQ/hqdefault.jpg',
    tags: ['Neon', 'Seduction', 'City'],
    category: 'Entertainment',
    markets: makeGenericMarkets('s9'),
    videoUrl:
      'https://www.youtube.com/embed/SkApZRZv_ZQ?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's10',
    title: 'Market After Hours',
    streamer: 'Noah',
    viewers: 960,
    thumbnail: 'https://img.youtube.com/vi/CxhGxROfxEo/hqdefault.jpg',
    tags: ['Market', 'Talk', 'Stories'],
    category: 'Talk',
    markets: makeGenericMarkets('s10'),
    videoUrl:
      'https://www.youtube.com/embed/CxhGxROfxEo?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's11',
    title: 'Tropical Slow Burn',
    streamer: 'Ira',
    viewers: 1760,
    thumbnail: 'https://img.youtube.com/vi/05ZORoJxc7c/hqdefault.jpg',
    tags: ['Slow', 'Tropical', 'Vibes'],
    category: 'Music',
    markets: makeGenericMarkets('s11'),
    videoUrl:
      'https://www.youtube.com/embed/05ZORoJxc7c?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's12',
    title: 'Night Market Temptations',
    streamer: 'Juno',
    viewers: 1220,
    thumbnail: 'https://img.youtube.com/vi/PbPtrBqwtOI/hqdefault.jpg',
    tags: ['Market', 'Neon', 'Flirty'],
    category: 'Entertainment',
    markets: makeGenericMarkets('s12'),
    videoUrl:
      'https://www.youtube.com/embed/PbPtrBqwtOI?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's13',
    title: 'Lo-fi Alley Confessions',
    streamer: 'Rae',
    viewers: 1480,
    thumbnail: 'https://img.youtube.com/vi/MzWQ33qcEVk/hqdefault.jpg',
    tags: ['Lo-fi', 'Confessions', 'Late Night'],
    category: 'Talk',
    markets: makeGenericMarkets('s13'),
    videoUrl:
      'https://www.youtube.com/embed/MzWQ33qcEVk?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's14',
    title: 'Rooftop Glow Session',
    streamer: 'Enzo',
    viewers: 2010,
    thumbnail: 'https://img.youtube.com/vi/XaWqrDN_qXQ/hqdefault.jpg',
    tags: ['Rooftop', 'Party', 'Neon'],
    category: 'Music',
    markets: makeGenericMarkets('s14'),
    videoUrl:
      'https://www.youtube.com/embed/XaWqrDN_qXQ?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's15',
    title: 'Hidden Bar Storytime',
    streamer: 'Miko',
    viewers: 990,
    thumbnail: 'https://img.youtube.com/vi/Jh-Y6Og0m0c/hqdefault.jpg',
    tags: ['Stories', 'Bar', 'Chill'],
    category: 'Talk',
    markets: makeGenericMarkets('s15'),
    videoUrl:
      'https://www.youtube.com/embed/Jh-Y6Og0m0c?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's16',
    title: 'Lagoon Moonlight',
    streamer: 'Chai',
    viewers: 830,
    thumbnail: 'https://img.youtube.com/vi/ddZ9C03W8Rk/hqdefault.jpg',
    tags: ['Soft', 'Night', 'Lagoon'],
    category: 'Entertainment',
    markets: makeGenericMarkets('s16'),
    videoUrl:
      'https://www.youtube.com/embed/ddZ9C03W8Rk?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's17',
    title: 'Neon Waves & Whispers',
    streamer: 'Lex',
    viewers: 1670,
    thumbnail: 'https://img.youtube.com/vi/zq8tLJruwPM/hqdefault.jpg',
    tags: ['Neon', 'Waves', 'Whispers'],
    category: 'Music',
    markets: makeGenericMarkets('s17'),
    videoUrl:
      'https://www.youtube.com/embed/zq8tLJruwPM?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's18',
    title: 'Street Grill After Dark',
    streamer: 'Nova',
    viewers: 1410,
    thumbnail: 'https://img.youtube.com/vi/5SQkAsn3rz4/hqdefault.jpg',
    tags: ['Food', 'Grill', 'Late Night'],
    category: 'Entertainment',
    markets: makeGenericMarkets('s18'),
    videoUrl:
      'https://www.youtube.com/embed/5SQkAsn3rz4?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's19',
    title: 'Pink Neon Dreams',
    streamer: 'Omar',
    viewers: 2120,
    thumbnail: 'https://img.youtube.com/vi/DJ7d0WTsdgo/hqdefault.jpg',
    tags: ['Dreamy', 'Neon', 'Chill'],
    category: 'Music',
    markets: makeGenericMarkets('s19'),
    videoUrl:
      'https://www.youtube.com/embed/DJ7d0WTsdgo?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's20',
    title: 'Manila Midnight Ride',
    streamer: 'Pia',
    viewers: 1730,
    thumbnail: 'https://img.youtube.com/vi/NRaezjM0uG8/hqdefault.jpg',
    tags: ['Drive', 'City', 'Neon'],
    category: 'Entertainment',
    markets: makeGenericMarkets('s20'),
    videoUrl:
      'https://www.youtube.com/embed/NRaezjM0uG8?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's21',
    title: 'Tropical Slow Dance',
    streamer: 'Yuri',
    viewers: 1580,
    thumbnail: 'https://img.youtube.com/vi/eb3aSot08p8/hqdefault.jpg',
    tags: ['Slow', 'Tropical', 'Dance'],
    category: 'Music',
    markets: makeGenericMarkets('s21'),
    videoUrl:
      'https://www.youtube.com/embed/eb3aSot08p8?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's22',
    title: 'City Pulse Session',
    streamer: 'Sia',
    viewers: 1490,
    thumbnail: 'https://img.youtube.com/vi/LTxxSX0Laos/hqdefault.jpg',
    tags: ['Pulse', 'City', 'Night'],
    category: 'Music',
    markets: makeGenericMarkets('s22'),
    videoUrl:
      'https://www.youtube.com/embed/LTxxSX0Laos?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's23',
    title: 'Seduction Radio Live',
    streamer: 'Raven',
    viewers: 2380,
    thumbnail: 'https://img.youtube.com/vi/gpNFSQ427iI/hqdefault.jpg',
    tags: ['Radio', 'Talk', 'Flirty'],
    category: 'Talk',
    markets: makeGenericMarkets('s23'),
    videoUrl:
      'https://www.youtube.com/embed/gpNFSQ427iI?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's24',
    title: 'Neon Rain Stories',
    streamer: 'Elle',
    viewers: 980,
    thumbnail: 'https://img.youtube.com/vi/HzMfmryz0SU/hqdefault.jpg',
    tags: ['Rain', 'Stories', 'Soft'],
    category: 'Talk',
    markets: makeGenericMarkets('s24'),
    videoUrl:
      'https://www.youtube.com/embed/HzMfmryz0SU?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's25',
    title: 'Skyline Seduction',
    streamer: 'Dane',
    viewers: 1930,
    thumbnail: 'https://img.youtube.com/vi/ZTKxotk3IJA/hqdefault.jpg',
    tags: ['Skyline', 'Seduction', 'Neon'],
    category: 'Entertainment',
    markets: makeGenericMarkets('s25'),
    videoUrl:
      'https://www.youtube.com/embed/ZTKxotk3IJA?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's26',
    title: 'Lo-fi Balcony Chill',
    streamer: 'Kira',
    viewers: 870,
    thumbnail: 'https://img.youtube.com/vi/zvpAo8YYgsQ/hqdefault.jpg',
    tags: ['Lo-fi', 'Balcony', 'Chill'],
    category: 'Music',
    markets: makeGenericMarkets('s26'),
    videoUrl:
      'https://www.youtube.com/embed/zvpAo8YYgsQ?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's27',
    title: 'Soft Neon Morning',
    streamer: 'Mara',
    viewers: 620,
    thumbnail: 'https://img.youtube.com/vi/LlgCTlVulps/hqdefault.jpg',
    tags: ['Soft', 'Morning', 'Neon'],
    category: 'Entertainment',
    markets: makeGenericMarkets('s27'),
    videoUrl:
      'https://www.youtube.com/embed/LlgCTlVulps?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's28',
    title: 'Harbor Night Cruise',
    streamer: 'Nate',
    viewers: 1430,
    thumbnail: 'https://img.youtube.com/vi/25HG25efbgg/hqdefault.jpg',
    tags: ['Harbor', 'Cruise', 'Night'],
    category: 'Entertainment',
    markets: makeGenericMarkets('s28'),
    videoUrl:
      'https://www.youtube.com/embed/25HG25efbgg?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's29',
    title: 'Midnight Street Drip',
    streamer: 'Zoe',
    viewers: 1610,
    thumbnail: 'https://img.youtube.com/vi/TrUMba3pccY/hqdefault.jpg',
    tags: ['Street', 'Fashion', 'Neon'],
    category: 'Entertainment',
    markets: makeGenericMarkets('s29'),
    videoUrl:
      'https://www.youtube.com/embed/TrUMba3pccY?autoplay=1&mute=1&rel=0',
  },
  {
    id: 's30',
    title: 'Deep Night Ride',
    streamer: 'Rio',
    viewers: 1740,
    thumbnail: 'https://img.youtube.com/vi/sk9o3zo-atU/hqdefault.jpg',
    tags: ['Drive', 'Deep Night', 'Chill'],
    category: 'Music',
    markets: makeGenericMarkets('s30'),
    videoUrl:
      'https://www.youtube.com/embed/sk9o3zo-atU?autoplay=1&mute=1&rel=0',
  },
]