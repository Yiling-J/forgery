export const EQUIPMENT_CATEGORIES = [
  {
    main_category: 'Headwear',
    sub_categories: ['Helmet', 'Hat', 'Cap', 'Hood', 'Circlet', 'Mask', 'Crown', 'Others'],
  },
  {
    main_category: 'Top',
    sub_categories: [
      'Shirt',
      'Jacket',
      'Hoodie',
      'Vest',
      'Tunic',
      'Armor_Chest',
      'Bra_Top',
      'Cape',
      'Others',
    ],
  },
  {
    main_category: 'Bottom',
    sub_categories: ['Pants', 'Shorts', 'Skirt', 'Leggings', 'Hakama', 'Armor_Legs', 'Others'],
  },
  {
    main_category: 'Full_Body',
    sub_categories: ['Robe', 'Jumpsuit', 'Dress', 'Armor_Suit', 'Exosuit', 'Others'],
  },
  {
    main_category: 'Handwear',
    sub_categories: ['Gloves', 'Gauntlets', 'Bracers', 'Wristbands', 'Rings', 'Others'],
  },
  {
    main_category: 'Footwear',
    sub_categories: ['Boots', 'Sneakers', 'Sandals', 'Heels', 'Greaves', 'Others'],
  },
  {
    main_category: 'Weapon',
    sub_categories: [
      'Sword',
      'Greatsword',
      'Dagger',
      'Spear',
      'Bow',
      'Firearm',
      'Shield',
      'Staff',
      'Others',
    ],
  },
  {
    main_category: 'Accessory',
    sub_categories: [
      'Scarf',
      'Necklace',
      'Belt',
      'Sash',
      'Glasses',
      'Goggles',
      'Earpiece',
      'Wing',
      'Others',
    ],
  },
  {
    main_category: 'Storage',
    sub_categories: ['Quiver', 'Scabbard', 'Pouch', 'Backpack', 'Holster', 'Bandolier', 'Others'],
  },
  {
    main_category: 'Utility_Prop',
    sub_categories: ['Gadget', 'Phone', 'Flashlight', 'Potion', 'Tool', 'Book_Scroll', 'Others'],
  },
  {
    main_category: 'Others',
    sub_categories: ['Others'],
  },
] as const

export type MainCategory = (typeof EQUIPMENT_CATEGORIES)[number]['main_category']
export type SubCategory = (typeof EQUIPMENT_CATEGORIES)[number]['sub_categories'][number]

export function getSubCategories(mainCategory: string): readonly string[] {
  const category = EQUIPMENT_CATEGORIES.find((c) => c.main_category === mainCategory)
  return category ? category.sub_categories : []
}
