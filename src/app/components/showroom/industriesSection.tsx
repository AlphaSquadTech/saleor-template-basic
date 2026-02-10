import Image from "next/image";

export const IndustriesSectionSkeleton = () => (
  <section className="bg-[#f5f5f5] w-full">
    <div className="container mx-auto px-4 py-16 md:py-20 lg:py-24">
      <div className="flex flex-col gap-12 md:gap-16 items-center">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4 items-center text-center max-w-3xl w-full">
          <div className="w-full max-w-lg h-10 md:h-12 lg:h-14 bg-gray-300 rounded animate-pulse" />
          <div className="w-full max-w-md h-5 md:h-6 bg-gray-300 rounded animate-pulse" />
        </div>

        {/* Application Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col gap-6 items-center">
              <div className="relative aspect-square w-full border-8 border-white shadow-[0px_0px_30px_0px_rgba(0,0,0,0.25)] overflow-hidden bg-gray-300 animate-pulse" />
              <div className="w-3/4 h-5 md:h-6 bg-gray-300 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const applications = [
  {
    image: "/images/industries/cars-pickups-vans.jpg",
    label: "CARS / PICK UPS / VANS",
  },
  {
    image: "/images/industries/heavy-duty-trucks.jpg",
    label: "HEAVY DUTY TRUCKS / BUSES",
  },
  {
    image: "/images/industries/construction-equipment.jpg",
    label: "CONSTRUCTION EQUIPMENT",
  },
  {
    image: "/images/industries/motorcycles.jpg",
    label: "MOTORCYCLES",
  },
  {
    image: "/images/industries/industrial.jpg",
    label: "INDUSTRIAL",
  },
  {
    image: "/images/industries/marine.jpg",
    label: "MARINE",
  },
];

interface ApplicationCardProps {
  image: string;
  label: string;
}

const ApplicationCard = ({ image, label }: ApplicationCardProps) => (
  <div className="flex flex-col gap-6 items-center">
    <div className="relative aspect-square w-full border-8 border-white shadow-[0px_0px_30px_0px_rgba(0,0,0,0.25)] overflow-hidden">
      <Image
        src={image}
        alt={label}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    </div>
    <p className="font-secondary font-bold text-lg md:text-xl text-[#111] text-center uppercase leading-none">
      {label}
    </p>
  </div>
);

export function IndustriesSection() {
  return (
    <section className="bg-[#f5f5f5] w-full">
      <div className="container mx-auto px-4 py-16 md:py-20 lg:py-24">
        <div className="flex flex-col gap-12 md:gap-16 items-center">
          {/* Header */}
          <div className="flex flex-col gap-4 items-center text-center max-w-3xl">
            <h2 className="font-primary text-3xl md:text-4xl lg:text-5xl text-[#1D1E22] leading-none">
              BOUNDLESS APPLICATIONS
            </h2>
            <p className="font-secondary text-base md:text-lg lg:text-xl text-[#1D1E22]">
              Explore products built for a wide range of use cases.
            </p>
          </div>

          {/* Application Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {applications.map((app, index) => (
              <ApplicationCard
                key={index}
                image={app.image}
                label={app.label}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
