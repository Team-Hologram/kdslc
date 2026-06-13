import type { Metadata } from 'next';
import PolicyPage, { PolicySection } from '@/components/PolicyPage';

export const metadata: Metadata = {
  title: 'Business Terms & Conditions — KDSL Clothing',
  description: 'Read the KDSL Clothing business terms and conditions for website use and purchases.',
};

const sections: PolicySection[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    body: [
      'By accessing the KDSL Clothing website, creating an account, placing an order, or using our services, you agree to these Business Terms and Conditions.',
      'If you do not agree with these terms, please do not use the website or place an order.',
    ],
  },
  {
    id: 'products-and-pricing',
    title: 'Products, Pricing, and Availability',
    body: [
      'We aim to display product descriptions, images, pricing, discounts, and availability accurately. However, errors may occur and product colors may vary depending on your screen or device settings.',
      'Prices, promotions, product availability, and product details may change without prior notice. We reserve the right to correct errors, update listings, or cancel orders affected by incorrect information.',
    ],
  },
  {
    id: 'orders-and-payment',
    title: 'Orders and Payment',
    body: [
      'Submitting an order does not mean the order has been accepted. Orders are subject to payment confirmation, stock availability, fraud checks, and operational review.',
      'You agree to provide accurate billing, delivery, and contact information. We may contact you if information is incomplete or if additional verification is required.',
      'If an approved refund is due, it will be returned to the same payment-initiated media or original payment method used for the order, subject to payment provider and bank processing timelines.',
    ],
    bullets: [
      'Payment must be completed using the available checkout methods.',
      'We may refuse or cancel orders at our discretion, including suspected fraud or misuse.',
      'Order confirmations and updates may be sent by email, phone, or other available contact methods.',
    ],
  },
  {
    id: 'returns-refunds',
    title: 'Returns, Exchanges, and Refunds',
    body: [
      'Returns, exchanges, and refunds are handled according to our Return Policy published on this website.',
      'Refunds are not paid to unrelated third-party accounts. Card and online payment refunds are returned to the original card or payment account, while bank transfer refunds are returned to the verified customer bank account for the relevant order.',
    ],
  },
  {
    id: 'shipping',
    title: 'Shipping and Delivery',
    body: [
      'Delivery timelines are estimates and may vary due to courier delays, location, weather, holidays, stock handling, or other circumstances outside our control.',
      'Risk of loss or damage may pass to you once the order is delivered to the address you provided or collected by your chosen delivery method.',
    ],
  },
  {
    id: 'accounts',
    title: 'Accounts and Website Use',
    body: [
      'You are responsible for keeping your account login details secure and for activity that occurs under your account.',
      'You agree not to misuse the website, interfere with security, attempt unauthorized access, copy content without permission, or use the website for unlawful activity.',
    ],
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property',
    body: [
      'All KDSL Clothing names, logos, images, product designs, graphics, text, and website content are owned by or licensed to KDSL Clothing unless stated otherwise.',
      'You may not copy, reproduce, distribute, modify, or commercially use our content without written permission.',
    ],
  },
  {
    id: 'limits',
    title: 'Limitation of Liability',
    body: [
      'To the maximum extent permitted by applicable law, KDSL Clothing is not responsible for indirect, incidental, special, or consequential losses arising from use of the website, delayed delivery, product unavailability, or service interruption.',
      'Nothing in these terms is intended to exclude rights that cannot be excluded under applicable consumer protection laws.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes to These Terms',
    body: [
      'We may update these Business Terms and Conditions from time to time. The updated version will be posted on this page with a revised last-updated date.',
      'Continued use of the website after changes are posted means you accept the updated terms.',
    ],
  },
];

export default function TermsAndConditionsPage() {
  return (
    <PolicyPage
      eyebrow="Business Terms"
      title="Terms"
      accent="Conditions"
      intro="The business terms that apply when you use the KDSL Clothing website, create an account, or place an order."
      lastUpdated="June 12, 2026"
      sections={sections}
    />
  );
}
