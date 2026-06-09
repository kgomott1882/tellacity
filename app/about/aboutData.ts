function brandImage(filename: string): string {
  return `/brand/${encodeURIComponent(filename)}`;
}

export const ABOUT_IMAGES = {
  hero: brandImage("Team_pictures_work_attire_202606011500.jpeg"),
  whoWeAre: brandImage("Who we are.jpeg"),
  teamsBanner: brandImage("Review Discusstion.jpeg"),
  splitConsumer: brandImage("Business_collaboration_photo_202606031843.jpeg"),
  splitBusiness: brandImage("Office Rental_20260502_111519.png"),
  insights: brandImage("Engage Customers.png"),
} as const;
