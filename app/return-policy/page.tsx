import type { Metadata } from 'next';
import PolicyPage, { PolicySection } from '@/components/PolicyPage';

export const metadata: Metadata = {
  title: 'Return Policy — KDSL Clothing',
  description: 'Read the KDSL Clothing return and exchange policy for online orders.',
};

const sections: PolicySection[] = [
  {
    id: 'eligibility',
    title: 'Return Eligibility',
    body: [
      'We want every KDSL piece to arrive in excellent condition and fit your expectations. If something is not right, you may request a return or exchange within 7 days of delivery.',
      'Returned items must be unworn, unwashed, unused, and in their original condition with tags, packaging, and any included accessories intact.',
    ],
    bullets: [
      'Final sale items, gift cards, customized products, and worn or damaged items are not eligible for return.',
      'Items with perfume, deodorant marks, stains, damage, or missing tags may be refused.',
      'Original delivery fees are non-refundable unless the issue was caused by our error.',
    ],
  },
  {
    id: 'process',
    title: 'How to Start a Return',
    body: [
      'To request a return, contact our support team with your order number, the item you want to return, and the reason for the request.',
      'After your request is reviewed, we will send return instructions. Please do not send items back before your request is approved.',
    ],
    bullets: [
      'Email or contact us within 7 days of receiving your order.',
      'Pack the item securely to avoid damage during return shipping.',
      'Keep your return tracking details until your request is completed.',
    ],
  },
  {
    id: 'refunds',
    title: 'Refunds and Exchanges',
    body: [
      'Once we receive and inspect your return, we will notify you whether it has been approved. Approved refunds are processed back to the same payment-initiated media or original payment method used for the order.',
      'For card or PayHere payments, the refund will be returned to the same card/payment account used at checkout. For bank transfer orders, refunds will be returned to the customer bank account verified for that order.',
      'Exchange requests depend on stock availability. If the requested size, color, or product is unavailable, we may offer a refund or store credit instead.',
    ],
    note: 'Refund processing times can vary depending on your bank or payment provider. We do not issue refunds to unrelated third-party accounts.',
  },
  {
    id: 'damaged-items',
    title: 'Damaged or Incorrect Items',
    body: [
      'If your order arrives damaged, defective, or incorrect, contact us within 48 hours of delivery with clear photos of the product, packaging, and order details.',
      'When the issue is verified, we will arrange a replacement, exchange, or refund based on the situation and available stock.',
    ],
  },
];

export default function ReturnPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Support"
      title="Return"
      accent="Policy"
      intro="Clear rules for returns, exchanges, refunds, and damaged-item requests for KDSL Clothing orders."
      lastUpdated="June 12, 2026"
      sections={sections}
    />
  );
}
