import { gql } from "@apollo/client";

export type NewsLetterPageData = {
    id: string;
    title: string;
    content: string | null;
    contactFormEnabled: boolean;
    isPublished: boolean;
    productInquiryFormEnabled: boolean;
    recaptchaEnabled: boolean;
    fields: string[];
    description: string | null;
    emailTo: string | null;
    emailCc: string | null;
    emailBcc: string | null;
    emailSubject: string | null;
    successMessage: string | null;
  };
  
  export const GET_NEWSLETTER = gql`
    query Contact($first: Int = 1) {
      pages(first: $first, filter: { slugs: "newsletter-signup" }) {
        edges {
          node {
            id
            title
            content
            isPublished
            metadata {
              key
              value
            }
          }
        }
      }
    }
  `;