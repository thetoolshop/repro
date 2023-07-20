import { createView } from '@repro/typed-binary-encoder'
import z from 'zod'
import { uint16, uint32, uint8 } from './common'

// type FreePlan: struct {
//   type: 'free'
//   includedSeats: uint8
//   uploadLimit: uint16
// }

export const FreePlanSchema = z.object({
  type: z.literal('free'),
  includedSeats: uint8,
  uploadLimit: uint16,
})

export type FreePlan = z.infer<typeof FreePlanSchema>

export const FreePlanView = createView(
  {
    type: 'struct',
    fields: [
      ['type', { type: 'char', bytes: 4 }],
      ['includedSeats', { type: 'integer', signed: false, bits: 8 }],
      ['uploadLimit', { type: 'integer', signed: false, bits: 16 }],
    ],
  },
  FreePlanSchema
)

// type TeamPlan: struct {
//   type: 'team'
//   includedSeats: uint8
//   trialLengthDays: uint8
//   billingPeriods: struct {
//     month: struct {
//       pricePerSeat: uint16
//       vendorPlanId: uint32
//     }
//
//     year: struct {
//       pricePerSeat: uint16
//       vendorPlanId: uint32
//     }
//   }
// }

export const TeamPlanSchema = z.object({
  type: z.literal('team'),
  includedSeats: uint8,
  trialLengthDays: uint8,
  billingPeriods: z.object({
    month: z.object({
      pricePerSeat: uint16,
      vendorPlanId: uint32,
    }),
    year: z.object({
      pricePerSeat: uint16,
      vendorPlanId: uint32,
    }),
  }),
})

export type TeamPlan = z.infer<typeof TeamPlanSchema>

export const TeamPlanView = createView(
  {
    type: 'struct',
    fields: [
      ['type', { type: 'char', bytes: 4 }],
      ['includedSeats', { type: 'integer', signed: false, bits: 8 }],
      ['trialLengthDays', { type: 'integer', signed: false, bits: 8 }],
      [
        'billingPeriods',
        {
          type: 'struct',
          fields: [
            [
              'month',
              {
                type: 'struct',
                fields: [
                  [
                    'pricePerSeat',
                    { type: 'integer', signed: false, bits: 16 },
                  ],
                  [
                    'vendorPlanId',
                    { type: 'integer', signed: false, bits: 32 },
                  ],
                ],
              },
            ],

            [
              'year',
              {
                type: 'struct',
                fields: [
                  [
                    'pricePerSeat',
                    { type: 'integer', signed: false, bits: 16 },
                  ],
                  [
                    'vendorPlanId',
                    { type: 'integer', signed: false, bits: 32 },
                  ],
                ],
              },
            ],
          ],
        },
      ],
    ],
  },
  TeamPlanSchema
)
