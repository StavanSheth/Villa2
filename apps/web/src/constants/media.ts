const BASE = import.meta.env.BASE_URL;

/**
 * Centralized media registry for Chunawala's Seven C Villa
 * Default night mode starts with NIGHT_HERO (photos/night/hero2.png).
 */

export const MEDIA = {
  animated: {
    entrance: `${BASE}photos/animated/Entrance.png`,
    barbeque: `${BASE}photos/animated/barbeque.png`,
    bathroom: `${BASE}photos/animated/bathroom.png`,
    bedroom: `${BASE}photos/animated/bedroom.png`,
    hall: `${BASE}photos/animated/hall.png`,
    hero: `${BASE}photos/animated/hero.png`,
    kitchen: `${BASE}photos/animated/kitchen.png`,
    pool: `${BASE}photos/animated/pool.png`,
  },
  hero: {
    night: `${BASE}photos/night/hero2.png`,
    nightGlass: `${BASE}photos/glass/Gemini_Generated_Image_wxhmrzwxhmrzwxhm.png`,
    nightVideo: `${BASE}photos/glass/don_t_show_brush_and_keep_rest.mp4`,
    nightLoopVideo: `${BASE}photos/glass/Clouds_and_water_waves_202608021644.mp4`,
    nightSkyLoop: `${BASE}photos/glass/Night_sky,_plants,_pool_ripples_202608021859.mp4`,
    nightAlt: `${BASE}photos/night/hero_page.png`,
    day: `${BASE}photos/day/Bright sun hero.jpg`,
    dayVideo: `${BASE}photos/glass/Tropical_plants,_pool,_ball_rota…_202608021931.mp4`,
    dayAlt: `${BASE}photos/day/Hero page.jpeg`,
  },
  entrance: {
    night: `${BASE}photos/night/entrance.png`,
    day: `${BASE}photos/day/entrance.png`,
  },
  balcony: {
    night: `${BASE}photos/night/BALCONY.png`,
    day: `${BASE}photos/day/balcony.png`,
  },
  barbeque: {
    night: `${BASE}photos/night/BARBEQUE.png`,
    day: `${BASE}photos/day/BARBEQUE.png`,
  },
  pool: {
    night: [
      `${BASE}photos/night/POOL%20TOP%20VIEW.png`,
      `${BASE}photos/night/pool.png`,
      `${BASE}photos/night/pool1.png`,
    ],
    day: [
      `${BASE}photos/day/pool.png`,
      `${BASE}photos/night/POOL%20TOP%20VIEW.png`,
      `${BASE}photos/day/pool1.jpg`,
    ],
  },
  interior: [
    {
      id: 'living',
      title: 'Grand Living Hall',
      category: 'Lounge',
      description: 'Double-height ceiling hall with luxury Italian marble and ambient evening lighting.',
      src: `${BASE}photos/interior/hall.png`,
    },
    {
      id: 'master-suite',
      title: 'Master Bedroom Suite 1',
      category: 'Suites',
      description: 'Spacious master sanctuary featuring panoramic garden views and plush bedding.',
      src: `${BASE}photos/interior/room1.png`,
    },
    {
      id: 'guest-suite-1',
      title: 'Royal Guest Bedroom 2',
      category: 'Suites',
      description: 'Serene guest retreat with bespoke wood finishes and soft natural daylight.',
      src: `${BASE}photos/interior/room2.png`,
    },
    {
      id: 'guest-suite-2',
      title: 'Deluxe Suite 3',
      category: 'Suites',
      description: 'Cozy and sophisticated private bedroom designed for restful tranquility.',
      src: `${BASE}photos/interior/room3.png`,
    },
    {
      id: 'dining',
      title: 'Gourmet Dining Room',
      category: 'Dining',
      description: 'An expansive dining area crafted for intimate family feasts and celebratory dinners.',
      src: `${BASE}photos/interior/dinning.png`,
    },
    {
      id: 'kitchen',
      title: 'Modern Chef Kitchen',
      category: 'Dining',
      description: 'Fully equipped modern kitchen with state-of-the-art appliances and marble breakfast bar.',
      src: `${BASE}photos/interior/kitchen.png`,
    },
    {
      id: 'bathroom',
      title: 'Spa-Inspired Bathroom',
      category: 'Wellness',
      description: 'Luxurious bathroom retreat with rain shower, soaking tub, and organic bath amenities.',
      src: `${BASE}photos/interior/bathroom.png`,
    },
    {
      id: 'bbq',
      title: 'Outdoor Barbeque Lounge',
      category: 'Outdoors',
      description: 'Private outdoor barbeque deck overlooking lush landscaping for memorable evening gatherings.',
      src: `${BASE}photos/interior/barbeque.jpg`,
    },
  ],
  trees: {
    tree1: `${BASE}photos/trees/pngwing.com.png`,
    tree2: `${BASE}photos/trees/pngwing.com (1).png`,
  },
  videos: {
    heroAtmosphere:
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260325_120549_0cd82c36-56b3-4dd9-b190-069cfc3a623f.mp4',
    missionAtmosphere:
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4',
    solutionAtmosphere:
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4',
  },
} as const;
