export type Product = {
  id: string;
  name: string;
  slug: string;
  rating: number;
  defaultVariant: {
    sku: string;
  };
  pricing: {
    onSale: boolean;
    priceRange: {
      start: {
        gross: {
          amount: number;
          currency: string;
        };
      };
      stop: {
        gross: {
          amount: number;
          currency: string;
        };
      };
    };
    discount: {
      gross: {
        amount: number;
        currency: string;
      };
    };
  };
  media: [
    {
      url: string;
    },
    {
      url: string;
    },
    {
      url: string;
    }
  ];
  category: {
    id: string;
    name: string;
  };
};
