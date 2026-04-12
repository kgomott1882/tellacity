type CategoryAboutPageProps = {
  params: Promise<{ category_slug: string }>;
};

export default async function CategoryAboutPage({ params }: CategoryAboutPageProps) {
  const { category_slug } = await params;
  const categoryName = category_slug.replace(/-/g, " ");
  const isSalonsAndClinics = category_slug === "salons-and-clinics";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6 capitalize">
        {isSalonsAndClinics ? "About salons and clinics" : `About ${categoryName}`}
      </h1>

      {isSalonsAndClinics ? (
        <>
          <p className="mb-4 text-gray-700">
            The salons and clinics category on Tellacity helps people discover trusted beauty and healthcare providers across the United Kingdom based on real customer reviews, ratings, and experiences. Whether you're looking for a reliable hair salon, a skincare clinic, or advanced aesthetic treatments, this category brings together businesses that specialize in personal care and professional treatments.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">
            What businesses are included in this category
          </h2>

          <p className="mb-4 text-gray-700">
            This category includes a wide range of businesses offering services related to salons and clinics. These include hair salons, beauty salons, aesthetic clinics, laser treatment centers, skincare specialists, and other personal care providers focused on customer wellbeing, treatments, and cosmetic services.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">
            Common services in this category
          </h2>

          <p className="mb-3 text-gray-700">
            Businesses in this category may offer:
          </p>

          <ul className="list-disc pl-5 text-gray-700 mb-4 space-y-1">
            <li>Hair cutting, styling, and colouring services</li>
            <li>Facials, skincare treatments, and cosmetic procedures</li>
            <li>Laser treatments and aesthetic services</li>
            <li>Beauty therapy and wellness services</li>
            <li>Health, beauty, and personal care consultations</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-2">
            How rankings work
          </h2>

          <p className="mb-4 text-gray-700">
            Rankings on Tellacity are based on a combination of review ratings, review volume, and recent customer activity. Businesses that consistently receive positive feedback and actively engage with customers tend to rank higher, helping users quickly identify the most trusted salons and clinics.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">
            What to look for when choosing a business
          </h2>

          <p className="mb-4 text-gray-700">
            When choosing a salon or clinic, it's important to consider customer reviews, service quality, hygiene standards, pricing transparency, and overall reputation. Reading multiple reviews can give you a clearer picture of real customer experiences and help you choose a provider that meets your expectations.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">
            Common issues customers report
          </h2>

          <p className="mb-4 text-gray-700">
            Customers sometimes report issues such as inconsistent service quality, unexpected pricing, long wait times, or results that don’t match expectations. Reviews play a key role in highlighting these patterns, helping others avoid poor experiences and choose more reliable businesses.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">
            Why reviews matter
          </h2>

          <p className="text-gray-700">
            Customer reviews provide valuable insight into real experiences with salons and clinics. They help identify trusted providers, highlight strengths and weaknesses, and create transparency across the industry, making it easier for people to make informed decisions.
          </p>
        </>
      ) : (
        <>
          <p className="mb-4 text-gray-700">
            The {categoryName} category on Tellacity helps people discover trusted businesses
            based on real customer reviews, ratings, and experiences. Whether you're looking for
            high-quality services or comparing providers, this category brings together businesses
            that specialize in {categoryName}.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">
            What businesses are included in this category
          </h2>

          <p className="mb-4 text-gray-700">
            This category includes businesses offering a wide range of services related to{" "}
            {categoryName}. These may include specialists and service providers that focus on
            customer care and professional outcomes.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">
            How rankings work
          </h2>

          <p className="mb-4 text-gray-700">
            Rankings on Tellacity are based on a combination of review ratings, review volume,
            and recent customer activity. Businesses with consistent positive feedback and
            active engagement tend to rank higher.
          </p>
        </>
      )}
    </div>
  );
}
