export const EQUIPMENT_CATEGORIES = [
  {
    main_category: 'Headwear',
  },
  {
    main_category: 'Top',
  },
  {
    main_category: 'Bottom',
  },
  {
    main_category: 'Full_Body',
  },
  {
    main_category: 'Handwear',
  },
  {
    main_category: 'Footwear',
  },
  {
    main_category: 'Weapon',
  },
  {
    main_category: 'Accessory',
  },
  {
    main_category: 'Storage',
  },
  {
    main_category: 'Utility_Prop',
  },
  {
    main_category: 'Others',
  },
] as const

export type MainCategory = (typeof EQUIPMENT_CATEGORIES)[number]['main_category']
