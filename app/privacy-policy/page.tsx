import type { Metadata } from 'next';
import PolicyPage, { PolicySection } from '@/components/PolicyPage';

export const metadata: Metadata = {
  title: 'Privacy Policy — KDSL Clothing',
  description: 'Learn how KDSL Clothing collects, uses, and protects customer information.',
};

const sections: PolicySection[] = [
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    body: [
      'We collect information needed to operate our store, process orders, provide support, and improve the shopping experience.',
      'This may include information you provide directly, information generated when you use the website, and information provided by trusted service providers.',
    ],
    bullets: [
      'Contact details such as name, email address, phone number, and delivery address.',
      'Order details such as products purchased, size, color, quantity, and order history.',
      'Account and authentication information when you create or sign in to an account.',
      'Website usage information such as device, browser, pages viewed, and basic analytics data.',
    ],
  },
  {
    id: 'how-we-use-information',
    title: 'How We Use Information',
    body: [
      'We use customer information to complete purchases, communicate about orders, respond to support requests, prevent misuse, and improve our products and services.',
      'We may also use your contact details to send updates or marketing messages where permitted. You can opt out of promotional messages at any time.',
    ],
  },
  {
    id: 'sharing-and-services',
    title: 'Sharing and Service Providers',
    body: [
      'We do not sell personal information. We share information only when needed to operate the business, comply with law, protect our rights, or deliver services you requested.',
      'Examples include payment processors, hosting providers, analytics tools, email providers, delivery partners, and customer support tools.',
      'When you choose an online payment method, payment-related information is handled by the relevant payment processor, including PayHere where applicable. We keep order and payment status records needed to confirm, support, refund, and reconcile your purchase.',
    ],
  },
  {
    id: 'payments-and-refunds',
    title: 'Payments and Refunds',
    body: [
      'We use order and payment information to verify payments, detect failed or pending payments, process bank transfer confirmations, and provide customer support.',
      'If an approved refund is due, the refund will be returned to the same payment-initiated media or original payment method used for the order. Card and online payment refunds are returned through the original payment provider, while bank transfer refunds are returned to the verified customer bank account for that order.',
    ],
  },
  {
    id: 'security-and-retention',
    title: 'Security and Retention',
    body: [
      'We use reasonable technical and organizational safeguards to protect customer information. No online service can guarantee complete security, but we work to reduce risk and limit access to personal data.',
      'We keep information only as long as needed for business, legal, accounting, fraud prevention, and customer support purposes.',
    ],
  },
  {
    id: 'your-choices',
    title: 'Your Choices',
    body: [
      'You may contact us to request access, correction, or deletion of your personal information, subject to legal and operational requirements.',
      'You can also manage account information through your account area where available, and unsubscribe from promotional emails using the link in those emails.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Privacy"
      title="Privacy"
      accent="Policy"
      intro="How KDSL Clothing collects, uses, shares, and protects information when you shop with us or use our website."
      lastUpdated="June 12, 2026"
      sections={sections}
    />
  );
}
