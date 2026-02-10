"use client";

const YOUTUBE_VIDEO_ID = "RiKtc09qKhw";

export const InstallationSectionSkeleton = () => (
  <section className="bg-[#1D1E22] w-full">
    <div className="container mx-auto px-4 py-16 md:py-24 lg:py-40">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-center">
        {/* Left Content Skeleton */}
        <div className="flex flex-col gap-6 flex-1 w-full">
          {/* Header Skeleton */}
          <div className="flex flex-col gap-4">
            {/* Title skeleton */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <div className="w-8 h-6 bg-[#FFDB60]/30 rounded animate-pulse" />
                <div className="w-40 h-6 bg-white/20 rounded animate-pulse" />
              </div>
              <div className="w-full max-w-md h-10 md:h-12 lg:h-16 bg-white/20 rounded animate-pulse" />
            </div>

            {/* Description skeleton */}
            <div className="space-y-2">
              <div className="w-full h-5 bg-white/20 rounded animate-pulse" />
              <div className="w-3/4 h-5 bg-white/20 rounded animate-pulse" />
            </div>
          </div>

          {/* Benefits List Skeleton */}
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/20 rounded animate-pulse shrink-0" />
                <div className="w-48 h-5 bg-white/20 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Content - Video Skeleton */}
        <div className="flex-1 w-full">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-700 animate-pulse">
            {/* Play button skeleton */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-red-600/50 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const CheckIcon = () => (
  <svg
    className="w-6 h-6 text-white shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const benefits = [
  { bold: "No more", text: "stripped threads" },
  { bold: "No more", text: "burned hands" },
  { bold: "Less", text: "downtime" },
];

export function InstallationSection() {
  return (
    <section className="bg-[#1D1E22] w-full">
      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-40">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-center">
          {/* Left Content */}
          <div className="flex flex-col gap-6 flex-1 w-full">
            {/* Header */}
            <div className="flex flex-col gap-4">
              {/* Title with decorative slashes */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[#FFDB60] font-primary text-xl tracking-[-2px] font-bold">
                    {"///"}
                  </span>
                  <span className="text-white font-primary text-xl font-bold">
                    WATCH OUR VIDEO
                  </span>
                </div>
                <h2 className="text-white font-primary text-4xl md:text-5xl lg:text-[60px] leading-none font-bold">
                  INSTALLATION
                </h2>
              </div>

              {/* Description */}
              <p className="text-white font-secondary text-base md:text-lg lg:text-xl leading-7 tracking-[0.5px]">
                Simply install the valve and drain your engine oil without the
                need for any tools and without creating a mess.
              </p>
            </div>

            {/* Benefits List */}
            <div className="flex flex-col gap-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckIcon />
                  <p className="text-white font-secondary text-base md:text-lg lg:text-xl leading-[30px] tracking-[0.5px]">
                    <span className="font-bold">{benefit.bold}</span>
                    <span>{` ${benefit.text}`}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - YouTube Video */}
          <div className="flex-1 w-full">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg">
              <iframe
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0`}
                title="Installation Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
