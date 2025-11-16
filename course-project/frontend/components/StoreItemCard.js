'use client';

import Image from 'next/image';
import Symbol from './Symbol';
import colors from '../constants/colors';
import styles from './StoreItemCard.module.css';

/**
 * StoreItemCard Component
 *
 * Displays a shop item in a card format showing:
 * - Item image
 * - Item name
 * - Item price with coin symbol
 * - Owned indicator (if user owns the item)
 * - Equipped indicator (if item is equipped)
 *
 * @param {Object} item - Shop item object from API
 * @param {string} item.id - Item UUID
 * @param {string} item.name - Item name
 * @param {number} item.price - Item price in coins
 * @param {string} item.image_url - Path to item image
 * @param {string} [item.rarity] - Item rarity: common, rare, epic, legendary
 * @param {boolean} owned - Whether the user owns this item
 * @param {boolean} equipped - Whether the item is currently equipped
 * @param {Function} onClick - Callback when card is clicked
 */
export default function StoreItemCard({
  item,
  owned = false,
  equipped = false,
  onClick,
}) {
  // Get rarity color
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary':
        return colors.primaryYellow;
      case 'epic':
        return colors.primaryPurple;
      case 'rare':
        return colors.primaryBlue;
      case 'common':
      default:
        return colors.mediumGray;
    }
  };

  const rarityColor = getRarityColor(item.rarity);

  return (
    <div
      className={styles.container}
      onClick={onClick}
      style={{
        borderColor: owned ? colors.primaryGreen : rarityColor,
        cursor: 'pointer',
      }}
    >
      {/* Status Badges */}
      <div className={styles.badges}>
        {equipped && (
          <div className={styles.badge} style={{ backgroundColor: colors.primaryGreen }}>
            <Symbol name="Check Mark" size={12} colour={colors.white} />
            <span>Equipped</span>
          </div>
        )}
        {owned && !equipped && (
          <div className={styles.badge} style={{ backgroundColor: colors.primaryBlue }}>
            <span>Owned</span>
          </div>
        )}
      </div>

      {/* Item Image */}
      <div className={styles.imageContainer}>
        <Image
          src={item.image_url ? `/${item.image_url}` : '/placeholder.png'}
          alt={item.name}
          width={120}
          height={120}
          className={styles.image}
        />
      </div>

      {/* Item Info */}
      <div className={styles.info}>
        <h3 className={styles.name}>{item.name}</h3>

        <div className={styles.priceContainer}>
          <Symbol
            name="Coin"
            size={16}
            colour={colors.black}
          />
          <span className={styles.price}>{item.price}</span>
        </div>
      </div>
    </div>
  );
}
